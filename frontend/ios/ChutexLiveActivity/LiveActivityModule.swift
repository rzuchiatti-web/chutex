// LiveActivityModule.swift
// Native module to bridge React Native with ActivityKit Live Activities
// Requires iOS 16.1+, NSSupportsLiveActivities = YES in Info.plist

import Foundation
import ActivityKit

@objc(LiveActivityModule)
class LiveActivityModule: NSObject {
    
    @objc static func requiresMainQueueSetup() -> Bool { return false }
    
    // MARK: - Start Live Activity
    
    @objc func startAlertActivity(
        _ alertId: String,
        beneficiaryName: String,
        alertType: String,
        alertTypeLabel: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        guard #available(iOS 16.1, *) else {
            reject("UNSUPPORTED", "Live Activities require iOS 16.1+", nil)
            return
        }
        
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            reject("DISABLED", "Live Activities are disabled by the user", nil)
            return
        }
        
        let attributes = ChutexAlertAttributes(
            alertId: alertId,
            beneficiaryName: beneficiaryName,
            alertType: alertType,
            alertTypeLabel: alertTypeLabel,
            startedAt: ISO8601DateFormatter().string(from: Date())
        )
        
        let initialState = ChutexAlertAttributes.ContentState(
            currentStage: "alert_triggered",
            stageMessage: "Alerte en cours de traitement...",
            intervenantName: nil,
            etaMinutes: nil,
            stagesCompleted: ["alert_triggered"],
            lastUpdate: ISO8601DateFormatter().string(from: Date())
        )
        
        do {
            let activity = try Activity.request(
                attributes: attributes,
                content: .init(state: initialState, staleDate: nil),
                pushType: .token
            )
            
            // Get push token for backend updates
            Task {
                for await pushToken in activity.pushTokenUpdates {
                    let tokenString = pushToken.map { String(format: "%02x", $0) }.joined()
                    // Send token to backend for APNs updates
                    self.registerLiveActivityToken(alertId: alertId, token: tokenString)
                }
            }
            
            resolve(["activityId": activity.id, "alertId": alertId])
        } catch {
            reject("START_FAILED", "Failed to start Live Activity: \(error.localizedDescription)", error)
        }
    }
    
    // MARK: - Update Live Activity
    
    @objc func updateAlertActivity(
        _ alertId: String,
        currentStage: String,
        stageMessage: String,
        intervenantName: String?,
        etaMinutes: NSNumber?,
        stagesCompleted: [String],
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        guard #available(iOS 16.1, *) else {
            reject("UNSUPPORTED", "Live Activities require iOS 16.1+", nil)
            return
        }
        
        Task {
            let activities = Activity<ChutexAlertAttributes>.activities
            guard let activity = activities.first(where: { $0.attributes.alertId == alertId }) else {
                reject("NOT_FOUND", "No active Live Activity for alert \(alertId)", nil)
                return
            }
            
            let updatedState = ChutexAlertAttributes.ContentState(
                currentStage: currentStage,
                stageMessage: stageMessage,
                intervenantName: intervenantName,
                etaMinutes: etaMinutes?.intValue,
                stagesCompleted: stagesCompleted,
                lastUpdate: ISO8601DateFormatter().string(from: Date())
            )
            
            await activity.update(.init(state: updatedState, staleDate: nil))
            resolve(["status": "updated"])
        }
    }
    
    // MARK: - End Live Activity
    
    @objc func endAlertActivity(
        _ alertId: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        guard #available(iOS 16.1, *) else {
            reject("UNSUPPORTED", "Live Activities require iOS 16.1+", nil)
            return
        }
        
        Task {
            let activities = Activity<ChutexAlertAttributes>.activities
            guard let activity = activities.first(where: { $0.attributes.alertId == alertId }) else {
                resolve(["status": "not_found"])
                return
            }
            
            let finalState = ChutexAlertAttributes.ContentState(
                currentStage: "resolved",
                stageMessage: "Alerte resolue",
                intervenantName: nil,
                etaMinutes: nil,
                stagesCompleted: ["alert_triggered", "notifying_guardians", "ai_calling", "guardian_responding", "intervention_active", "resolved"],
                lastUpdate: ISO8601DateFormatter().string(from: Date())
            )
            
            await activity.end(.init(state: finalState, staleDate: nil), dismissalPolicy: .after(.now + 300))
            resolve(["status": "ended"])
        }
    }
    
    // MARK: - Helper: Register push token with backend
    
    private func registerLiveActivityToken(alertId: String, token: String) {
        // This would send the APNs token to the backend
        // so the backend can send Live Activity updates via push
        guard let url = URL(string: "\(getBackendUrl())/api/push/live-activity-token") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        // Auth token would be read from keychain/secure storage
        let body: [String: Any] = ["alert_id": alertId, "apns_token": token]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        URLSession.shared.dataTask(with: request).resume()
    }
    
    private func getBackendUrl() -> String {
        return Bundle.main.object(forInfoDictionaryKey: "BACKEND_URL") as? String ?? ""
    }
}

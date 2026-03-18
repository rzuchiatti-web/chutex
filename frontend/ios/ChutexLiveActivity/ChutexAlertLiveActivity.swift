// ChutexLiveActivity - ActivityKit Live Activities for Chutex Care
// This file defines the data model for iOS Live Activities (iOS 16.1+)
// Used for real-time alert tracking on the Lock Screen and Dynamic Island

import ActivityKit
import WidgetKit
import SwiftUI

// MARK: - Activity Attributes

struct ChutexAlertAttributes: ActivityAttributes {
    /// Static data set when starting the Live Activity
    public struct ContentState: Codable, Hashable {
        var currentStage: String       // "alert_triggered", "ai_calling", etc.
        var stageMessage: String       // "Appel IA en cours..."
        var intervenantName: String?   // Name of the responding person
        var etaMinutes: Int?           // Estimated time of arrival
        var stagesCompleted: [String]  // Completed stage keys
        var lastUpdate: String         // ISO timestamp
    }
    
    // Fixed attributes (set at start, never change)
    var alertId: String
    var beneficiaryName: String
    var alertType: String              // "sos", "fall", etc.
    var alertTypeLabel: String         // "SOS - URGENCE", "Chute detectee"
    var startedAt: String              // ISO timestamp
}

// MARK: - Live Activity View (Lock Screen)

struct ChutexAlertLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: ChutexAlertAttributes.self) { context in
            // Lock Screen / Banner UI
            VStack(spacing: 0) {
                // Header
                HStack(spacing: 10) {
                    // Alert icon
                    ZStack {
                        Circle()
                            .fill(stageColor(context.state.currentStage).opacity(0.2))
                            .frame(width: 40, height: 40)
                        Image(systemName: stageIcon(context.state.currentStage))
                            .foregroundColor(stageColor(context.state.currentStage))
                            .font(.system(size: 16, weight: .bold))
                    }
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(context.attributes.alertTypeLabel)
                            .font(.system(size: 10, weight: .heavy))
                            .foregroundColor(stageColor(context.state.currentStage))
                            .textCase(.uppercase)
                            .tracking(1)
                        
                        Text(context.attributes.beneficiaryName)
                            .font(.system(size: 16, weight: .heavy))
                            .foregroundColor(.white)
                        
                        Text(context.state.stageMessage)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.white.opacity(0.6))
                    }
                    
                    Spacer()
                    
                    if let name = context.state.intervenantName {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(name)
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(Color(hex: "10B981"))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(Color(hex: "10B981").opacity(0.15))
                                .clipShape(Capsule())
                            
                            if let eta = context.state.etaMinutes {
                                Text("\(eta) min")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(.white.opacity(0.5))
                            }
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 14)
                .padding(.bottom, 10)
                
                // Progress bar
                HStack(spacing: 3) {
                    ForEach(allStages, id: \.self) { stage in
                        RoundedRectangle(cornerRadius: 2)
                            .fill(
                                context.state.stagesCompleted.contains(stage)
                                    ? stageColor(context.state.currentStage)
                                    : Color.white.opacity(0.1)
                            )
                            .frame(height: 4)
                            .opacity(
                                stage == context.state.currentStage ? 1.0 :
                                context.state.stagesCompleted.contains(stage) ? 0.8 : 0.3
                            )
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 12)
                
                // Action buttons
                HStack(spacing: 8) {
                    // Follow button
                    Link(destination: URL(string: "chutexcare://alert/\(context.attributes.alertId)")!) {
                        HStack(spacing: 6) {
                            Image(systemName: "location.fill")
                                .font(.system(size: 12))
                            Text("Suivre")
                                .font(.system(size: 12, weight: .bold))
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(stageColor(context.state.currentStage).opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(stageColor(context.state.currentStage).opacity(0.3), lineWidth: 1)
                        )
                    }
                    
                    // Call button
                    Link(destination: URL(string: "chutexcare://call/\(context.attributes.alertId)")!) {
                        HStack(spacing: 6) {
                            Image(systemName: "phone.fill")
                                .font(.system(size: 12))
                            Text("Appeler")
                                .font(.system(size: 12, weight: .bold))
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(Color(hex: "10B981").opacity(0.12))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color(hex: "10B981").opacity(0.25), lineWidth: 1)
                        )
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 14)
            }
            .background(
                LinearGradient(
                    colors: [Color(hex: "141423").opacity(0.97), Color(hex: "0A0A14").opacity(0.98)],
                    startPoint: .topLeading, endPoint: .bottomTrailing
                )
            )
            
        } dynamicIsland: { context in
            // Dynamic Island (iPhone 14 Pro+)
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: stageIcon(context.state.currentStage))
                        .foregroundColor(stageColor(context.state.currentStage))
                        .font(.system(size: 20, weight: .bold))
                        .padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    if let eta = context.state.etaMinutes {
                        Text("\(eta)m")
                            .font(.system(size: 14, weight: .heavy))
                            .foregroundColor(.white)
                    }
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(context.attributes.beneficiaryName)
                            .font(.system(size: 14, weight: .heavy))
                            .foregroundColor(.white)
                        Text(context.state.stageMessage)
                            .font(.system(size: 11))
                            .foregroundColor(.white.opacity(0.6))
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    // Progress bar in expanded island
                    HStack(spacing: 3) {
                        ForEach(allStages, id: \.self) { stage in
                            RoundedRectangle(cornerRadius: 2)
                                .fill(
                                    context.state.stagesCompleted.contains(stage)
                                        ? stageColor(context.state.currentStage)
                                        : Color.white.opacity(0.1)
                                )
                                .frame(height: 3)
                        }
                    }
                    .padding(.horizontal, 4)
                }
            } compactLeading: {
                Image(systemName: stageIcon(context.state.currentStage))
                    .foregroundColor(stageColor(context.state.currentStage))
                    .font(.system(size: 12, weight: .bold))
            } compactTrailing: {
                Text(context.attributes.beneficiaryName.prefix(8))
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.white)
            } minimal: {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.red)
                    .font(.system(size: 12))
            }
        }
    }
    
    // MARK: - Helpers
    
    private var allStages: [String] {
        ["alert_triggered", "notifying_guardians", "ai_calling", "guardian_responding", "intervention_active", "resolved"]
    }
    
    private func stageColor(_ stage: String) -> Color {
        switch stage {
        case "alert_triggered": return Color(hex: "EF4444")
        case "notifying_guardians": return Color(hex: "F59E0B")
        case "ai_calling": return Color(hex: "A78BFA")
        case "guardian_responding": return Color(hex: "38BDF8")
        case "intervention_active": return Color(hex: "10B981")
        case "resolved": return Color(hex: "10B981")
        default: return Color(hex: "EF4444")
        }
    }
    
    private func stageIcon(_ stage: String) -> String {
        switch stage {
        case "alert_triggered": return "exclamationmark.triangle.fill"
        case "notifying_guardians": return "bell.badge.fill"
        case "ai_calling": return "phone.arrow.up.right.fill"
        case "guardian_responding": return "person.fill.checkmark"
        case "intervention_active": return "figure.run"
        case "resolved": return "checkmark.seal.fill"
        default: return "exclamationmark.triangle.fill"
        }
    }
}

// MARK: - Color Extension

extension Color {
    init(hex: String) {
        let scanner = Scanner(string: hex)
        var rgbValue: UInt64 = 0
        scanner.scanHexInt64(&rgbValue)
        let r = Double((rgbValue & 0xFF0000) >> 16) / 255.0
        let g = Double((rgbValue & 0x00FF00) >> 8) / 255.0
        let b = Double(rgbValue & 0x0000FF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
}

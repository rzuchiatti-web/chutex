"""Add foreign keys between tables.

À appliquer APRÈS que les données legacy aient été nettoyées (suppression
des références orphelines). Si tu as des doutes, lance d'abord :

    python scripts/find_orphans.py

Convention :
- CASCADE : données strictement liées à un utilisateur (alertes, mesures, sessions...)
- SET NULL : références « molles » (audit, traces) qui survivent à la suppression

Revision ID: 0002_add_foreign_keys
Revises: 0001_initial_schema
Create Date: 2026-02-01

"""
from alembic import op

revision = "0002_add_foreign_keys"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


# (constraint_name, source_table, source_col, target_table, target_col, ondelete)
FOREIGN_KEYS: list[tuple[str, str, str, str, str, str]] = [
    # --- Alerts & téléassistance ---
    ("fk_alerts_beneficiary", "alerts", "beneficiary_id", "users", "id", "CASCADE"),
    ("fk_alerts_resolved_by", "alerts", "resolved_by", "users", "id", "SET NULL"),
    ("fk_predictive_alerts_user", "predictive_alerts", "user_id", "users", "id", "CASCADE"),
    ("fk_alert_tracking_alert", "alert_tracking", "alert_id", "alerts", "id", "CASCADE"),
    ("fk_alert_live_status_alert", "alert_live_status", "alert_id", "alerts", "id", "CASCADE"),
    ("fk_escalations_alert", "escalations", "alert_id", "alerts", "id", "CASCADE"),
    ("fk_escalations_beneficiary", "escalations", "beneficiary_id", "users", "id", "CASCADE"),
    ("fk_teleassistance_calls_alert", "teleassistance_calls", "alert_id", "alerts", "id", "SET NULL"),
    ("fk_teleassistance_calls_beneficiary", "teleassistance_calls", "beneficiary_id", "users", "id", "CASCADE"),
    ("fk_twilio_calls_alert", "twilio_calls", "alert_id", "alerts", "id", "SET NULL"),
    ("fk_speech_responses_alert", "speech_responses", "alert_id", "alerts", "id", "CASCADE"),
    ("fk_teleconsults_user", "teleconsults", "user_id", "users", "id", "CASCADE"),
    ("fk_interventions_alert", "interventions", "alert_id", "alerts", "id", "SET NULL"),
    ("fk_interventions_beneficiary", "interventions", "beneficiary_id", "users", "id", "CASCADE"),
    ("fk_intervention_tracking_intervention", "intervention_tracking", "intervention_id", "interventions", "id", "CASCADE"),
    ("fk_incidents_user", "incidents", "user_id", "users", "id", "CASCADE"),
    ("fk_carewatch_incidents_user", "carewatch_incidents", "user_id", "users", "id", "CASCADE"),
    ("fk_live_activity_tokens_user", "live_activity_tokens", "user_id", "users", "id", "CASCADE"),
    ("fk_live_activity_tokens_alert", "live_activity_tokens", "alert_id", "alerts", "id", "CASCADE"),

    # --- Devices & health ---
    ("fk_devices_user", "devices", "user_id", "users", "id", "CASCADE"),
    ("fk_bracelet_commands_user", "bracelet_commands", "user_id", "users", "id", "CASCADE"),
    ("fk_lefu_devices_user", "lefu_devices", "user_id", "users", "id", "SET NULL"),
    ("fk_dorsi_bilans_user", "dorsi_bilans", "user_id", "users", "id", "CASCADE"),
    ("fk_dorsi_programs_user", "dorsi_programs", "user_id", "users", "id", "CASCADE"),
    ("fk_dorsi_programs_bilan", "dorsi_programs", "bilan_id", "dorsi_bilans", "id", "SET NULL"),
    ("fk_locations_user", "locations", "user_id", "users", "id", "CASCADE"),
    ("fk_geofences_user", "geofences", "user_id", "users", "id", "CASCADE"),
    ("fk_health_vitals_user", "health_vitals", "user_id", "users", "id", "CASCADE"),
    ("fk_latest_vitals_user", "latest_vitals", "user_id", "users", "id", "CASCADE"),
    ("fk_ecg_records_user", "ecg_records", "user_id", "users", "id", "CASCADE"),
    ("fk_glycemia_history_user", "glycemia_history", "user_id", "users", "id", "CASCADE"),
    ("fk_glycemia_calibrations_user", "glycemia_calibrations", "user_id", "users", "id", "CASCADE"),
    ("fk_weighings_user", "weighings", "user_id", "users", "id", "CASCADE"),
    ("fk_device_readings_user", "device_readings", "user_id", "users", "id", "SET NULL"),
    ("fk_scale_members_user", "scale_members", "user_id", "users", "id", "CASCADE"),
    ("fk_thresholds_user", "thresholds", "user_id", "users", "id", "CASCADE"),
    ("fk_dashboard_summary_user", "dashboard_summary", "user_id", "users", "id", "CASCADE"),
    ("fk_daily_report_cache_user", "daily_report_cache", "user_id", "users", "id", "CASCADE"),
    ("fk_health_summary_cache_user", "health_summary_cache", "user_id", "users", "id", "CASCADE"),
    ("fk_body_age_cache_user", "body_age_cache", "user_id", "users", "id", "CASCADE"),
    ("fk_health_data_user", "health_data", "user_id", "users", "id", "CASCADE"),

    # --- Shop / Paiement ---
    ("fk_subscriptions_beneficiary", "subscriptions", "beneficiary_id", "users", "id", "SET NULL"),
    ("fk_payment_history_subscription", "payment_history", "subscription_id", "subscriptions", "id", "CASCADE"),
    ("fk_payment_history_beneficiary", "payment_history", "beneficiary_id", "users", "id", "SET NULL"),
    ("fk_payment_history_professional", "payment_history", "professional_id", "users", "id", "SET NULL"),
    ("fk_internal_invoices_contract", "internal_invoices", "contract_id", "contracts", "id", "SET NULL"),
    ("fk_prescriptions_guardian", "prescriptions", "guardian_id", "users", "id", "SET NULL"),
    ("fk_prescriptions_beneficiary", "prescriptions", "beneficiary_id", "users", "id", "SET NULL"),
    ("fk_prescriptions_contract", "prescriptions", "contract_id", "contracts", "id", "SET NULL"),

    # --- Guardian / SAAD / Activation ---
    ("fk_guardians_guardian", "guardians", "guardian_id", "users", "id", "CASCADE"),
    ("fk_guardians_beneficiary", "guardians", "beneficiary_id", "users", "id", "CASCADE"),
    ("fk_guardian_beneficiaries_guardian", "guardian_beneficiaries", "guardian_id", "users", "id", "CASCADE"),
    ("fk_guardian_beneficiaries_beneficiary", "guardian_beneficiaries", "beneficiary_id", "users", "id", "CASCADE"),
    ("fk_guardian_relationships_guardian", "guardian_relationships", "guardian_id", "users", "id", "CASCADE"),
    ("fk_guardian_relationships_beneficiary", "guardian_relationships", "beneficiary_id", "users", "id", "CASCADE"),
    ("fk_guardian_permissions_guardian", "guardian_permissions", "guardian_id", "users", "id", "CASCADE"),
    ("fk_guardian_permissions_beneficiary", "guardian_permissions", "beneficiary_id", "users", "id", "CASCADE"),
    ("fk_guardian_requests_beneficiary", "guardian_requests", "beneficiary_id", "users", "id", "CASCADE"),
    ("fk_guardian_invitations_beneficiary", "guardian_invitations", "beneficiary_id", "users", "id", "CASCADE"),
    ("fk_guardian_links_guardian", "guardian_links", "guardian_id", "users", "id", "CASCADE"),
    ("fk_guardian_links_beneficiary", "guardian_links", "beneficiary_id", "users", "id", "CASCADE"),
    ("fk_link_codes_user", "link_codes", "user_id", "users", "id", "CASCADE"),
    ("fk_agencies_company", "agencies", "company_id", "users", "id", "CASCADE"),
    ("fk_saad_guardian_links_company", "saad_guardian_links", "company_id", "users", "id", "CASCADE"),
    ("fk_saad_guardian_links_guardian", "saad_guardian_links", "guardian_id", "users", "id", "CASCADE"),
    ("fk_saad_commissions_contract", "saad_commissions", "contract_id", "contracts", "id", "SET NULL"),

    # --- Espace pro ---
    ("fk_pro_subscriptions_pro", "pro_subscriptions", "professional_id", "users", "id", "CASCADE"),
    ("fk_pro_conversations_pro", "pro_conversations", "professional_id", "users", "id", "CASCADE"),
    ("fk_pro_conversations_ben", "pro_conversations", "beneficiary_id", "users", "id", "CASCADE"),
    ("fk_pro_messages_conversation", "pro_messages", "conversation_id", "pro_conversations", "id", "CASCADE"),
    ("fk_pro_notifications_pro", "pro_notifications", "professional_id", "users", "id", "CASCADE"),
    ("fk_pro_exercise_templates_pro", "pro_exercise_templates", "professional_id", "users", "id", "CASCADE"),
    ("fk_pro_assigned_exercises_template", "pro_assigned_exercises", "exercise_template_id", "pro_exercise_templates", "id", "SET NULL"),
    ("fk_pro_assigned_exercises_pro", "pro_assigned_exercises", "professional_id", "users", "id", "SET NULL"),
    ("fk_pro_assigned_exercises_ben", "pro_assigned_exercises", "beneficiary_id", "users", "id", "CASCADE"),
    ("fk_pro_meal_templates_pro", "pro_meal_templates", "professional_id", "users", "id", "CASCADE"),
    ("fk_pro_assigned_meals_pro", "pro_assigned_meals", "professional_id", "users", "id", "SET NULL"),
    ("fk_pro_assigned_meals_ben", "pro_assigned_meals", "beneficiary_id", "users", "id", "CASCADE"),
    ("fk_pro_meals_ben", "pro_meals", "beneficiary_id", "users", "id", "CASCADE"),
    ("fk_pro_meals_pro", "pro_meals", "professional_id", "users", "id", "SET NULL"),
    ("fk_pro_reminder_templates_pro", "pro_reminder_templates", "professional_id", "users", "id", "CASCADE"),
    ("fk_pro_assigned_reminders_pro", "pro_assigned_reminders", "professional_id", "users", "id", "SET NULL"),
    ("fk_pro_assigned_reminders_ben", "pro_assigned_reminders", "beneficiary_id", "users", "id", "CASCADE"),
    ("fk_pro_programs_pro", "pro_programs", "professional_id", "users", "id", "CASCADE"),
    ("fk_pro_programs_ben", "pro_programs", "beneficiary_id", "users", "id", "CASCADE"),

    # --- Programs / Teams / Minceur ---
    ("fk_program_enrollments_user", "program_enrollments", "user_id", "users", "id", "CASCADE"),
    ("fk_program_enrollments_program", "program_enrollments", "program_id", "programs", "id", "CASCADE"),
    ("fk_program_checkins_user", "program_checkins", "user_id", "users", "id", "CASCADE"),
    ("fk_program_checkins_program", "program_checkins", "program_id", "programs", "id", "CASCADE"),
    ("fk_program_task_progress_user", "program_task_progress", "user_id", "users", "id", "CASCADE"),
    ("fk_program_task_progress_enrollment", "program_task_progress", "enrollment_id", "program_enrollments", "id", "CASCADE"),
    ("fk_program_health_baselines_user", "program_health_baselines", "user_id", "users", "id", "CASCADE"),
    ("fk_program_health_baselines_program", "program_health_baselines", "program_id", "programs", "id", "CASCADE"),
    ("fk_team_programs_program", "team_programs", "program_id", "programs", "id", "CASCADE"),
    ("fk_team_programs_created_by", "team_programs", "created_by", "users", "id", "SET NULL"),
    ("fk_team_activity_feed_team", "team_activity_feed", "team_id", "team_programs", "id", "CASCADE"),
    ("fk_team_activity_feed_user", "team_activity_feed", "user_id", "users", "id", "CASCADE"),
    ("fk_team_invitations_team", "team_invitations", "team_id", "team_programs", "id", "CASCADE"),
    ("fk_minceur_goals_user", "minceur_goals", "user_id", "users", "id", "CASCADE"),
    ("fk_minceur_programs_user", "minceur_programs", "user_id", "users", "id", "CASCADE"),
    ("fk_minceur_tracking_user", "minceur_tracking", "user_id", "users", "id", "CASCADE"),
    ("fk_minceur_daily_cache_user", "minceur_daily_cache", "user_id", "users", "id", "CASCADE"),

    # --- Notifications & rappels ---
    ("fk_notifications_user", "notifications", "user_id", "users", "id", "CASCADE"),
    ("fk_push_tokens_user", "push_tokens", "user_id", "users", "id", "CASCADE"),
    ("fk_push_subscriptions_user", "push_subscriptions", "user_id", "users", "id", "CASCADE"),
    ("fk_push_preferences_user", "push_preferences", "user_id", "users", "id", "CASCADE"),
    ("fk_push_log_user", "push_log", "user_id", "users", "id", "CASCADE"),
    ("fk_push_history_user", "push_history", "user_id", "users", "id", "CASCADE"),
    ("fk_reminders_user", "reminders", "user_id", "users", "id", "CASCADE"),
    ("fk_reminder_vibrations_user", "reminder_vibrations", "user_id", "users", "id", "CASCADE"),
    ("fk_reminder_vibrations_reminder", "reminder_vibrations", "reminder_id", "reminders", "id", "CASCADE"),
    ("fk_sleep_alarms_user", "sleep_alarms", "user_id", "users", "id", "CASCADE"),
    ("fk_wake_vibrations_user", "wake_vibrations", "user_id", "users", "id", "CASCADE"),
    ("fk_bedtime_notifications_user", "bedtime_notifications", "user_id", "users", "id", "CASCADE"),

    # --- Misc ---
    ("fk_chat_messages_user", "chat_messages", "user_id", "users", "id", "CASCADE"),
    ("fk_user_streaks_user", "user_streaks", "user_id", "users", "id", "CASCADE"),
    ("fk_activity_streaks_user", "activity_streaks", "user_id", "users", "id", "CASCADE"),
    ("fk_reward_winners_user", "reward_winners", "user_id", "users", "id", "CASCADE"),
    ("fk_rewards_history_user", "rewards_history", "user_id", "users", "id", "CASCADE"),
    ("fk_recommendations_user", "recommendations", "user_id", "users", "id", "CASCADE"),
    ("fk_nora_analysis_cache_user", "nora_analysis_cache", "user_id", "users", "id", "CASCADE"),
    ("fk_nora_page_analysis_cache_user", "nora_page_analysis_cache", "user_id", "users", "id", "CASCADE"),
    ("fk_nora_health_analysis_cache_user", "nora_health_analysis_cache", "user_id", "users", "id", "CASCADE"),
    ("fk_nora_aging_analysis_cache_user", "nora_aging_analysis_cache", "user_id", "users", "id", "CASCADE"),
    ("fk_rgpd_requests_user", "rgpd_requests", "user_id", "users", "id", "CASCADE"),
    ("fk_user_consents_user", "user_consents", "user_id", "users", "id", "CASCADE"),
    ("fk_medications_user", "medications", "user_id", "users", "id", "CASCADE"),
    ("fk_shared_reports_user", "shared_reports", "user_id", "users", "id", "CASCADE"),
    ("fk_visit_observations_user", "visit_observations", "user_id", "users", "id", "CASCADE"),
    ("fk_visit_observations_intervention", "visit_observations", "intervention_id", "interventions", "id", "CASCADE"),
]


def upgrade() -> None:
    for name, src, src_col, dst, dst_col, ondelete in FOREIGN_KEYS:
        op.create_foreign_key(
            name, src, dst, [src_col], [dst_col], ondelete=ondelete,
        )


def downgrade() -> None:
    for name, src, *_ in FOREIGN_KEYS:
        op.drop_constraint(name, src, type_="foreignkey")

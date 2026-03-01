"""
Chutex Care - Email Service via Mailjet
Handles all transactional emails: welcome, subscription, guardian invite, payment alerts
"""
import os
import logging
from mailjet_rest import Client
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

MJ_PUBLIC = os.environ.get("MJ_APIKEY_PUBLIC", "")
MJ_PRIVATE = os.environ.get("MJ_APIKEY_PRIVATE", "")
MJ_SENDER = os.environ.get("MJ_SENDER_EMAIL", "contact@chutex-innovation.com")
MJ_SENDER_NAME = os.environ.get("MJ_SENDER_NAME", "Chutex Care")

LOGO_URL = "https://cdn.shopify.com/s/files/1/0886/1918/8558/files/Logo_chutex_1.png?v=1737551429"
APP_URL = "https://apps.apple.com/app/chutex/id6759215592"
SITE_URL = "https://chutex-innovation.com"


def _get_client():
    if not MJ_PUBLIC or not MJ_PRIVATE:
        return None
    return Client(auth=(MJ_PUBLIC, MJ_PRIVATE), version="v3.1")


def _base_template(content: str, preview: str = "") -> str:
    """Base HTML email template with Chutex branding"""
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chutex Care</title>
</head>
<body style="margin:0;padding:0;background:#0a0a1a;font-family:'Helvetica Neue',Arial,sans-serif;color:#ffffff;">
<div style="max-width:520px;margin:0 auto;padding:0;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1a1035 0%,#0d1b3e 50%,#0a0a1a 100%);padding:40px 32px 30px;text-align:center;border-radius:0 0 24px 24px;">
    <img src="{LOGO_URL}" alt="Chutex" style="height:48px;margin-bottom:8px;" />
    <div style="font-size:11px;color:rgba(167,139,250,0.6);letter-spacing:2px;text-transform:uppercase;font-weight:600;">Care</div>
  </div>

  <!-- Content -->
  <div style="padding:32px 28px 24px;">
    {content}
  </div>

  <!-- Footer -->
  <div style="padding:24px 28px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
    <div style="margin-bottom:16px;">
      <a href="{SITE_URL}" style="color:rgba(255,255,255,0.3);font-size:12px;text-decoration:none;margin:0 8px;">Site web</a>
      <span style="color:rgba(255,255,255,0.1);">|</span>
      <a href="{APP_URL}" style="color:rgba(255,255,255,0.3);font-size:12px;text-decoration:none;margin:0 8px;">App iOS</a>
      <span style="color:rgba(255,255,255,0.1);">|</span>
      <a href="mailto:contact@chutex-innovation.com" style="color:rgba(255,255,255,0.3);font-size:12px;text-decoration:none;margin:0 8px;">Contact</a>
    </div>
    <div style="font-size:11px;color:rgba(255,255,255,0.15);line-height:1.6;">
      Chutex Innovation SAS — 42000 Saint-Etienne<br>
      Cet email a ete envoye automatiquement, merci de ne pas y repondre.
    </div>
  </div>

</div>
</body>
</html>"""


def _send(to_email: str, to_name: str, subject: str, html: str) -> bool:
    """Send email via Mailjet. Returns True on success."""
    client = _get_client()
    if not client:
        logger.warning(f"Mailjet not configured, skipping email to {to_email}")
        return False
    try:
        result = client.send.create(data={
            "Messages": [{
                "From": {"Email": MJ_SENDER, "Name": MJ_SENDER_NAME},
                "To": [{"Email": to_email, "Name": to_name}],
                "Subject": subject,
                "HTMLPart": html,
            }]
        })
        status = result.status_code
        if status == 200:
            logger.info(f"Email sent to {to_email}: {subject}")
            return True
        else:
            logger.error(f"Mailjet error {status}: {result.json()}")
            return False
    except Exception as e:
        logger.error(f"Email send error: {e}")
        return False


# ==================== EMAIL TEMPLATES ====================

async def send_welcome_email(name: str, email: str, phone: str):
    """Email de bienvenue a la creation de compte"""
    content = f"""
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,rgba(14,116,144,0.3),rgba(34,211,238,0.2));border:1px solid rgba(34,211,238,0.3);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:28px;">&#x1F44B;</span>
      </div>
      <h1 style="font-size:24px;font-weight:800;color:#ffffff;margin:0 0 8px;">Bienvenue {name} !</h1>
      <p style="font-size:14px;color:rgba(255,255,255,0.5);margin:0;line-height:1.6;">Votre compte Chutex Care a ete cree avec succes.</p>
    </div>

    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:20px;margin-bottom:20px;">
      <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.3);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;">Vos identifiants</div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
        <span style="font-size:14px;">&#x1F4F1;</span>
        <div>
          <div style="font-size:11px;color:rgba(255,255,255,0.35);">Telephone</div>
          <div style="font-size:15px;font-weight:700;color:#ffffff;">{phone}</div>
        </div>
      </div>
    </div>

    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:20px;margin-bottom:24px;">
      <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.3);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;">Prochaines etapes</div>
      <div style="margin-bottom:12px;display:flex;align-items:flex-start;gap:12px;">
        <div style="width:24px;height:24px;border-radius:8px;background:rgba(34,211,238,0.15);color:#22D3EE;font-size:12px;font-weight:800;text-align:center;line-height:24px;flex-shrink:0;">1</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.5;">Telechargez l'application Chutex sur l'App Store</div>
      </div>
      <div style="margin-bottom:12px;display:flex;align-items:flex-start;gap:12px;">
        <div style="width:24px;height:24px;border-radius:8px;background:rgba(34,211,238,0.15);color:#22D3EE;font-size:12px;font-weight:800;text-align:center;line-height:24px;flex-shrink:0;">2</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.5;">Connectez-vous avec votre numero de telephone</div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:12px;">
        <div style="width:24px;height:24px;border-radius:8px;background:rgba(34,211,238,0.15);color:#22D3EE;font-size:12px;font-weight:800;text-align:center;line-height:24px;flex-shrink:0;">3</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.5;">Associez votre bracelet Elio et commencez le suivi</div>
      </div>
    </div>

    <div style="text-align:center;">
      <a href="{APP_URL}" style="display:inline-block;padding:14px 32px;border-radius:999px;background:#ffffff;color:#0a0a1a;font-size:14px;font-weight:700;text-decoration:none;">Telecharger l'application</a>
    </div>
    """
    html = _base_template(content)
    _send(email, name, "Bienvenue sur Chutex Care", html)


async def send_subscription_confirmation(name: str, email: str, sub_type: str, phone: str, source: str = ""):
    """Email de confirmation de souscription (bracelet ou Care)"""
    is_care = sub_type in ("care", "bracelet_gilet")
    plan_name = "Chutex Care" if is_care else "Bracelet Elio"
    plan_price = "39,90" if is_care else "24,90"
    accent = "#A78BFA" if is_care else "#3B82F6"
    icon = "&#x1F6E1;" if is_care else "&#x231A;"

    features = (
        ["Bracelet connecte Elio", "Teleassistance 24/7", "Intervenants a domicile", "Suivi GPS temps reel", "Notifications gardiens", "Rapports d'intervention"]
        if is_care else
        ["Bracelet connecte Elio", "Suivi cardiaque continu", "SpO2 et temperature", "Detection de chute", "Historique de sante", "Application mobile"]
    )

    features_html = "".join([
        f'<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">'
        f'<span style="color:{accent};font-size:14px;">&#x2713;</span>'
        f'<span style="font-size:13px;color:rgba(255,255,255,0.65);">{f}</span></div>'
        for f in features
    ])

    content = f"""
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,{accent}40,{accent}20);border:1px solid {accent}60;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:28px;">{icon}</span>
      </div>
      <h1 style="font-size:24px;font-weight:800;color:#ffffff;margin:0 0 8px;">Abonnement active</h1>
      <p style="font-size:14px;color:rgba(255,255,255,0.5);margin:0;">Votre abonnement {plan_name} est maintenant actif.</p>
    </div>

    <!-- Plan card -->
    <div style="background:rgba(255,255,255,0.04);border:1px solid {accent}30;border-radius:16px;padding:20px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div>
          <div style="font-size:18px;font-weight:800;color:#ffffff;">{plan_name}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:2px;">Abonnement mensuel</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:22px;font-weight:900;color:#ffffff;">{plan_price} EUR</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.3);">/mois</div>
        </div>
      </div>
      <div style="height:1px;background:rgba(255,255,255,0.06);margin:0 0 16px;"></div>
      <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.3);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">Inclus</div>
      {features_html}
    </div>

    <!-- Beneficiary info -->
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:16px 20px;margin-bottom:24px;">
      <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:4px;">Beneficiaire</div>
      <div style="font-size:15px;font-weight:700;color:#ffffff;">{name}</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:2px;">{phone}</div>
    </div>

    <div style="text-align:center;">
      <a href="{APP_URL}" style="display:inline-block;padding:14px 32px;border-radius:999px;background:#ffffff;color:#0a0a1a;font-size:14px;font-weight:700;text-decoration:none;">Ouvrir l'application</a>
    </div>
    """
    html = _base_template(content)
    _send(email, name, f"Votre abonnement {plan_name} est actif", html)


async def send_guardian_invite_email(beneficiary_name: str, guardian_email: str, guardian_name: str):
    """Email d'invitation pour devenir gardien"""
    content = f"""
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,rgba(16,185,129,0.3),rgba(52,211,153,0.2));border:1px solid rgba(16,185,129,0.4);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:28px;">&#x1F49A;</span>
      </div>
      <h1 style="font-size:24px;font-weight:800;color:#ffffff;margin:0 0 8px;">Vous etes invite</h1>
      <p style="font-size:14px;color:rgba(255,255,255,0.5);margin:0;line-height:1.6;">{beneficiary_name} souhaite vous ajouter comme gardien sur Chutex Care.</p>
    </div>

    <!-- What is a guardian -->
    <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);border-radius:16px;padding:20px;margin-bottom:20px;">
      <div style="font-size:10px;font-weight:700;color:rgba(16,185,129,0.6);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;">Votre role de gardien</div>
      <div style="margin-bottom:12px;display:flex;align-items:flex-start;gap:10px;">
        <span style="color:#10B981;font-size:14px;flex-shrink:0;">&#x1F514;</span>
        <div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.5;"><strong style="color:#FFF;">Alertes en temps reel</strong> — Recevez des notifications en cas de chute, SOS ou anomalie de sante.</div>
      </div>
      <div style="margin-bottom:12px;display:flex;align-items:flex-start;gap:10px;">
        <span style="color:#10B981;font-size:14px;flex-shrink:0;">&#x1F4DE;</span>
        <div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.5;"><strong style="color:#FFF;">Appels d'escalade</strong> — La teleassistance vous contactera selon l'ordre defini par {beneficiary_name}.</div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:10px;">
        <span style="color:#10B981;font-size:14px;flex-shrink:0;">&#x1F4CA;</span>
        <div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.5;"><strong style="color:#FFF;">Suivi sante</strong> — Consultez les donnees de sante de votre proche depuis l'app.</div>
      </div>
    </div>

    <div style="text-align:center;margin-bottom:16px;">
      <a href="{APP_URL}" style="display:inline-block;padding:14px 32px;border-radius:999px;background:#10B981;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Creer mon compte gardien</a>
    </div>
    <div style="text-align:center;">
      <p style="font-size:12px;color:rgba(255,255,255,0.3);line-height:1.5;">Telechargez l'application Chutex, inscrivez-vous en tant que <strong>gardien</strong>, et vous serez automatiquement lie a {beneficiary_name}.</p>
    </div>
    """
    html = _base_template(content)
    _send(guardian_email, guardian_name, f"{beneficiary_name} vous invite comme gardien sur Chutex Care", html)


async def send_payment_failed_email(name: str, email: str, sub_type: str, attempt: int = 1):
    """Email d'alerte echec de paiement"""
    plan_name = "Chutex Care" if sub_type in ("care", "bracelet_gilet") else "Bracelet Elio"
    is_final = attempt >= 3

    if is_final:
        status_msg = "Votre abonnement a ete suspendu suite a un echec de paiement repete."
        status_color = "#EF4444"
        action_text = "Votre service sera retabli automatiquement des la mise a jour de votre moyen de paiement."
    else:
        status_msg = f"Le prelevement de votre abonnement {plan_name} a echoue (tentative {attempt}/3)."
        status_color = "#F59E0B"
        action_text = "Nous retenterons le prelevement dans les prochains jours. Verifiez votre moyen de paiement."

    content = f"""
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:64px;height:64px;border-radius:20px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:28px;">&#x26A0;</span>
      </div>
      <h1 style="font-size:24px;font-weight:800;color:#ffffff;margin:0 0 8px;">Echec de paiement</h1>
      <p style="font-size:14px;color:{status_color};margin:0;line-height:1.6;font-weight:600;">{status_msg}</p>
    </div>

    <div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:16px;padding:20px;margin-bottom:20px;">
      <div style="font-size:10px;font-weight:700;color:rgba(239,68,68,0.5);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">Details</div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:13px;color:rgba(255,255,255,0.4);">Abonnement</span>
        <span style="font-size:13px;font-weight:700;color:#ffffff;">{plan_name}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:13px;color:rgba(255,255,255,0.4);">Statut</span>
        <span style="font-size:13px;font-weight:700;color:{status_color};">{"Suspendu" if is_final else "En attente"}</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span style="font-size:13px;color:rgba(255,255,255,0.4);">Tentative</span>
        <span style="font-size:13px;font-weight:700;color:#ffffff;">{attempt}/3</span>
      </div>
    </div>

    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:16px 20px;margin-bottom:24px;">
      <p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0;line-height:1.6;">{action_text}</p>
    </div>

    <div style="text-align:center;">
      <a href="{APP_URL}" style="display:inline-block;padding:14px 32px;border-radius:999px;background:#ffffff;color:#0a0a1a;font-size:14px;font-weight:700;text-decoration:none;">Mettre a jour mon paiement</a>
    </div>
    """
    html = _base_template(content)
    _send(email, name, f"Echec de paiement — {plan_name}", html)


async def send_cancellation_email(name: str, email: str, sub_type: str):
    """Email de confirmation de resiliation"""
    plan_name = "Chutex Care" if sub_type in ("care", "bracelet_gilet") else "Bracelet Elio"

    content = f"""
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:64px;height:64px;border-radius:20px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:28px;">&#x1F44B;</span>
      </div>
      <h1 style="font-size:24px;font-weight:800;color:#ffffff;margin:0 0 8px;">Abonnement resilie</h1>
      <p style="font-size:14px;color:rgba(255,255,255,0.5);margin:0;line-height:1.6;">Votre abonnement {plan_name} a ete resilie.</p>
    </div>

    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:20px;margin-bottom:24px;">
      <p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0 0 12px;line-height:1.6;">Nous sommes desoles de vous voir partir. Si vous changez d'avis, vous pouvez re-souscrire a tout moment depuis l'application.</p>
      <p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0;line-height:1.6;">Votre bracelet Elio restera fonctionnel mais les donnees ne seront plus synchronisees.</p>
    </div>

    <div style="text-align:center;">
      <a href="{SITE_URL}" style="display:inline-block;padding:14px 32px;border-radius:999px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Visiter chutex-innovation.com</a>
    </div>
    """
    html = _base_template(content)
    _send(email, name, f"Confirmation de resiliation — {plan_name}", html)



async def send_weekly_report_email(name: str, email: str, report_data: dict):
    """Email hebdomadaire Nora — resume sante de la semaine"""
    score = report_data.get("score", 0)
    status = report_data.get("status", "")
    score_color = "#10B981" if score >= 80 else "#F59E0B" if score >= 60 else "#EF4444"
    trends = report_data.get("trends", [])
    program = report_data.get("program", {})
    alerts_summary = report_data.get("alerts_summary", "Aucune alerte cette semaine.")
    nora_advice = report_data.get("nora_advice", "Continuez vos bonnes habitudes.")
    streak = report_data.get("streak", 0)

    trends_html = ""
    for t in trends[:5]:
        arrow = "&#x2191;" if t.get("trend") == "up" else "&#x2193;" if t.get("trend") == "down" else "&#x2192;"
        trend_color = "#10B981" if t.get("good") else "#F59E0B" if t.get("trend") == "stable" else "#EF4444"
        trends_html += f"""<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
          <span style="font-size:13px;color:rgba(255,255,255,0.6);">{t.get('label','')}</span>
          <span style="font-size:14px;font-weight:700;color:{trend_color};">{t.get('value','')} {arrow}</span>
        </div>"""

    program_html = ""
    if program.get("title"):
        program_html = f"""<div style="background:rgba(167,139,250,0.08);border:1px solid rgba(167,139,250,0.2);border-radius:16px;padding:16px;margin-bottom:20px;">
          <div style="font-size:10px;font-weight:700;color:#A78BFA;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Programme en cours</div>
          <div style="font-size:15px;font-weight:800;color:#ffffff;">{program['title']}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.4);">Jour {program.get('day','-')}/{program.get('total','-')} — {program.get('phase','')}</div>
          <div style="height:6px;border-radius:3px;background:rgba(255,255,255,0.06);margin-top:10px;overflow:hidden;">
            <div style="height:6px;border-radius:3px;width:{program.get('progress',0)}%;background:#A78BFA;"></div>
          </div>
        </div>"""

    content = f"""
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;border-radius:20px;background:rgba(167,139,250,0.15);border:1px solid rgba(167,139,250,0.3);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:14px;font-weight:900;color:#A78BFA;">N</span>
      </div>
      <h1 style="font-size:22px;font-weight:800;color:#ffffff;margin:0 0 4px;">Votre bilan hebdomadaire</h1>
      <p style="font-size:13px;color:rgba(255,255,255,0.4);margin:0;">par Nora, votre assistante sante IA</p>
    </div>

    <!-- Score -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:48px;font-weight:900;color:{score_color};line-height:1;">{score}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.3);margin-top:4px;">Score sante /100 — {status}</div>
      {f'<div style="margin-top:8px;font-size:12px;color:#F59E0B;">Streak: {streak} jours consecutifs</div>' if streak > 0 else ''}
    </div>

    <!-- Tendances -->
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:16px;margin-bottom:20px;">
      <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.3);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Tendances de la semaine</div>
      {trends_html}
    </div>

    {program_html}

    <!-- Nora advice -->
    <div style="background:rgba(167,139,250,0.06);border:1px solid rgba(167,139,250,0.15);border-radius:16px;padding:16px;margin-bottom:20px;">
      <div style="font-size:10px;font-weight:700;color:#A78BFA;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Conseil de Nora</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.6;">{nora_advice}</div>
    </div>

    <!-- Alerts -->
    <div style="font-size:12px;color:rgba(255,255,255,0.3);text-align:center;margin-bottom:24px;">{alerts_summary}</div>

    <div style="text-align:center;">
      <a href="{APP_URL}" style="display:inline-block;padding:14px 32px;border-radius:999px;background:#ffffff;color:#0a0a1a;font-size:14px;font-weight:700;text-decoration:none;">Ouvrir l'application</a>
    </div>
    """
    html = _base_template(content, "Votre bilan sante de la semaine par Nora")
    _send(email, name, f"Bilan sante — Score {score}/100 — {status}", html)

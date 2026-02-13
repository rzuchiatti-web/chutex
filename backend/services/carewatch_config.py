# CARE WATCH - Orchestration Engine Configuration
# Parametres configurables du protocole d'alerte

CARE_WATCH_CONFIG = {
    # Delais
    "ring_timeout_seconds": 25,
    "guardian_ring_timeout_seconds": 25,
    "wait_for_app_intervention_seconds": 30,
    "max_total_protocol_seconds": 300,

    # Tentatives
    "max_patient_reformulations": 1,
    "max_call_attempts_per_guardian": 1,

    # Escalade
    "auto_dispatch_if_no_guardian": True,
    "force_escalation_on_critical": True,

    # Voix
    "voice_engine": "elevenlabs",
    "speech_language": "fr-FR",
    "speech_timeout": 10,
    "speech_silence_timeout": 5,
}

# Machine a etats de l'incident
INCIDENT_STATES = [
    "NEW_ALERT",
    "CALLING_PATIENT",
    "PATIENT_CONFIRMED_OK",
    "PATIENT_NEEDS_HELP",
    "PATIENT_NO_RESPONSE",
    "PATIENT_AMBIGUOUS",
    "CALLING_GUARDIAN_1",
    "CALLING_GUARDIAN_2",
    "CALLING_GUARDIAN_N",
    "GUARDIAN_INTERVENTION_ACCEPTED",
    "GUARDIAN_UNREACHABLE",
    "CARE_DISPATCHED",
    "RESOLVED",
    "FAILED",
]

# Classification NLP des reponses vocales
SPEECH_INTENTS = {
    "intent_ok": {
        "description": "Le patient confirme aller bien",
        "examples": ["oui ca va", "tout va bien", "je vais bien", "pas de probleme", "fausse alerte"],
    },
    "intent_help": {
        "description": "Le patient a besoin d'aide",
        "examples": ["aidez-moi", "je suis tombe", "j'ai mal", "non ca ne va pas", "secours"],
    },
    "intent_uncertain": {
        "description": "Reponse ambigue ou incomprehensible",
        "examples": ["euh", "quoi", "pardon", "je ne sais pas"],
    },
    "no_speech": {
        "description": "Pas de parole detectee (silence)",
    },
    "voicemail_detected": {
        "description": "Repondeur vocal detecte",
        "keywords": ["messagerie", "laissez un message", "apres le bip", "boite vocale"],
    },
}

# Scripts vocaux dynamiques - variantes pour naturalite
VOICE_SCRIPTS = {
    "patient_greeting": [
        "Bonjour {prenom}, ici l'assistance Care Watch. Nous avons recu une alerte. Est-ce que vous allez bien ?",
        "Bonjour {prenom}, c'est le service Care Watch. Nous avons detecte quelque chose d'inhabituel. Comment vous sentez-vous ?",
        "Bonjour {prenom}, ici Care Watch. Une alerte vient d'etre declenchee. Pouvez-vous me dire si tout va bien ?",
    ],
    "patient_ok_response": [
        "Tres bien, merci pour votre reponse {prenom}. Je suis rassure. Passez une bonne journee et n'hesitez pas a nous appeler si besoin.",
        "Parfait, je suis content que tout aille bien. Prenez soin de vous {prenom}. Bonne journee.",
        "Merci {prenom}, c'est rassurant. Je reste disponible si vous avez besoin. A bientot.",
    ],
    "patient_help_response": [
        "D'accord {prenom}, je comprends. Je vais prevenir immediatement vos proches pour qu'ils interviennent. Restez calme, de l'aide arrive.",
        "Je comprends {prenom}. Ne vous inquietez pas, je contacte tout de suite vos gardiens. Quelqu'un arrive bientot.",
        "Bien recu {prenom}. Je lance immediatement l'alerte a vos proches. Restez ou vous etes, on s'occupe de tout.",
    ],
    "patient_unclear_first": [
        "Pardonnez-moi {prenom}, je n'ai pas bien compris. Est-ce que vous avez besoin d'aide ? Dites simplement oui ou non.",
        "Excusez-moi, je n'ai pas saisi votre reponse. {prenom}, est-ce que tout va bien ? Oui ou non ?",
    ],
    "patient_unclear_escalate": [
        "Merci {prenom}. Par mesure de securite, je vais contacter vos proches pour verifier que tout va bien.",
        "{prenom}, je prefere ne pas prendre de risque. Je contacte immediatement vos gardiens.",
    ],
    "patient_no_response": [
        "Nous n'avons pas recu de reponse. Par securite, nous contactons immediatement vos proches. De l'aide arrive.",
        "Pas de reponse detectee. Nous alertons vos gardiens. Restez calme, quelqu'un va venir vous voir.",
    ],
    "guardian_greeting": [
        "Bonjour {prenom_gardien}, ici l'assistance Care Watch pour {prenom_patient}. Une alerte vient d'etre declenchee.",
        "Bonjour {prenom_gardien}, c'est Care Watch. Nous vous contactons au sujet de {prenom_patient}. Une alerte a ete detectee.",
    ],
    "guardian_ask_intervention": [
        "Pouvez-vous intervenir maintenant pour verifier son etat ? Dites oui si vous pouvez y aller.",
        "Etes-vous disponible pour vous rendre chez {prenom_patient} ? Dites-moi si vous pouvez intervenir.",
    ],
    "guardian_accepted": [
        "Merci {prenom_gardien}. Merci de confirmer dans l'application Care Watch que vous prenez l'intervention et d'indiquer votre delai d'arrivee.",
        "Parfait {prenom_gardien}. Ouvrez l'application et appuyez sur le bouton Intervenir pour confirmer. Merci pour votre reactivite.",
    ],
    "guardian_declined": [
        "Compris {prenom_gardien}. Je contacte immediatement le gardien suivant. Merci.",
        "D'accord, pas de probleme. Je passe au gardien suivant. Merci {prenom_gardien}.",
    ],
    "guardian_no_response": [
        "Pas de reponse. Nous contactons le gardien suivant.",
    ],
    "care_dispatch": [
        "Aucun gardien n'a pu intervenir. Une mission d'intervention Care est declenchee immediatement. Un professionnel se rend sur place.",
        "Escalade complete. Un intervenant professionnel Care est envoye au domicile de {prenom_patient}.",
    ],
}

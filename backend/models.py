from pydantic import BaseModel
from typing import List, Optional


class UserRegister(BaseModel):
    email: str
    password: str
    name: str
    phone: str = ""
    role: str = "beneficiary"
    date_of_birth: str = ""
    gender: str = ""
    address: str = ""
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    blood_type: str = ""
    allergies: str = ""
    medical_conditions: str = ""
    emergency_contact_name: str = ""
    emergency_contact_phone: str = ""
    doctor_name: str = ""
    guardian_type: str = ""
    structure_name: str = ""
    siret: str = ""
    profession: str = ""
    relationship: str = ""
    prescriber_code: str = ""


class UserLogin(BaseModel):
    email: str
    password: str


class DeviceSyncRequest(BaseModel):
    device_type: str
    data: dict = {}


class MedicationCreate(BaseModel):
    name: str
    dosage: str
    frequency: str
    times: List[str]
    notes: str = ""


class AlertCreate(BaseModel):
    alert_type: str
    severity: str = "medium"
    message: str = ""
    device_type: str = "bracelet"


class PrescriptionCreate(BaseModel):
    beneficiary_name: str
    beneficiary_email: str
    beneficiary_phone: str
    subscription_type: str
    notes: str = ""


class LinkBeneficiaryRequest(BaseModel):
    beneficiary_email: str


class ThresholdUpdate(BaseModel):
    metric_id: str
    min_val: Optional[float] = None
    max_val: Optional[float] = None
    goal: Optional[float] = None


class LocationUpdate(BaseModel):
    latitude: float
    longitude: float


class LocationSharingUpdate(BaseModel):
    mode: str


class TeleconsultSubmit(BaseModel):
    answers: List[dict]
    notes: str = ""


class InterventionCreate(BaseModel):
    alert_id: str
    beneficiary_id: str
    notes: str = ""


class InterventionUpdate(BaseModel):
    status: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    report: Optional[str] = None


class ActivationCodeCreate(BaseModel):
    structure_name: str
    max_uses: int = 50
    raison_sociale: str = ""
    siret: str = ""
    tva: str = ""
    adresse: str = ""
    telephone: str = ""
    email_contact: str = ""


class ActivationCodeUpdate(BaseModel):
    structure_name: Optional[str] = None
    raison_sociale: Optional[str] = None
    siret: Optional[str] = None
    tva: Optional[str] = None
    adresse: Optional[str] = None
    telephone: Optional[str] = None
    email_contact: Optional[str] = None
    max_uses: Optional[int] = None


class InterventionCodeCreate(BaseModel):
    structure_name: str
    max_uses: int = 50
    raison_sociale: str = ""
    siret: str = ""
    tva: str = ""
    adresse: str = ""
    telephone: str = ""
    email_contact: str = ""
    radius_km: float = 30


class ActivatePrescriberRequest(BaseModel):
    code: str


class LinkCodeRequest(BaseModel):
    pass


class LinkWithCodeRequest(BaseModel):
    link_code: str


class InterventionProviderActivate(BaseModel):
    code: str


class InterventionRadiusUpdate(BaseModel):
    structure_id: str
    radius_km: float = 30.0


class TriggerCallRequest(BaseModel):
    alert_id: str
    phone_number: str = ""


class TeleassistanceCallUpdate(BaseModel):
    alert_id: str
    step: str
    answers: List[dict] = []
    notes: str = ""
    resolution: str = ""


class EscalationStart(BaseModel):
    alert_id: str


class EscalationStepRequest(BaseModel):
    escalation_id: str
    response: str
    answers: List[dict] = []
    notes: str = ""


class ReminderCreate(BaseModel):
    reminder_type: str
    title: str
    time: str
    days: List[str] = []
    notes: str = ""
    active: bool = True


class DataSharingPrefs(BaseModel):
    share_vitals: bool = True
    share_location: bool = True
    share_alerts: bool = True
    share_medications: bool = True
    share_devices: bool = True
    share_reports: bool = True


class GeofenceCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    radius_m: float = 500
    active: bool = True


class SedentaritySettings(BaseModel):
    enabled: bool = True
    max_inactive_minutes: int = 60
    start_hour: int = 8
    end_hour: int = 20


class SubscriptionCreate(BaseModel):
    beneficiary_phone: str
    subscription_type: str = "standard"
    shopify_order_id: str = ""
    notes: str = ""


class SubscriptionUpdate(BaseModel):
    subscription_type: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

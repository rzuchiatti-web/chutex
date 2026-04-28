"""Schémas Pydantic partagés entre les routes."""
from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


# --- Auth ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=4)
    name: str
    phone: str
    role: str = "beneficiary"
    date_of_birth: str | None = None
    gender: str | None = None
    address: str | None = None
    postal_code: str | None = None
    city: str | None = None
    country: str | None = "FR"
    height_cm: str | None = None
    weight_kg: float | None = None
    blood_type: str | None = None
    allergies: str | None = None
    medical_conditions: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    doctor_name: str | None = None
    guardian_type: str | None = None
    structure_name: str | None = None
    siret: str | None = None
    profession: str | None = None
    relationship: str | None = None
    prescriber_code: str | None = None


class UserLogin(BaseModel):
    email: str  # email ou téléphone
    password: str


# --- Shop ---
class CheckoutItem(BaseModel):
    product_id: str
    variant_id: str | None = None
    quantity: int = 1


class CheckoutRequest(BaseModel):
    items: list[CheckoutItem]
    email: EmailStr
    first_name: str
    last_name: str
    address: str
    city: str
    postal_code: str
    country: str = "FR"
    phone: str | None = ""
    lang: str = "fr"


# --- Contact / Prescriptions / Pro ---
class ContactMessageIn(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    subject: str | None = None
    message: str


class PrescriptionIn(BaseModel):
    beneficiary_name: str
    beneficiary_first_name: str | None = None
    beneficiary_email: str | None = None
    beneficiary_phone: str
    subscription_type: str
    plan_label: str | None = None
    price: float | None = None
    notes: str | None = None
    guardian_contact_name: str | None = None
    guardian_contact_phone: str | None = None
    prescriber_structure: str | None = None


class ProApplicationIn(BaseModel):
    type: str
    first_name: str
    last_name: str
    phone: str
    email: EmailStr
    city: str | None = None
    postal_code: str | None = None
    diploma: str | None = None
    diploma_year: str | None = None
    specialization: str | None = None
    adeli_rpps: str | None = None
    siret: str | None = None
    current_situation: str | None = None
    current_clients: int | None = None
    motivation: str | None = None
    signer_name: str | None = None
    contract_accepted: bool = False

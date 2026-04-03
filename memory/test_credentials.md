# Test Credentials

## Beneficiary (Robin Zuchiatti)
- Phone: +33651245918
- Password: test123
- Role: beneficiary
- Login: POST /api/auth/login with {"email": "+33651245918", "password": "test123"}
- Note: Login uses the "email" field to accept both email and phone number

## Test Notes
- Bracelet device: Elio V8, MAC E3FD041B-D210-F1FE-60F6-CB30634CD5AA
- DB: mongodb://localhost:27017, DB name: vitallink_db
- API URL: grep EXPO_PUBLIC_BACKEND_URL /app/frontend/.env | cut -d '=' -f2
- Latest Build: 103 (TestFlight)
- Current vitals in DB: HR=75, SpO2=97, BP=120/80, Temp=36.6, HRV=42, Stress=30

# Test Credentials

## Beneficiary (Robin Zuchiatti)
- Phone: +33651245918
- Password: test123
- Role: beneficiary
- Login: POST /api/auth/login with {"email": "+33651245918", "password": "test123"}
- Note: Login uses the "email" field to accept both email and phone number

## Test Notes
- Bracelet device: Elio V8, connected=true
- DB: mongodb://localhost:27017, DB name: vitallink_db
- API URL: grep EXPO_PUBLIC_BACKEND_URL /app/frontend/.env | cut -d '=' -f2
- Latest Build: 114 (TestFlight)
- Current vitals in DB: HR=68, SpO2=94, BP=122/65, Temp=36.8, HRV=97, Stress=68, Steps=312
- VO2 Max: 45.7, Recovery: 79
- Onboarding bypass: localStorage.setItem('chutex_onboarding_done', 'true')

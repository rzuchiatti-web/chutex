# Test Credentials

## Beneficiary (Robin Zuchiatti)
- Phone: +33651245918
- Password: test123
- Role: beneficiary
- Login: POST /api/auth/login with {"email": "+33651245918", "password": "test123"}

## Test Notes
- Bracelet device: Elio V8, connected=true
- DB: mongodb://localhost:27017, DB name: vitallink_db
- API URL: grep EXPO_PUBLIC_BACKEND_URL /app/frontend/.env | cut -d '=' -f2
- Onboarding bypass: localStorage.setItem('chutex_onboarding_done', 'true')
- Current vitals: HR=68, SpO2=94, BP=122/65, Temp=0 (no today reading), HRV=97, Stress=68
- VO2 Max: 40.4, Recovery: 79, Steps: 312, Distance: 0.23km
- Glycemia: 1.00 g/L (population estimate), 0 calibrations
- Sleep: 1 night (2026-04-05), 581min (9.7h), quality 64
- Analysis phase: 3/7 days

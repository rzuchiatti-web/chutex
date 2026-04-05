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
- Morning briefing bypass: localStorage.setItem('briefing_last_date', new Date().toISOString().split('T')[0])
- Current vitals: HR=68, SpO2=96, BP=122/65, Temp=36.9, HRV=97, Stress=68
- Sleep: 1 night (2026-04-05), 581min (9h41), quality 64%, deep=104min, light=367min, rem=110min
- Sleep start_time: 04:20, interruptions: 6
- Apnea risk: 45% (Modere)
- Steps: 314, Distance: 0.23km
- VO2 Max: 40.4, Recovery: 79
- Glycemia: 1.00 g/L (population estimate), 0 calibrations
- Analysis phase: 3/7 days
- Exercise library: empty (no pro templates)

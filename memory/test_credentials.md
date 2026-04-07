# Test Credentials

## Beneficiary (Robin Zuchiatti)
- Phone: +33651245918
- Password: test123
- Role: beneficiary
- Login: POST /api/auth/login with {"email": "+33651245918", "password": "test123"}

## Test Notes
- Bracelet device: Elio V8, connected=true, battery=100%
- DB: mongodb://localhost:27017, DB name: vitallink_db
- API URL: grep EXPO_PUBLIC_BACKEND_URL /app/frontend/.env | cut -d '=' -f2
- Onboarding bypass: localStorage.setItem('chutex_onboarding_done', 'true')
- Morning briefing bypass: localStorage.setItem('briefing_last_date', new Date().toISOString().split('T')[0])
- Current vitals: HR=0 (not measured yet), SpO2=0, Temp=38.4, Steps=762
- Sleep: from previous night, quality 64%
- Exercise library: 40 templates available
- Auto-reconnect iOS: WORKING (confirmed by user)
- Build 129 on TestFlight (fix fetchData crash)

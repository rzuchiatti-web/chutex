# Test Credentials

## Beneficiaire (Robin Zuchiatti)
- Phone: +33651245918
- Password: test123
- Login: POST /api/auth/login {"email": "+33651245918", "password": "test123"}
- Gender: M (homme)
- Date of birth: 2002-01-01 (24 ans)
- Subscription: Standard (active, can_use_bracelet: true)

## Coach (Alain Pro)
- Phone: +33655443322
- Password: test123
- Login: POST /api/auth/login {"email": "+33655443322", "password": "test123"}

## Admin
- Email: admin@chutex.fr
- Password: admin123
- Login: POST /api/auth/login {"email": "admin@chutex.fr", "password": "admin123"}

## SAAD (Company)
- Phone: +33499887766
- Password: test123
- Login: POST /api/auth/login {"email": "+33499887766", "password": "test123"}

## Notes
- Auth token stored in localStorage as `vl_token`
- Login endpoint accepts phone number in the `email` field
- Robin's account was cleaned (all health data cleared) on 2026-04-02 for fresh testing

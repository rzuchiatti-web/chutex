# Test Credentials

## Bénéficiaire (Josette)
- Phone: +33651245918
- Password: test123
- Login: POST /api/auth/login {"email": "+33651245918", "password": "test123"}

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

# Chutex Care — Changelog

## 2026-03-17 — UI/UX Fixes Batch + Toast Fix

### Completed
1. **Teleconsult header removed** — Removed the fixed header (Medecin disponible 24/7, Teleconsultation title) on the teleconsultation QCM page. Progress dots and step label now scroll with content.
2. **NoraPill border + shadow** — Added visible border (1.5px solid rgba(255,255,255,0.18)) and enhanced box-shadow to the Nora pill on the daily objectives dashboard.
3. **Bio age card border + shadow** — Wrapped the HeroScore biological age section in a card container with border, shadow, and subtle background.
4. **Health no-data unified background** — Replaced the linear-gradient background with AnimatedDarkBg (same as other pages). Replaced NoraCard recommendation with two promotional cards for Bracelet Elio and Balance Vita (images reused from devices page).
5. **Care subscription card border + shadow** — Added border (1.5px solid) and box-shadow to the care subscription card on the profile page.
6. **Health data re-seeded** — Created and ran seed_health_data.py to populate 14 days of bracelet + scale readings with complete vital signs data for the beneficiary test account.
7. **Social notification toast fixed** — Increased z-index to maximum (2147483647), added fontFamily. Toast is now visually appearing and working correctly.

### Files Modified
- `frontend/app/(tabs)/teleconsult.tsx` — Removed fixed header
- `frontend/app/(tabs)/index.tsx` — NoraPill border/shadow
- `frontend/app/(tabs)/health.tsx` — No-data state with promo cards + AnimatedDarkBg
- `frontend/app/(tabs)/profile.tsx` — Care card border/shadow
- `frontend/src/components/health/HeroScore.tsx` — Bio age card styling
- `frontend/src/components/programs/TeamActivityToast.tsx` — Toast z-index fix
- `backend/seed_health_data.py` — NEW: Health data seeding script
- `backend/server.py` — Re-enabled seed_demo_data

## 2026-03-17 — Previous Session (Program & Toast Work)
- Program detail page complete redesign (hero images, pills, stats)
- Backend bug fix: KeyError 'started_at' in /api/programs/active
- Program cover images added
- Toast notification structural fix (component hierarchy in _layout.tsx)
- Team activity seed data created

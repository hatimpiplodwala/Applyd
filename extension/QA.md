# Extension Manual QA

Run after `npm run build` + load unpacked (`extension/dist`).

## Auth
- [ ] Fresh install → popup shows login.
- [ ] Wrong password → inline error, no crash.
- [ ] Correct password → quick-add form appears.
- [ ] Close & reopen popup → still signed in (no re-login).
- [ ] Sign out → returns to login; reopen stays logged out.

## Parse + save
- [ ] On a Greenhouse/Lever/Ashby posting → company/role auto-fill.
- [ ] On a LinkedIn/Indeed posting → still auto-fills (page-text path).
- [ ] On a non-job page → form opens with "couldn't auto-fill" note; manual save works.
- [ ] Edit fields → Save → "Saved ✓"; row appears in the web dashboard.
- [ ] "View in Applyd" opens the dashboard.

## Duplicate warning
- [ ] Save the same company+role twice → second save shows the warn banner; "Save anyway" works.

## Context menu
- [ ] Right-click a job page → "Save Job to Applyd" → popup opens prefilled.

## Token refresh
- [ ] Leave signed in > 1 hour (token expiry) → next save refreshes silently and succeeds.
- [ ] If refresh fails (revoke session in Supabase) → bounced to login.

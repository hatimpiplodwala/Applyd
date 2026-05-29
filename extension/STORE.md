# Applyd Extension — Microsoft Edge Add-ons Submission

The Edge Add-ons store has **no registration fee**. Edge is Chromium, so the
same `applyd-extension-<version>.zip` also publishes to the Chrome Web Store
(one-time $5 fee) unchanged if you ever want it there.

## Before submitting
- [ ] `npm run build && npm run package` → upload `applyd-extension-<version>.zip`
- [ ] Register at https://partner.microsoft.com/dashboard/microsoftedge (free)
- [ ] Host the privacy policy text below at a public URL (e.g. a page on the
      Applyd site) and link it in the listing.

## Listing copy
- **Name:** Applyd — Save Job
- **Summary (≤132 chars):** Save any job posting to your Applyd tracker in one
  click, with company, role, location and salary auto-filled by AI.
- **Description:**
  > Applyd's extension saves the job you're viewing straight to your Applyd
  > application tracker. Open it on a job posting and it reads the page, fills
  > in the company, role, location and salary for you to review, and saves it
  > to your account. Works on job boards that block other tools because it
  > reads the page you're already looking at. Right-click any page and choose
  > "Save Job to Applyd" too. Requires a free Applyd account.

## Permission justifications
- **activeTab + scripting:** Read the text of the job posting on the current
  tab, only when you open the popup or use the Save Job menu.
- **storage:** Keep you signed in to your Applyd account between sessions.
- **contextMenus:** Add the right-click "Save Job to Applyd" item.
- **host permissions (applyd-api.onrender.com, *.supabase.co):** Send the job
  details to your Applyd account and authenticate you. No other sites are
  contacted.

## Privacy policy text
> Applyd's browser extension processes the following data:
> - **Account email and password** you enter to sign in, sent only to Applyd's
>   authentication provider (Supabase) to log you in.
> - **Job posting text** from the page you choose to save, sent only to
>   Applyd's own API to extract company/role/location/salary.
> - **The applications you save**, stored in your Applyd account.
>
> The extension does not use analytics or trackers, does not sell or share data
> with third parties, and contacts no servers other than Applyd's own API and
> authentication provider. You can delete saved applications anytime from the
> Applyd web app.

## Screenshots to capture (1280×800 or 640×400)
1. Popup login screen.
2. Quick-add form prefilled on a real job posting.
3. The "Saved ✓" confirmation.
4. Right-click context menu showing "Save Job to Applyd".

# Bella Pet Grooming — Netlify deployment package

This package contains the updated website, extracted/cacheable image assets, a Netlify Forms appointment request form, and a Netlify Function intended to send new appointment-request notifications to the founder's WhatsApp through the WhatsApp Cloud API.

## Important status

- The appointment form is coded for Netlify Forms. It will not collect submissions when opened as a local `file://` page. Deploy the site to Netlify, enable form detection, and redeploy.
- Automatic WhatsApp notifications are **not active until you configure the required Meta/WhatsApp API credentials, an approved template, the Netlify environment variables, and the outgoing webhook**.
- The recipient number already present in the website is `918839140120` (+91 883 914 0120). The WhatsApp API sender's Phone Number ID is a separate value supplied by Meta.
- Existing WhatsApp Business app numbers may require eligibility and setup for WhatsApp Business Platform coexistence. Confirm with the chosen Meta onboarding flow/provider before changing or migrating the number. Do not migrate the existing number blindly.
- A successful form submission is an appointment request, not an appointment confirmation.
- No final custom domain was supplied, so no canonical URL or final sitemap domain has been invented.

## 1. Deploy with GitHub + Netlify

1. Extract this ZIP.
2. Upload the **contents** of this folder to the root of a GitHub repository (so `index.html`, `netlify.toml`, `robots.txt`, `assets/`, and `netlify/` are at repository root).
3. In Netlify, choose **Add new site → Import an existing project** and connect that GitHub repository.
4. Publish directory: `.`. Build command: leave blank. The included `netlify.toml` points Netlify to `netlify/functions`.
5. Deploy the site.
6. In Netlify, open **Forms** and enable form detection if prompted, then trigger a new deploy. Submit a test appointment request and confirm it appears in the Forms submissions list.

## 2. Configure WhatsApp API notification

This requires a Meta WhatsApp Business Platform / Cloud API setup or a compatible provider. The function in `netlify/functions/appointment-whatsapp.mjs` sends a template message to the existing recipient number. Use a separate WhatsApp API-enabled sender number for the outbound message; the founder receives it at `+91 883 914 0120`. The function does not turn the founder's existing WhatsApp Business app into an API sender by itself.

### A. Confirm the number can be used

- Confirm that `+91 883 914 0120` is eligible for the selected WhatsApp Business Platform onboarding path.
- If the founder wants to keep using the same number in the WhatsApp Business app, confirm that the onboarding supports **Coexistence** for this account and country. Do not remove/migrate the app number without understanding the impact.
- The API sender Phone Number ID and access token are supplied by Meta/provider; they are not the founder's recipient number. The API sender number should be a separate sending number from the founder's receiving number `+91 883 914 0120`; do not configure the same number as both sender and recipient and assume it can notify itself.

### B. Create an approved WhatsApp template

In WhatsApp Manager, create and get approval for a template named `bella_new_appointment_request` in English (`en`) with this body and the same eight body parameters in order:

> New Bella Pet Grooming appointment request. Customer: {{1}}. Phone: {{2}}. Pet: {{3}} - {{4}}. Service: {{5}}. Preferred date: {{6}}. Time: {{7}}. Area: {{8}}. This is a request only, not a confirmed appointment.

Template category and approval are determined by Meta. If you use another template name or language code, change the matching environment variables below.

### C. Add Netlify environment variables

In Netlify site configuration, add these environment variables (use secret values only in Netlify, never in GitHub or `index.html`):

- `WHATSAPP_ACCESS_TOKEN` — a suitable server-side access token for the WhatsApp API.
- `WHATSAPP_PHONE_NUMBER_ID` — the API sender Phone Number ID from Meta.
- `WHATSAPP_API_VERSION` — a currently supported Graph API version, e.g. the version shown in your Meta app/API setup.
- `FOUNDER_WHATSAPP_NUMBER` — `918839140120` (digits only, unless the destination is intentionally changed).
- `WHATSAPP_TEMPLATE_NAME` — `bella_new_appointment_request`.
- `WHATSAPP_TEMPLATE_LANGUAGE` — `en`.
- `APPOINTMENT_WEBHOOK_SECRET` — a long random secret generated for this webhook.

After adding environment variables, redeploy the site/functions.

### D. Connect Netlify Forms to the function

1. Copy the deployed site's HTTPS URL (the temporary `*.netlify.app` URL works for initial testing).
2. In Netlify, open **Forms → Form notifications / Notifications → Add notification → Outgoing webhook** (labels may vary with dashboard updates).
3. Select the `appointment-request` form if the UI asks for a form.
4. Set the webhook URL to:

   `https://YOUR-DEPLOYED-SITE.netlify.app/.netlify/functions/appointment-whatsapp?secret=YOUR_APPOINTMENT_WEBHOOK_SECRET`

   Replace both placeholders. The secret must exactly match `APPOINTMENT_WEBHOOK_SECRET`. Keep this URL private; do not put it in website HTML or public documentation.
5. Save the notification and redeploy if Netlify requests it.
6. Submit a real test request with a test customer/pet name. Confirm (a) Netlify Forms captured it, (b) the webhook reached the function, and (c) the founder received the WhatsApp message.
7. If it fails, inspect Netlify function logs and Meta/provider delivery status. Do not assume a function HTTP success alone proves final WhatsApp delivery; confirm the message in WhatsApp/provider status.

The webhook payload format can vary. The function handles common Netlify payload wrappers, but must be validated against the actual payload in your site's first test. If the provider rejects the template or payload shape, adjust the mapping to match the real submission event.

## 3. Custom domain and SEO launch tasks

After you buy/connect the final domain:

1. Add the domain in Netlify and configure the DNS records Netlify specifies.
2. Verify HTTPS works.
3. Update the canonical URL and `og:url` / `og:image` metadata in `index.html` with real absolute URLs. Do not use a placeholder domain.
4. Edit `sitemap.xml.template`, replace `https://YOUR-CUSTOM-DOMAIN/` with the final canonical homepage URL, then save it as `sitemap.xml` in the published root.
5. Add the sitemap URL to `robots.txt` (remove the comment and use the exact production URL).
6. Add the site to Google Search Console and submit `/sitemap.xml`.
7. Test the live URL with PageSpeed Insights and mobile browser checks. Real Core Web Vitals and indexing cannot be verified from the source file alone.

## 4. Notes about form data and privacy

The form asks for the customer name and phone, pet/service details, preferred date/time, and locality. Netlify Forms may store these submissions in the Netlify dashboard. Only people who need the information to handle bookings should have access. The WhatsApp function sends the founder a subset of the details (name, phone, pet type/name, service, preferred date/time, and locality); free-text grooming notes remain in the form submission and are not sent in the WhatsApp template by this function.

Update the privacy policy if your actual provider, retention period, staff access, or workflow differs from this setup. Do not collect a full street address until it is needed to arrange the visit.

## 5. Test checklist

- [ ] Site loads on desktop and mobile.
- [ ] Images load from `assets/images/` without distortion.
- [ ] Form validates required fields and disallows past dates.
- [ ] Form submission appears in Netlify Forms.
- [ ] WhatsApp webhook is configured with a private secret.
- [ ] WhatsApp template is approved and matches all eight placeholders.
- [ ] Founder receives a real test notification on `+91 883 914 0120`.
- [ ] Booking remains described as a request until confirmed.
- [ ] Custom domain, canonical, sitemap, and Search Console are configured after domain purchase.

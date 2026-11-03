// Netlify Function: sends an appointment-request notification to the founder via WhatsApp Cloud API.
// Requires Netlify Forms outgoing webhook configured to this function URL with ?secret=<APPOINTMENT_WEBHOOK_SECRET>.
// Never put API credentials in index.html or commit them to GitHub.
export const handler = async (event) => {
  const json = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const expectedSecret = process.env.APPOINTMENT_WEBHOOK_SECRET;
  const suppliedSecret = event.queryStringParameters?.secret;
  if (!expectedSecret || !suppliedSecret || suppliedSecret !== expectedSecret) {
    return json(401, { error: 'Unauthorized webhook' });
  }

  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch { return json(400, { error: 'Invalid JSON payload' }); }

  // Netlify webhook payloads may vary by notification format; support common wrappers.
  if (typeof payload.payload === 'string') {
    try { payload.payload = JSON.parse(payload.payload); } catch { /* keep original */ }
  }
  let data = payload.data || payload.submission?.data || payload.payload?.data || payload.payload?.submission?.data || {};
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch { data = {}; }
  }
  const formName = payload.form_name || payload.formName || payload.submission?.form_name || payload.payload?.form_name;
  if (formName && formName !== 'appointment-request') return json(200, { ignored: true, reason: 'Different form' });
  if (!data || typeof data !== 'object') return json(400, { error: 'Form data missing' });

  const clean = (value, max = 180) => String(value ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max) || 'Not provided';
  const fields = {
    customer: clean(data['customer-name'] || data.customer_name || data.name, 100),
    phone: clean(data['customer-phone'] || data.customer_phone || data.phone, 30),
    petType: clean(data['pet-type'] || data.pet_type, 40),
    petName: clean(data['pet-name'] || data.pet_name, 80),
    service: clean(data.service, 100),
    date: clean(data['preferred-date'] || data.preferred_date, 30),
    time: clean(data['preferred-time'] || data.preferred_time, 50),
    locality: clean(data.locality, 120)
  };

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION;
  const recipient = (process.env.FOUNDER_WHATSAPP_NUMBER || '918839140120').replace(/\D/g, '');
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'bella_new_appointment_request';
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en';
  if (!token || !phoneNumberId || !apiVersion || !recipient) {
    return json(500, { error: 'WhatsApp environment variables are not configured' });
  }

  const parameters = [fields.customer, fields.phone, fields.petType, fields.petName, fields.service, fields.date, fields.time, fields.locality]
    .map(text => ({ type: 'text', text }));
  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'template',
        template: {
          name: templateName,
          language: { code: templateLanguage },
          components: [{ type: 'body', parameters }]
        }
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      // Avoid logging secrets or customer data.
      console.error('WhatsApp API request failed with status', response.status, result?.error?.code || 'unknown error');
      return json(502, { error: 'WhatsApp provider rejected the message', providerStatus: response.status });
    }
    return json(200, { ok: true, message: 'WhatsApp notification accepted by provider' });
  } catch (error) {
    console.error('WhatsApp notification request failed');
    return json(502, { error: 'Could not reach WhatsApp provider' });
  }
};

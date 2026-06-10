export function buildPrivacyHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Privacy Policy — ZiroWork</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #fff;
      color: #111;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      padding: 40px 20px 80px;
    }
    .wrap { max-width: 640px; margin: 0 auto; }
    .back { display: inline-block; color: #6366F1; text-decoration: none; margin-bottom: 32px; font-size: 14px; }
    .back:hover { text-decoration: underline; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    .updated { font-size: 13px; color: #666; margin-bottom: 40px; }
    h2 { font-size: 16px; font-weight: 600; margin-top: 32px; margin-bottom: 8px; }
    p { margin-bottom: 12px; }
    a { color: #6366F1; }
  </style>
</head>
<body>
  <div class="wrap">
    <a class="back" href="#" onclick="history.back(); return false;">&#8592; Back</a>
    <h1>Privacy Policy</h1>
    <p class="updated">Last updated: June 2025</p>

    <h2>Who We Are</h2>
    <p>ZiroWork provides automated lead response services on behalf of local music schools. When you submit a lesson inquiry form, your information is handled by ZiroWork on behalf of the school you contacted.</p>

    <h2>Information We Collect</h2>
    <p>We collect the information you provide on the inquiry form: name, phone number, email (optional), instrument interest, student age, and how you heard about us.</p>

    <h2>How We Use Your Information</h2>
    <p>We use your information to send SMS messages about your lesson inquiry, schedule follow-ups, and connect you with the music school. We do not sell or share your mobile phone number with third parties for marketing purposes.</p>

    <h2>SMS Messaging</h2>
    <p>By opting in, you may receive up to 8 automated text messages per inquiry. Message and data rates may apply. Reply <strong>STOP</strong> at any time to unsubscribe. Reply <strong>HELP</strong> for assistance.</p>

    <h2>Data Retention</h2>
    <p>Your contact information is retained for up to 12 months after your inquiry or until you opt out, whichever comes first.</p>

    <h2>Contact</h2>
    <p>Questions? Email <a href="mailto:privacy@zirowork.com">privacy@zirowork.com</a></p>
  </div>
</body>
</html>`;
}

export function buildTermsHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Terms of Service — ZiroWork</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #fff;
      color: #111;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      padding: 40px 20px 80px;
    }
    .wrap { max-width: 640px; margin: 0 auto; }
    .back { display: inline-block; color: #6366F1; text-decoration: none; margin-bottom: 32px; font-size: 14px; }
    .back:hover { text-decoration: underline; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    .updated { font-size: 13px; color: #666; margin-bottom: 40px; }
    h2 { font-size: 16px; font-weight: 600; margin-top: 32px; margin-bottom: 8px; }
    p { margin-bottom: 12px; }
    a { color: #6366F1; }
  </style>
</head>
<body>
  <div class="wrap">
    <a class="back" href="#" onclick="history.back(); return false;">&#8592; Back</a>
    <h1>Terms of Service</h1>
    <p class="updated">Last updated: June 2025</p>

    <h2>Service Description</h2>
    <p>ZiroWork sends automated SMS messages on behalf of music schools to respond to lesson inquiries submitted through their websites.</p>

    <h2>SMS Consent</h2>
    <p>By checking the consent box on the inquiry form, you agree to receive automated text messages from the music school you contacted. Consent is not required to purchase lessons or any other service.</p>

    <h2>Message Frequency</h2>
    <p>Up to 8 messages per inquiry. Message and data rates may apply.</p>

    <h2>Opt-Out</h2>
    <p>Reply <strong>STOP</strong> to any message to unsubscribe immediately. Reply <strong>HELP</strong> for support contact information.</p>

    <h2>No Warranties</h2>
    <p>Services are provided as-is. ZiroWork is not responsible for carrier delays or message delivery failures.</p>

    <h2>Contact</h2>
    <p>Questions? Email <a href="mailto:support@zirowork.com">support@zirowork.com</a></p>
  </div>
</body>
</html>`;
}

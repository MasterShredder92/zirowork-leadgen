const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')!;

export const SMS_ENABLED = Deno.env.get('SMS_ENABLED') === 'true';
const TEST_PHONE = Deno.env.get('TEST_PHONE');

export async function sendSMS(to: string, body: string): Promise<void> {
  const recipient = SMS_ENABLED ? to : (TEST_PHONE ?? to);
  if (!recipient) return;

  const params = new URLSearchParams({
    To: recipient,
    From: TWILIO_PHONE_NUMBER,
    Body: body,
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      },
      body: params.toString(),
    }
  );

  if (!res.ok) {
    throw new Error(`Twilio error ${res.status}: ${await res.text()}`);
  }
}

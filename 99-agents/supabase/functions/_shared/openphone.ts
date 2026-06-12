const OPENPHONE_API_KEY = Deno.env.get('OPENPHONE_API_KEY')!;
const OPENPHONE_NUMBER_ID = Deno.env.get('OPENPHONE_NUMBER_ID')!;
const SMS_ENABLED = Deno.env.get('SMS_ENABLED') === 'true';
const TEST_PHONE = Deno.env.get('TEST_PHONE');

export async function sendSMS(to: string, body: string): Promise<void> {
  const recipient = SMS_ENABLED ? to : (TEST_PHONE ?? to);

  const res = await fetch('https://api.openphone.com/v1/messages', {
    method: 'POST',
    headers: {
      Authorization: OPENPHONE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: [recipient],
      from: OPENPHONE_NUMBER_ID,
      content: body,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenPhone error ${res.status}: ${await res.text()}`);
  }
}

export { SMS_ENABLED };

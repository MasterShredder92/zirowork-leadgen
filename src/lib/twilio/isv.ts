import { Twilio } from 'twilio';

/**
 * Creates a subaccount for a specific client tenant in Twilio.
 * This isolates sender reputation and billing per tenant.
 */
export async function createTenantSubaccount(client: Twilio, friendlyName: string) {
  try {
    const account = await client.api.v2010.accounts.create({ friendlyName });
    return {
      success: true,
      sid: account.sid,
      authConfig: account.authToken,
    };
  } catch (error: any) {
    console.error('Failed to create Twilio Subaccount:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Provisions an API key for the specific subaccount for secure programmatic access
 */
export async function createSubaccountApiKey(subaccountClient: Twilio, friendlyName: string) {
  try {
    const key = await subaccountClient.newKeys.create({ friendlyName });
    return {
      success: true,
      sid: key.sid,
      secret: key.secret,
    };
  } catch (error: any) {
    console.error('Failed to create Subaccount API Key:', error);
    return { success: false, error: error.message };
  }
}

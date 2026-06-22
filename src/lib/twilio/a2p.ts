import { Twilio } from 'twilio';

/**
 * Creates a Secondary Customer Profile in the Twilio Trust Hub.
 * Required for A2P 10DLC registration.
 */
export async function createCustomerProfile(client: Twilio, data: any) {
  try {
    const profile = await client.trusthub.v1.customerProfiles.create({
      friendlyName: data.businessName,
      email: data.email,
      policySid: 'RNdfa33bc57b55405ceb15c7e1f440d999',
      statusCallback: data.statusCallbackUrl,
    });
    return { success: true, sid: profile.sid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Registers an A2P Brand linked to the Customer Profile.
 */
export async function registerA2PBrand(client: Twilio, profileSid: string) {
  try {
    const brand = await client.messaging.v1.brandRegistrations.create({
      customerProfileBundleSid: profileSid,
      a2PProfileBundleSid: profileSid,
      brandType: 'STARTER', // Defaulting to starter for now
    });
    return { success: true, sid: brand.sid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Registers a specific Messaging Campaign use case under the approved Brand.
 */
export async function registerA2PCampaign(client: Twilio, brandSid: string, messagingServiceSid: string, useCaseData: any) {
  try {
    const campaign = await client.messaging.v1.services(messagingServiceSid)
      .usAppToPerson.create({
        brandRegistrationSid: brandSid,
        description: useCaseData.description,
        messageFlow: useCaseData.messageFlow,
        messageSamples: useCaseData.messageSamples,
        usAppToPersonUsecase: 'MARKETING', // Example usecase
        hasEmbeddedLinks: true,
        hasEmbeddedPhone: true,
      });
    return { success: true, sid: campaign.sid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

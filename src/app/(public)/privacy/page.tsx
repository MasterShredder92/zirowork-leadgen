import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy — ZiroWork' };

const s = {
  page: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", lineHeight: 1.6, maxWidth: 900, margin: '0 auto', padding: '40px 20px', color: '#333', background: '#fafafa' } as React.CSSProperties,
  h1:   { fontSize: 28, marginBottom: 10 } as React.CSSProperties,
  sub:  { color: '#666', fontSize: 14, marginBottom: 30 } as React.CSSProperties,
  h2:   { fontSize: 18, marginTop: 30, marginBottom: 15 } as React.CSSProperties,
  p:    { marginBottom: 15 } as React.CSSProperties,
  ul:   { marginBottom: 15, paddingLeft: 20 } as React.CSSProperties,
  li:   { marginBottom: 8 } as React.CSSProperties,
};

export default function PrivacyPage() {
  return (
    <div style={s.page}>
      <h1 style={s.h1}>Privacy Policy</h1>
      <p style={s.sub}>Last Updated: June 2026</p>

      <h2 style={s.h2}>1. Information We Collect</h2>
      <p style={s.p}>When you submit an inquiry form to a music school using ZiroWork, we collect:</p>
      <ul style={s.ul}>
        <li style={s.li}>Your name and phone number</li>
        <li style={s.li}>Your email address (if provided)</li>
        <li style={s.li}>Information about the instrument or service you&apos;re interested in</li>
        <li style={s.li}>Any other details you voluntarily provide in the inquiry form</li>
      </ul>

      <h2 style={s.h2}>2. How We Use Your Information</h2>
      <p style={s.p}>We use your information solely to:</p>
      <ul style={s.ul}>
        <li style={s.li}>Send you SMS messages about your lesson inquiry</li>
        <li style={s.li}>Confirm your interest in lessons</li>
        <li style={s.li}>Schedule trial lessons</li>
        <li style={s.li}>Provide follow-up communications from the music school</li>
      </ul>

      <h2 style={s.h2}>3. SMS Message Frequency &amp; Rates</h2>
      <p style={s.p}>By opting in, you agree to receive automated SMS messages. Message frequency varies. You may receive up to 8 messages per inquiry during the follow-up period. Message and data rates may apply.</p>

      <h2 style={s.h2}>4. How to Opt Out</h2>
      <p style={s.p}>You can opt out of SMS messages at any time by replying STOP to any message. You will not receive any further messages from this number after opting out. For assistance, reply HELP to any message.</p>

      <h2 style={s.h2}>5. Data Security</h2>
      <p style={s.p}>Your information is stored securely and is only accessible to the music school you inquired with and ZiroWork staff necessary to deliver SMS messages.</p>

      <h2 style={s.h2}>6. Data Retention</h2>
      <p style={s.p}>We retain your information for as long as necessary to process your inquiry and complete the follow-up sequence. You can request deletion at any time by replying STOP.</p>

      <h2 style={s.h2}>7. Third Parties</h2>
      <p style={s.p}>We do not sell, rent, or share your personal information with third parties except as necessary to deliver SMS messages through our SMS provider.</p>
      <p style={s.p}>No mobile information will be shared with third parties or affiliates for marketing or promotional purposes. Information sharing to subcontractors in support services, such as customer service, is permitted. All other use case categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.</p>

      <h2 style={s.h2}>8. Your Rights</h2>
      <p style={s.p}>You have the right to:</p>
      <ul style={s.ul}>
        <li style={s.li}>Know what personal information we hold about you</li>
        <li style={s.li}>Request deletion of your information</li>
        <li style={s.li}>Opt out of SMS messages at any time</li>
      </ul>

      <h2 style={s.h2}>9. Changes to This Policy</h2>
      <p style={s.p}>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page with a new &quot;Last Updated&quot; date.</p>

      <h2 style={s.h2}>10. Contact Us</h2>
      <p style={s.p}>If you have questions about this Privacy Policy, reply HELP to any SMS message, or contact the music school directly.</p>
    </div>
  );
}

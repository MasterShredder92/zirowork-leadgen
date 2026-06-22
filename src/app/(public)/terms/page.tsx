import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Service — ZiroWork' };

const s = {
  page: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", lineHeight: 1.6, maxWidth: 900, margin: '0 auto', padding: '40px 20px', color: 'var(--color-school-text-1)', background: 'var(--color-school-fafafa)' } as React.CSSProperties,
  h1:   { fontSize: 28, marginBottom: 10 } as React.CSSProperties,
  sub:  { color: 'var(--color-school-text-4)', fontSize: 14, marginBottom: 30 } as React.CSSProperties,
  h2:   { fontSize: 18, marginTop: 30, marginBottom: 15 } as React.CSSProperties,
  p:    { marginBottom: 15 } as React.CSSProperties,
  ul:   { marginBottom: 15, paddingLeft: 20 } as React.CSSProperties,
  li:   { marginBottom: 8 } as React.CSSProperties,
};

export default function TermsPage() {
  return (
    <div style={s.page}>
      <h1 style={s.h1}>Terms of Service</h1>
      <p style={s.sub}>Last Updated: June 2026</p>

      <h2 style={s.h2}>1. Acceptance of Terms</h2>
      <p style={s.p}>By submitting an inquiry form to a music school using ZiroWork, you agree to these Terms of Service and consent to receive automated SMS messages about your inquiry.</p>

      <h2 style={s.h2}>2. SMS Service Agreement</h2>
      <p style={s.p}>You agree to receive SMS messages from the music school you contacted regarding your lesson inquiry. Messages will be sent from a dedicated local number assigned to that school.</p>

      <h2 style={s.h2}>3. Consent &amp; Opt-In</h2>
      <p style={s.p}>You confirm that you:</p>
      <ul style={s.ul}>
        <li style={s.li}>Are at least 18 years old (or have parental/guardian consent if under 18)</li>
        <li style={s.li}>Own or have authorization to use the phone number you provided</li>
        <li style={s.li}>Actively consented to receive SMS messages by checking the consent box on the inquiry form</li>
        <li style={s.li}>Understand that standard message and data rates apply</li>
      </ul>

      <h2 style={s.h2}>4. Message Frequency</h2>
      <p style={s.p}>Message frequency varies. You may receive up to 8 SMS messages per inquiry during the initial follow-up period. Exact frequency depends on your response to messages.</p>

      <h2 style={s.h2}>5. Opting Out</h2>
      <p style={s.p}>You can stop receiving SMS messages at any time by replying STOP to any message. After you send the SMS message &quot;STOP&quot; to us, we will send you one final SMS message to confirm that you have been unsubscribed. After this, you will not receive further messages from that music school&apos;s number.</p>

      <h2 style={s.h2}>6. Costs &amp; Charges</h2>
      <p style={s.p}>Standard SMS rates apply. Message and data charges may apply depending on your wireless plan. You are responsible for any charges imposed by your wireless carrier.</p>

      <h2 style={s.h2}>7. Technical Support</h2>
      <p style={s.p}>If you are experiencing issues with the messaging program you can reply with the keyword HELP for more assistance. For help or questions about SMS messages, reply HELP to any message. For service issues, contact the music school directly.</p>

      <h2 style={s.h2}>8. Prohibited Use</h2>
      <p style={s.p}>You agree not to:</p>
      <ul style={s.ul}>
        <li style={s.li}>Use false or misleading information when submitting an inquiry</li>
        <li style={s.li}>Provide a phone number that is not your own without authorization</li>
        <li style={s.li}>Harass or abuse the service or the music school staff</li>
      </ul>

      <h2 style={s.h2}>9. Limitation of Liability</h2>
      <p style={s.p}>ZiroWork and the music school are not liable for:</p>
      <ul style={s.ul}>
        <li style={s.li}>Delayed or undelivered SMS messages</li>
        <li style={s.li}>Service interruptions beyond our control</li>
        <li style={s.li}>Charges imposed by your wireless carrier</li>
      </ul>
      <p style={s.p}>Carriers are not liable for delayed or undelivered messages.</p>

      <h2 style={s.h2}>10. Changes to Terms</h2>
      <p style={s.p}>We reserve the right to modify these Terms at any time. Material changes will be posted with a new &quot;Last Updated&quot; date.</p>

      <h2 style={s.h2}>11. Governing Law</h2>
      <p style={s.p}>These Terms are governed by applicable United States law. Any disputes will be resolved through binding arbitration or small claims court where applicable.</p>

      <h2 style={s.h2}>12. Contact</h2>
      <p style={s.p}>Questions about these Terms? Reply HELP to any SMS message or contact the music school directly.</p>
    </div>
  );
}

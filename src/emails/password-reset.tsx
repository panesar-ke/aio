import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'react-email';

type Props = {
  name: string;
  resetUrl: string;
  logoUrl: string;
  expiresInMinutes: number;
  supportEmail: string;
};

const serif = { fontFamily: "Georgia, 'Times New Roman', serif" } as const;

const colors = {
  page: '#e9e7e4',
  card: '#f3f2f2',
  border: '#d9d5cf',
  accent: '#8a6427',
  buttonBorder: '#b68235',
  heading: '#201f1d',
  body: '#3a3835',
  muted: '#6b6863',
  footerBg: '#eeece9',
  footerText: '#8a877f',
} as const;

function formatExpiry(minutes: number) {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.round(minutes / 60);
  return hours === 1 ? '1 hour' : `${hours} hours`;
}

export function PasswordResetEmail({
  name,
  resetUrl,
  logoUrl,
  expiresInMinutes,
  supportEmail,
}: Props) {
  const expiry = formatExpiry(expiresInMinutes);

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`Reset your Panesars Kenya Ltd password — this link expires in ${expiry}.`}</Preview>
      <Body style={{ ...serif, backgroundColor: colors.page, margin: 0, padding: '40px 16px' }}>
        <Container
          style={{
            width: '600px',
            maxWidth: '600px',
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            margin: '0 auto',
          }}
        >
          <Section
            style={{
              padding: '40px 48px 24px 48px',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.card,
            }}
          >
            <Img
              src={logoUrl}
              alt="Panesars Kenya Ltd"
              width="140"
              height="73"
              style={{ display: 'block', border: 0, outline: 'none' }}
            />
          </Section>

          <Section style={{ padding: '40px 48px 8px 48px' }}>
            <Heading
              as="h1"
              style={{
                ...serif,
                margin: 0,
                fontWeight: 400,
                fontSize: '28px',
                lineHeight: 1.3,
                color: colors.heading,
              }}
            >
              Reset your password
            </Heading>
          </Section>

          <Section style={{ padding: '16px 48px 0 48px' }}>
            <Text style={{ ...serif, margin: '0 0 16px 0', fontSize: '16px', lineHeight: 1.6, color: colors.body }}>
              Hi {name}, we received a request to reset the password on your
              Panesars Kenya Ltd account. Click the button below to choose a new
              one.
            </Text>
            <Text style={{ ...serif, margin: '0 0 16px 0', fontSize: '16px', lineHeight: 1.6, color: colors.body }}>
              This link expires in {expiry} and can only be used once.
            </Text>
          </Section>

          <Section style={{ padding: '8px 48px 32px 48px' }}>
            <Link
              href={resetUrl}
              style={{
                ...serif,
                display: 'inline-block',
                padding: '14px 32px',
                fontSize: '16px',
                color: colors.accent,
                textDecoration: 'none',
                border: `1px solid ${colors.buttonBorder}`,
                borderRadius: '4px',
                backgroundColor: colors.card,
              }}
            >
              Reset password
            </Link>
          </Section>

          <Section style={{ padding: '0 48px 32px 48px' }}>
            <Hr style={{ borderColor: colors.border, margin: '0 0 24px 0' }} />
            <Text style={{ ...serif, margin: 0, fontSize: '14px', lineHeight: 1.6, color: colors.muted }}>
              If the button above doesn&apos;t work, copy and paste this link
              into your browser:
              <br />
              <Link href={resetUrl} style={{ color: colors.accent, wordBreak: 'break-all' }}>
                {resetUrl}
              </Link>
            </Text>
          </Section>

          <Section style={{ padding: '0 48px 40px 48px' }}>
            <Section style={{ border: `1px solid ${colors.border}`, borderRadius: '4px', padding: '18px 20px' }}>
              <Text style={{ ...serif, margin: 0, fontSize: '14px', lineHeight: 1.6, color: colors.body }}>
                <strong>Didn&apos;t request this?</strong> If you didn&apos;t ask
                to reset your password, you can safely ignore this email — your
                password won&apos;t change unless you click the link above and
                choose a new one.
              </Text>
            </Section>
          </Section>

          <Section style={{ padding: '0 48px 40px 48px' }}>
            <Hr style={{ borderColor: colors.border, margin: '0 0 24px 0' }} />
            <Text style={{ ...serif, margin: 0, fontSize: '14px', lineHeight: 1.6, color: colors.muted }}>
              Need help? Contact us at{' '}
              <Link href={`mailto:${supportEmail}`} style={{ color: colors.accent }}>
                {supportEmail}
              </Link>
            </Text>
          </Section>

          <Section style={{ padding: '24px 48px 40px 48px', backgroundColor: colors.footerBg, textAlign: 'center' }}>
            <Text style={{ ...serif, margin: 0, fontSize: '12px', lineHeight: 1.6, color: colors.footerText }}>
              Panesars Kenya Ltd
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default PasswordResetEmail;

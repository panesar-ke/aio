import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import * as React from 'react';

type Props = {
  subscriptionName: string;
  expiryDays: number;
  expiryDate: string;
};

export function SubscriptionExpirationReminder({
  subscriptionName,
  expiryDays,
  expiryDate,
}: Props) {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Body className="bg-gray-100 font-sans py-10">
          <Container className="bg-white max-w-150 mx-auto rounded-xl overflow-hidden">
            <Section className="bg-rose-600 px-8 py-6">
              <Heading className="text-white text-[24px] font-bold m-0 text-center">
                ⚠️ Subscription Expiring Soon
              </Heading>
            </Section>

            <Section className="px-8 py-8">
              <Text className="text-[18px] font-semibold text-gray-800 mb-4">
                Hi Admin,
              </Text>

              <Text className="text-[16px] text-gray-700 mb-6 leading-6">
                Your subscription to <strong>{subscriptionName}</strong> is set
                to expire in just &nbsp;
                <strong className="text-rose-600">
                  {expiryDays} days
                </strong> on <strong>{expiryDate}</strong>.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

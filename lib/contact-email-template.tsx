import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
} from '@react-email/components';

export function ContactEmail({
  name,
  email,
  message,
}: {
  name: string;
  email: string;
  message: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>New contact form submission from FileShareDrop</Preview>
      <Body
        style={{
          background: '#f9fafb',
          fontFamily: 'Inter, Arial, sans-serif',
        }}
      >
        <Container
          style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 2px 8px #e5e7eb',
            padding: 32,
            maxWidth: 600,
            margin: '40px auto',
          }}
        >
          <Section>
            <Text
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#2563eb',
                marginBottom: 12,
              }}
            >
              📩 New Contact Message
            </Text>
            <Text style={{ fontSize: 18, color: '#374151', marginBottom: 8 }}>
              <b>Name:</b> {name}
              <br />
              <b>Email:</b> {email}
            </Text>
            <Text
              style={{
                fontSize: 18,
                color: '#374151',
                margin: '24px 0',
                background: '#f1f5f9',
                borderRadius: 8,
                padding: 16,
              }}
            >
              {message}
            </Text>
            <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 32 }}>
              FileShareDrop | filesharedrop.com
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

import { Body, Container, Heading, Hr, Html, Preview, Section, Text } from "react-email";

// Brand colours from docs/design.md (contrast-safe dark saffron for text).
const colors = { saffron: "#C2410C", teal: "#0F4C5C", cream: "#FAF7F2", ink: "#1F2937", slate: "#6B7280" };

export function TestEmail({ sentAt }: { sentAt: string }) {
  return (
    <Html lang="en">
      <Preview>Desinetwork email check</Preview>
      <Body style={{ backgroundColor: colors.cream, fontFamily: "Inter, Arial, sans-serif", margin: 0, padding: "24px 0" }}>
        <Container style={{ backgroundColor: "#ffffff", borderRadius: 12, maxWidth: 520, padding: 32 }}>
          <Heading as="h1" style={{ fontSize: 28, margin: "0 0 16px" }}>
            <span style={{ color: colors.saffron }}>Desi</span>
            <span style={{ color: colors.teal }}>network</span>
          </Heading>
          <Text style={{ color: colors.ink, fontSize: 16, lineHeight: "24px" }}>
            This is a test email from Desinetwork. If you can read this in your inbox, email delivery works.
          </Text>
          <Section>
            <Hr style={{ borderColor: "#E7E2D9", margin: "24px 0" }} />
            <Text style={{ color: colors.slate, fontSize: 12, margin: 0 }}>Sent {sentAt}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default TestEmail;

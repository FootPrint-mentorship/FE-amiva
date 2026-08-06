import type { Metadata } from "next";
import { LegalProse, type LegalSection } from "@/components/marketing/legal-prose";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Amiva collects, uses, protects and deletes your data.",
};

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    heading: "Who we are",
    body: [
      "Amiva is an AI personal assistant that helps you manage reminders, calendars, tasks, email and personal notes through WhatsApp and a web dashboard. This policy explains what data we collect, why, how it is protected, and the controls you have over it.",
      "This policy applies to the Amiva WhatsApp assistant, the web application, and any Amiva mobile applications.",
    ],
  },
  {
    id: "data-we-collect",
    heading: "Data we collect",
    body: [
      "Account data: your name, email address, phone number, timezone and preferences, collected when you create an account.",
      "Content you give Amiva: messages you send to the assistant, reminders, tasks, lists, and information you explicitly ask Amiva to remember (memories). Voice notes are transcribed to text to fulfil your request.",
      "Connected provider data: if you connect Google Calendar or Gmail, we access only the data covered by the permissions you grant, and only to deliver the features you use. You can disconnect a provider at any time, which immediately revokes our access.",
      "Usage and device data: technical logs (with personal content masked) used for security, reliability and support.",
    ],
  },
  {
    id: "how-we-use-data",
    heading: "How we use your data",
    body: [
      "We process your data solely to provide Amiva's features: interpreting your requests, executing the actions you approve, delivering notifications on the channels you choose, and retrieving information you ask for.",
      "We do not sell your personal data. We do not use your content, including email, calendar and memories, to train AI models.",
      "Consequential actions (sending email, cancelling meetings, deleting data, sharing information) always require your explicit approval before execution, and every such action is recorded in an activity log you can review.",
    ],
  },
  {
    id: "google-limited-use",
    heading: "Google API Services: Limited Use disclosure",
    body: [
      "Amiva's use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including its Limited Use requirements.",
      "Specifically: Google user data is used only to provide user-facing features you request; it is not transferred to third parties except as necessary to provide those features, to comply with law, or as part of a merger or acquisition with prior notice; it is not used for advertising; and humans do not read it except with your explicit consent, for security purposes, to comply with law, or when the data is aggregated and anonymised.",
    ],
  },
  {
    id: "whatsapp",
    heading: "WhatsApp processing",
    body: [
      "Conversations with Amiva on WhatsApp are delivered through the WhatsApp Business Platform operated by Meta. Message delivery metadata is processed by Meta under its own terms. The content of your conversation with Amiva is processed by us solely to provide the service.",
    ],
  },
  {
    id: "storage-security",
    heading: "Storage and security",
    body: [
      "All data is encrypted in transit (TLS 1.2+) and at rest (AES-256). Provider access tokens are stored in an encrypted vault. Access to production systems is restricted, logged and audited.",
      "Personal content and identifiers are masked in operational logs.",
    ],
  },
  {
    id: "retention-deletion",
    heading: "Retention and deletion",
    body: [
      "Your data is retained while your account is active. You can edit or permanently delete individual memories, reminders, tasks and lists at any time from the dashboard.",
      "You can delete your entire account from the privacy centre. Deletion deactivates your account immediately, revokes all connected provider tokens, and permanently removes your data from active systems within 14 days and from backups according to our backup rotation policy.",
    ],
  },
  {
    id: "your-rights",
    heading: "Your rights",
    body: [
      "You may access, correct, export and delete your personal data at any time through the dashboard's privacy centre, or by contacting us. We honour applicable rights under the Nigeria Data Protection Act (NDPA), the Kenya Data Protection Act 2019, South Africa's POPIA, and other applicable data protection laws.",
    ],
  },
  {
    id: "processors",
    heading: "Service providers",
    body: [
      "We use a small number of infrastructure providers (cloud hosting, AI inference, speech-to-text, email delivery, payments) as processors, bound by data processing agreements. A current list is available on request.",
    ],
  },
  {
    id: "children",
    heading: "Children",
    body: [
      "Amiva is not directed at children under 16, and we do not knowingly collect their data.",
    ],
  },
  {
    id: "changes",
    heading: "Changes to this policy",
    body: [
      "We will notify you of material changes through the service before they take effect. The effective date above always reflects the current version.",
    ],
  },
  {
    id: "contact",
    heading: "Contact",
    body: [
      "For privacy questions or data requests, contact privacy@amiva.app.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalProse
      title="Privacy Policy"
      effectiveDate="1 August 2026"
      draft
      sections={sections}
    />
  );
}

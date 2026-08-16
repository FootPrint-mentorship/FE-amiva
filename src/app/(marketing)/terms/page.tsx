import type { Metadata } from "next";
import { LegalProse, type LegalSection } from "@/components/marketing/legal-prose";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Amiva.",
};

const sections: LegalSection[] = [
  {
    id: "service",
    heading: "The service",
    body: [
      "Amiva is an AI personal assistant available through WhatsApp and a web dashboard. It helps you create reminders, manage calendars and tasks, store notes and retrieve information through natural conversation.",
      "By creating an account or messaging Amiva, you agree to these terms and to our Privacy Policy.",
    ],
  },
  {
    id: "accounts",
    heading: "Accounts",
    body: [
      "You must provide accurate information, be at least 16 years old, and keep your credentials secure. You are responsible for activity on your account. You may close your account at any time from the privacy centre.",
    ],
  },
  {
    id: "ai-assistant",
    heading: "AI assistant: important limitations",
    body: [
      "Amiva uses artificial intelligence to interpret your requests. AI can make mistakes: always review the confirmation Amiva shows before approving consequential actions such as cancelling meetings or deleting saved information.",
      "Amiva does not provide medical, legal, or financial advice, and does not execute financial transactions.",
      "Where Amiva retrieves information for you, it cites its sources; if it cannot find something, it says so rather than guessing. Despite this, you should verify important information independently.",
    ],
  },
  {
    id: "acceptable-use",
    heading: "Acceptable use",
    body: [
      "You may not use Amiva to break the law, infringe others' rights, send spam or unsolicited messages, attempt to access other users' data, probe or disrupt the service, or resell the service without our written consent.",
    ],
  },
  {
    id: "subscriptions",
    heading: "Subscriptions and billing",
    body: [
      "Amiva offers a free plan with usage limits and a paid Pro plan billed monthly in your local currency where supported. Prices are shown before you subscribe. You can cancel at any time; access continues to the end of the paid period. Fees are non-refundable except where required by law.",
      "Fair-use limits apply to unlimited features to protect service quality for everyone.",
    ],
  },
  {
    id: "third-parties",
    heading: "Third-party services",
    body: [
      "Features that use WhatsApp or Google Calendar depend on those providers' availability and terms. Connecting a provider is optional and revocable. We are not responsible for third-party service outages or changes.",
    ],
  },
  {
    id: "ip",
    heading: "Intellectual property",
    body: [
      "You own your content. You grant us the limited licence needed to store and process it in order to run the service. Amiva's software, brand and design are our property.",
    ],
  },
  {
    id: "liability",
    heading: "Disclaimers and liability",
    body: [
      "The service is provided 'as is'. To the maximum extent permitted by law, we disclaim implied warranties and our aggregate liability is limited to the amounts you paid us in the twelve months before the claim. Nothing in these terms excludes liability that cannot be excluded by law.",
    ],
  },
  {
    id: "termination",
    heading: "Suspension and termination",
    body: [
      "We may suspend or terminate accounts that violate these terms or create risk for the service or other users, with notice where practicable. You can export your data before closing your account.",
    ],
  },
  {
    id: "governing-law",
    heading: "Governing law",
    body: [
      "These terms are governed by the laws of the Federal Republic of Nigeria, without prejudice to mandatory consumer protections in your country of residence. [Placeholder: confirm jurisdiction with counsel.]",
    ],
  },
  {
    id: "contact",
    heading: "Contact",
    body: ["Questions about these terms: support@tryamiva.com."],
  },
];

export default function TermsPage() {
  return (
    <LegalProse
      title="Terms of Service"
      effectiveDate="1 August 2026"
      draft={false}
      summary={[
        "Amiva is a personal assistant on WhatsApp and the web: reminders, tasks, calendar and a personal memory.",
        "You need to be at least 16 and keep your account credentials to yourself. Your WhatsApp number identifies you, so don't share access to it.",
        "Important actions (like cancelling calendar events) always ask for your confirmation first; you are responsible for what you approve.",
        "Amiva is an organiser, not a professional adviser, so don't rely on it as your only safeguard for critical matters.",
        "Free plan today; paid plans will have their prices and limits shown before you pay anything.",
        "You can delete your account any time from Settings, data is removed after a 14-day grace period.",
        "Questions? Message us on WhatsApp or email support@tryamiva.com.",
      ]}
      sections={sections}
    />
  );
}

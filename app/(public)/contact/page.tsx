import { Metadata } from "next";
import ContactPageClient from "./contact-client";

export const metadata: Metadata = {
  title: "Contact Us - Get Help & Support",
  description:
    "Get in touch with the Rulxy team. Reach out for support, enterprise inquiries, partnerships, or general questions about our AI-powered app builder.",
  alternates: { canonical: "https://rulxy.com/contact" },
};

export default function ContactPage() {
  return <ContactPageClient />;
}

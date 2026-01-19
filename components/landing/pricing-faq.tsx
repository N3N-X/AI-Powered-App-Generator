"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is RUX and how does it work?",
    answer:
      "RUX is an AI-powered platform that generates production-ready React Native + Expo code from natural language descriptions. Simply describe your app idea, and our AI will generate the code, which you can preview, refine, and deploy to the App Store and Google Play.",
  },
  {
    question: "What's included in the free plan?",
    answer:
      "The free plan includes 20 AI prompts per day, up to 3 projects, live preview functionality, and the ability to export your code as a ZIP file. It's perfect for trying out RUX and building simple apps.",
  },
  {
    question: "Can I use my own Claude API key?",
    answer:
      "Yes! Elite plan users can connect their own Claude API key for unlimited AI generation. Your key is encrypted end-to-end and never stored in plain text. This gives you full control over your AI usage and costs.",
  },
  {
    question: "How do cloud builds work?",
    answer:
      "Pro and Elite plans include access to EAS (Expo Application Services) cloud builds. You can build production-ready APKs for Android and IPAs for iOS directly from your browser. Connect your Apple Developer and Google Play accounts to sign and distribute your apps.",
  },
  {
    question: "Is my code and data secure?",
    answer:
      "Security is our top priority. All sensitive data including API keys, developer credentials, and generated code is encrypted using AES-256-GCM encryption. We never store your credentials in plain text, and all data transfer uses TLS 1.3.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period. All your projects and code will remain accessible, but you'll be downgraded to the free plan limits.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "We offer a 14-day money-back guarantee for first-time subscribers. If you're not satisfied with RUX, contact our support team within 14 days of your first payment for a full refund.",
  },
  {
    question: "What AI models do you use?",
    answer:
      "We use xAI's Grok for Free and Pro plans, offering excellent code generation capabilities. Elite users get access to Anthropic's Claude, our most powerful model, with the option to use their own API key for maximum flexibility.",
  },
];

export function PricingFAQ() {
  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-slate-400">
            Everything you need to know about RUX
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="glass rounded-xl px-6 border-white/10"
              >
                <AccordionTrigger className="text-left text-white hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-400">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

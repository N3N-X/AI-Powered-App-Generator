"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";

const faqs = [
  {
    question: "What is Rulxy and how does it work?",
    answer:
      "Rulxy is an AI-powered platform that generates production-ready code from natural language descriptions. Simply describe your app idea, and our AI will generate the code, which you can preview, refine, and deploy to web, App Store, and Google Play.",
  },
  {
    question: "What's included in the free plan?",
    answer:
      "The free plan includes 3,000 one-time credits, unlimited projects, advanced code generation, live preview, web app deployment, iOS & Android builds, and GitHub integration. It's perfect for trying out Rulxy and building your first apps.",
  },
  {
    question: "How do cloud builds work?",
    answer:
      "All plans include iOS and Android builds using EAS (Expo Application Services). Pro and Elite plans get priority builds and can publish directly to the App Store and Google Play. Connect your Apple Developer and Google Play accounts to sign and distribute your apps.",
  },
  {
    question: "What are custom domains?",
    answer:
      "Pro and Elite plans can connect custom domains to their web apps. Instead of using a rulxy.com subdomain, you can use your own domain like myapp.com for a more professional presence.",
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
    question: "Do you offer refunds or free trials?",
    answer:
      "We don't offer refunds or free trials since we have a generous free plan. You can try Rulxy completely free with 3,000 credits and unlimited projects before deciding to upgrade.",
  },
  {
    question: "What is early access to features?",
    answer:
      "Elite plan members get exclusive early access to new features before they're released to other plans. This includes beta features, experimental tools, and priority access to new capabilities as we develop them.",
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
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-gray-500 dark:text-slate-400">
            Everything you need to know about Rulxy
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="rounded-2xl">
            <CardContent className="p-2 sm:p-4">
              <Accordion type="single" collapsible className="space-y-2">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="rounded-xl px-4 border-gray-200/50 dark:border-white/[0.06]"
                  >
                    <AccordionTrigger className="text-left text-gray-900 dark:text-white hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 dark:text-slate-400">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

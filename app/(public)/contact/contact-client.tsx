"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Send, CheckCircle2 } from "lucide-react";
import { useState, FormEvent } from "react";
import { ContactInfoCards } from "./contact-info-cards";
import { ContactFAQ } from "./contact-faq";

export default function ContactPageClient() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (
      !formData.name ||
      !formData.email ||
      !formData.subject ||
      !formData.message
    ) {
      setError("Please fill in all fields");
      setIsSubmitting(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send message");
      }

      setIsSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send message. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-32 pb-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Get in Touch
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
          Have a question or feedback? We&apos;d love to hear from you. Send us
          a message and we&apos;ll respond as soon as possible.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <ContactInfoCards />

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card className="rounded-3xl">
            <CardContent className="p-8 md:p-12">
              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
                      <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Message Sent Successfully!
                  </h2>
                  <p className="text-gray-600 dark:text-slate-400 mb-8">
                    Thank you for contacting us. We&apos;ll get back to you
                    within 24 hours.
                  </p>
                  <Button
                    onClick={() => setIsSubmitted(false)}
                    variant="gradient"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Send us a Message
                  </h2>
                  <p className="text-gray-600 dark:text-slate-400 mb-8">
                    Fill out the form below and we&apos;ll get back to you as
                    soon as possible.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                      >
                        Full Name *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                        className="bg-white/80 dark:bg-white/5 border-gray-200/50 dark:border-white/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                      >
                        Email Address *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        required
                        className="bg-white/80 dark:bg-white/5 border-gray-200/50 dark:border-white/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                      >
                        Subject *
                      </label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="How can we help you?"
                        required
                        className="bg-white/80 dark:bg-white/5 border-gray-200/50 dark:border-white/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                      >
                        Message *
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us more about your inquiry..."
                        rows={6}
                        required
                        className="bg-white/80 dark:bg-white/5 border-gray-200/50 dark:border-white/10"
                      />
                    </div>

                    {error && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {error}
                        </p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      variant="gradient"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-gray-500 dark:text-slate-500 text-center">
                      By submitting this form, you agree to our{" "}
                      <a
                        href="/privacy"
                        className="text-violet-600 dark:text-violet-400 hover:underline"
                      >
                        Privacy Policy
                      </a>
                      .
                    </p>
                  </form>
                </>
              )}
            </CardContent>
          </Card>

          <ContactFAQ />
        </div>
      </div>
    </div>
  );
}

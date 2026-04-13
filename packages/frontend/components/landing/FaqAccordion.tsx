'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What does the GHC 50 registration fee cover?',
    answer: 'The one-time GHC 50 fee activates your full profile on MediaLink Ghana. This includes AI-powered job matching, unlimited job applications, in-platform messaging with employers, SMS and email notifications for new matches, and lifetime access to the platform. There are no recurring charges for applicants.',
  },
  {
    question: 'How does the matching engine work?',
    answer: 'Our intelligent matching system analyses your skills, experience, location preferences, and salary expectations against all active job listings. Each match is scored on a 0-100 scale so you can prioritise the best-fit opportunities. The algorithm improves over time as you interact with listings.',
  },
  {
    question: 'Is my personal data secure?',
    answer: 'Absolutely. We use 256-bit SSL encryption for all data transfers, store information on secured PostgreSQL databases, and never share your personal details with third parties without your consent. Employers only see your professional profile — not your phone number or address — until you choose to apply.',
  },
  {
    question: 'Can I use mobile money to pay?',
    answer: 'Yes. We accept MTN Mobile Money, Vodafone Cash, AirtelTigo Money, and all major Visa/Mastercard debit and credit cards through our secure Paystack payment gateway. All transactions are processed in Ghana Cedis (GHC).',
  },
  {
    question: 'What is the revenue share model for employers?',
    answer: 'When an applicant is successfully placed through MediaLink Ghana, the employer pays a 3-5% revenue share on the candidate\'s agreed gross salary for 6 months. This means you only pay when you make a successful hire — no upfront placement fees.',
  },
  {
    question: 'How long does employer verification take?',
    answer: 'Company (KYB) verification typically takes 1-2 business days. Our admin team reviews your company registration number, business details, and contact information. You\'ll receive an email notification once your account is approved and you can start posting jobs immediately.',
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className={cn(
              'border rounded-xl transition-all duration-200',
              isOpen ? 'border-brand/20 bg-brand/[0.02] shadow-sm' : 'border-border hover:border-brand/10',
            )}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between px-6 py-4 text-left"
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${i}`}
              id={`faq-trigger-${i}`}
            >
              <span className="font-medium text-sm pr-4">{item.question}</span>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200',
                  isOpen && 'rotate-180',
                )}
              />
            </button>
            <div
              id={`faq-panel-${i}`}
              role="region"
              aria-labelledby={`faq-trigger-${i}`}
              className={cn(
                'grid transition-all duration-200',
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
              )}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

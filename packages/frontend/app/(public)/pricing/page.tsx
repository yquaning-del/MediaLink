import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

const PLANS = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Get started and explore the platform.',
    badge: null,
    features: ['Post up to 2 job listings', 'View matched candidates', 'Basic analytics', 'Platform messaging'],
    cta: 'Get Started Free',
    href: '/auth/register?role=employer',
  },
  {
    name: 'Basic',
    price: 500,
    period: 'month',
    description: 'For small media houses growing their sales team.',
    badge: null,
    features: ['Post up to 10 job listings', 'Priority candidate matching', 'Application pipeline tracking', 'Interview invitation tools', 'Email & SMS notifications', 'Basic analytics dashboard'],
    cta: 'Start Basic Plan',
    href: '/auth/register?role=employer&plan=BASIC',
  },
  {
    name: 'Premium',
    price: 1000,
    period: 'month',
    description: 'For established media companies.',
    badge: 'Most Popular',
    features: ['Unlimited job listings', 'Featured job placements', 'Advanced candidate filters', 'Priority support', 'Full analytics & reports', 'Background check add-on', 'Dedicated account manager'],
    cta: 'Start Premium Plan',
    href: '/auth/register?role=employer&plan=PREMIUM',
  },
  {
    name: 'Enterprise',
    price: 2000,
    period: 'month',
    description: 'For large media groups and networks.',
    badge: null,
    features: ['Everything in Premium', 'Multi-location hiring', 'Custom integrations', 'White-label option', 'SLA guarantee (99.9%)', 'Dedicated implementation', 'Custom reporting'],
    cta: 'Contact Sales',
    href: 'mailto:sales@medialink.com.gh',
  },
];

export default function PricingPage() {
  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            For applicants, it&apos;s a one-time GHC 50 registration fee. For employers, choose the plan that fits your hiring volume.
          </p>
        </div>

        {/* Applicant card */}
        <div className="max-w-md mx-auto mb-12">
          <Card className="border-2 border-brand-accent">
            <CardHeader className="text-center">
              <Badge className="w-fit mx-auto mb-2 bg-brand-accent text-white">For Applicants</Badge>
              <CardTitle>One-Time Registration</CardTitle>
              <div className="text-4xl font-bold text-brand mt-2">GHC 50</div>
              <CardDescription>Pay once. Access forever.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {['Full profile with CV upload', 'AI job matching alerts', 'Apply to unlimited roles', 'In-platform messaging', 'Application tracking dashboard', 'SMS & email notifications'].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" size="lg">
                <Link href="/auth/register">Register as Applicant</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <h2 className="text-2xl font-bold text-center mb-8">Employer Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <Card key={plan.name} className={plan.badge ? 'border-2 border-primary relative' : ''}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">{plan.badge}</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">GHC {plan.price.toLocaleString()}</span>
                  {plan.price > 0 && <span className="text-muted-foreground text-sm">/{plan.period}</span>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild variant={plan.badge ? 'default' : 'outline'} className="w-full">
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

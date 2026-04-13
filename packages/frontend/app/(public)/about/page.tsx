import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users, Target, Award, Globe } from 'lucide-react';

export const metadata = {
  title: 'About Us | MediaLink Ghana',
  description: 'Learn about MediaLink Ghana — the leading media sales recruitment platform connecting talent with media companies across Ghana.',
};

const values = [
  { icon: Target, title: 'Mission-Driven', description: 'We bridge the gap between media sales talent and Ghana\'s top media companies, creating opportunities that drive the industry forward.' },
  { icon: Users, title: 'Community First', description: 'We nurture a community of professionals who support, learn from, and grow alongside each other.' },
  { icon: Award, title: 'Excellence', description: 'We hold ourselves and our platform to the highest standards of quality, reliability, and user experience.' },
  { icon: Globe, title: 'Pan-Ghana Reach', description: 'From Accra to Tamale, we connect talent and opportunities across all 16 regions of Ghana.' },
];

const milestones = [
  { year: '2023', event: 'MediaLink Ghana founded with a mission to transform media sales recruitment.' },
  { year: '2024', event: 'Launched AI-powered matching engine and mobile app for on-the-go access.' },
  { year: '2025', event: 'Surpassed 1,000 successful placements and partnered with 200+ media houses.' },
  { year: '2026', event: 'Expanded to all 16 regions with employer analytics and revenue-share model.' },
];

export default function AboutPage() {
  return (
    <main>
      <section className="bg-gradient-to-br from-brand via-brand to-brand-light text-white py-20 lg:py-28">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">About MediaLink Ghana</h1>
          <p className="text-lg text-white/80 leading-relaxed">
            MediaLink Ghana is the leading recruitment platform purpose-built for Ghana&apos;s media and advertising industry.
            We connect talented sales professionals with media houses, broadcasters, and digital agencies across the country.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v) => (
              <div key={v.title} className="text-center p-6 rounded-xl border bg-white shadow-sm">
                <div className="h-12 w-12 rounded-xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
                  <v.icon className="h-6 w-6 text-brand" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">Our Journey</h2>
          <div className="space-y-8">
            {milestones.map((m, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="shrink-0 w-16 h-16 rounded-full bg-brand flex items-center justify-center text-white font-bold text-sm">
                  {m.year}
                </div>
                <div className="pt-4">
                  <p className="text-muted-foreground">{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 text-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8">
            Whether you&apos;re a media sales professional or a media company looking for talent, MediaLink Ghana has you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/auth/register">Create Your Account</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

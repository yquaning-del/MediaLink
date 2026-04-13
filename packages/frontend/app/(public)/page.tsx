import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  CheckCircle, Users, Briefcase, TrendingUp, Star, ArrowRight,
  Tv, Radio, Globe, Printer, MapPin, Zap, Target, Shield, CreditCard,
  Smartphone, UserCheck, BarChart3, MessageSquare, Search, FileText,
  Building2, Clock, Award, ChevronRight, Sparkles,
} from 'lucide-react';
import { ScrollReveal } from '@/components/landing/ScrollReveal';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';
import { LogoMarquee } from '@/components/landing/LogoMarquee';
import { TestimonialCarousel } from '@/components/landing/TestimonialCarousel';
import { FaqAccordion } from '@/components/landing/FaqAccordion';

const FEATURED_JOBS = [
  { id: '1', title: 'Senior Media Sales Executive', company: 'Multimedia Group', location: 'Accra', type: 'Full-Time', salary: 'GHC 4,000 - 6,000', featured: true, initials: 'MG', color: 'bg-blue-600' },
  { id: '2', title: 'Digital Advertising Sales Lead', company: 'Pulse Ghana', location: 'Accra', type: 'Full-Time', salary: 'GHC 3,500 - 5,500', featured: true, initials: 'PG', color: 'bg-rose-500' },
  { id: '3', title: 'Radio Ad Sales Representative', company: 'Starr FM', location: 'Kumasi', type: 'Commission', salary: 'GHC 2,000 + Commission', featured: false, initials: 'SF', color: 'bg-amber-600' },
  { id: '4', title: 'Outdoor Media Account Manager', company: 'Alliance Media Ghana', location: 'Accra', type: 'Full-Time', salary: 'GHC 3,000 - 4,500', featured: false, initials: 'AM', color: 'bg-emerald-600' },
];

const MEDIA_TYPES = [
  { icon: Tv, label: 'Television', desc: 'TV airtime sales & advertising', count: '35+ roles' },
  { icon: Radio, label: 'Radio', desc: 'Radio ad sales & promotions', count: '42+ roles' },
  { icon: Globe, label: 'Digital', desc: 'Online & programmatic media', count: '28+ roles' },
  { icon: Printer, label: 'Print', desc: 'Newspaper & magazine ad sales', count: '15+ roles' },
  { icon: MapPin, label: 'Outdoor', desc: 'Billboard & OOH advertising', count: '20+ roles' },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">

      {/* ═══════════════════════════════════════════
          HERO — Split Layout
      ═══════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-br from-brand via-brand to-brand-light overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-brand-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-brand-light/20 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[85vh] py-16 lg:py-24">
            {/* Left — Copy */}
            <div className="text-white">
              <Badge className="mb-6 bg-white/15 text-white border-white/20 hover:bg-white/25 backdrop-blur-sm">
                <Sparkles className="h-3 w-3 mr-1.5" />
                Trusted by 120+ media companies across Ghana
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6 tracking-tight">
                Where Ghana&apos;s Best{' '}
                <span className="text-brand-accent">Media Sales Talent</span>{' '}
                Meets Opportunity
              </h1>

              <p className="text-lg text-white/70 mb-8 max-w-lg leading-relaxed">
                Our intelligent matching engine connects top sales professionals with TV, radio, digital, print and outdoor media companies — in an average of 30 days.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Button asChild size="xl" className="bg-brand-accent hover:bg-brand-accent/90 text-white border-0 shadow-lg shadow-brand-accent/25 animate-pulse-gold">
                  <Link href="/auth/register">
                    Find Your Next Role <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="xl" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white hover:text-brand backdrop-blur-sm">
                  <Link href="/auth/register?role=employer">Hire Sales Talent</Link>
                </Button>
              </div>

              {/* Mini Stats */}
              <div className="flex items-center gap-6 text-sm text-white/50">
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span><strong className="text-white/80">500+</strong> Professionals</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4" />
                  <span><strong className="text-white/80">85%</strong> Placement Rate</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span><strong className="text-white/80">30-Day</strong> Avg Hire</span>
                </div>
              </div>
            </div>

            {/* Right — Hero Illustration */}
            <div className="hidden lg:flex items-center justify-center relative">
              {/* Illustrative SVG composition */}
              <svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-md relative z-10" aria-hidden="true">
                {/* Main circle backdrop */}
                <circle cx="250" cy="250" r="200" fill="white" fillOpacity="0.05" />
                <circle cx="250" cy="250" r="160" fill="white" fillOpacity="0.05" />

                {/* Connection lines */}
                <path d="M150 200 L250 170 L350 200" stroke="white" strokeOpacity="0.2" strokeWidth="2" strokeDasharray="6 4" />
                <path d="M180 300 L250 330 L320 300" stroke="white" strokeOpacity="0.2" strokeWidth="2" strokeDasharray="6 4" />
                <path d="M250 170 L250 330" stroke="white" strokeOpacity="0.15" strokeWidth="1.5" strokeDasharray="4 3" />

                {/* TV/Monitor icon */}
                <rect x="100" y="165" width="60" height="45" rx="8" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />
                <line x1="120" y1="210" x2="140" y2="210" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />
                <rect x="115" y="178" width="30" height="18" rx="3" fill="#F39C12" fillOpacity="0.6" />

                {/* Microphone icon */}
                <circle cx="350" cy="185" r="25" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />
                <rect x="343" y="170" width="14" height="22" rx="7" fill="#F39C12" fillOpacity="0.6" />
                <line x1="350" y1="192" x2="350" y2="200" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" />

                {/* Central person/profile */}
                <circle cx="250" cy="240" r="45" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.3" strokeWidth="2" />
                <circle cx="250" cy="225" r="15" fill="white" fillOpacity="0.25" />
                <path d="M225 260 Q250 275 275 260" stroke="white" strokeOpacity="0.25" strokeWidth="2" fill="white" fillOpacity="0.1" />

                {/* Globe/Digital icon */}
                <circle cx="180" cy="315" r="22" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />
                <ellipse cx="180" cy="315" rx="10" ry="22" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
                <line x1="158" y1="315" x2="202" y2="315" stroke="white" strokeOpacity="0.2" strokeWidth="1" />

                {/* Print/Document icon */}
                <rect x="305" y="290" width="40" height="50" rx="6" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />
                <line x1="315" y1="305" x2="335" y2="305" stroke="#F39C12" strokeOpacity="0.5" strokeWidth="2" />
                <line x1="315" y1="315" x2="330" y2="315" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" />
                <line x1="315" y1="325" x2="335" y2="325" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" />

                {/* Floating accent dots */}
                <circle cx="120" cy="135" r="5" fill="#F39C12" fillOpacity="0.5" />
                <circle cx="380" cy="140" r="4" fill="white" fillOpacity="0.3" />
                <circle cx="400" cy="340" r="6" fill="#F39C12" fillOpacity="0.4" />
                <circle cx="100" cy="360" r="3" fill="white" fillOpacity="0.3" />

                {/* Plus signs */}
                <g transform="translate(140, 120)" opacity="0.3">
                  <line x1="0" y1="5" x2="10" y2="5" stroke="white" strokeWidth="1.5" />
                  <line x1="5" y1="0" x2="5" y2="10" stroke="white" strokeWidth="1.5" />
                </g>
                <g transform="translate(370, 260)" opacity="0.3">
                  <line x1="0" y1="5" x2="10" y2="5" stroke="white" strokeWidth="1.5" />
                  <line x1="5" y1="0" x2="5" y2="10" stroke="white" strokeWidth="1.5" />
                </g>

                {/* Match score badge */}
                <rect x="280" y="215" width="55" height="24" rx="12" fill="#F39C12" fillOpacity="0.8" />
                <text x="307" y="231" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">92%</text>
              </svg>

              {/* Floating Job Card */}
              <div className="animate-float absolute -left-4 top-8 z-20">
                <div className="bg-white rounded-2xl shadow-2xl p-5 w-72">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-sm font-bold">MG</div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">Senior Sales Executive</p>
                      <p className="text-xs text-gray-500">Multimedia Group</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">Full-Time</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Accra</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-brand">GHC 4,000 - 6,000</span>
                    <span className="text-xs text-brand-accent font-bold bg-brand-accent/10 px-2 py-0.5 rounded-full">92% Match</span>
                  </div>
                </div>
              </div>

              {/* Floating Candidate Card */}
              <div className="animate-float-delayed absolute right-0 bottom-16 z-20">
                <div className="bg-white rounded-2xl shadow-2xl p-5 w-64">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-brand-accent flex items-center justify-center text-white text-sm font-bold">AM</div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">Abena Mensah</p>
                      <p className="text-xs text-gray-500">Media Sales &middot; 5 yrs exp</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full w-[88%] bg-gradient-to-r from-brand-green to-emerald-400 rounded-full" />
                    </div>
                    <span className="text-xs font-bold text-brand-green">88%</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {['TV Sales', 'Radio', 'Digital'].map((s) => (
                      <span key={s} className="text-[10px] bg-brand/5 text-brand px-2 py-0.5 rounded-full font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Glow backdrop */}
              <div className="w-80 h-80 rounded-full bg-brand-accent/10 blur-3xl absolute" />
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
            <path d="M0 80H1440V30C1440 30 1320 0 1080 10C840 20 720 60 480 50C240 40 120 10 0 30V80Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          TRUSTED-BY LOGO BAR
      ═══════════════════════════════════════════ */}
      <section className="py-10 bg-white border-b">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-widest mb-6">
            Trusted by leading media houses across Ghana
          </p>
          <LogoMarquee />
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ANIMATED STATS
      ═══════════════════════════════════════════ */}
      <section className="py-20 bg-brand relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-light/10 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-accent/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative">
          <ScrollReveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { target: 500, suffix: '+', label: 'Media Sales Professionals', icon: Users },
                { target: 120, suffix: '+', label: 'Media Houses', icon: Building2 },
                { target: 85, suffix: '%', label: 'Placement Success Rate', icon: TrendingUp },
                { target: 30, suffix: '', label: 'Days Average Time-to-Hire', icon: Clock },
              ].map(({ target, suffix, label, icon: Icon }, i) => (
                <div
                  key={label}
                  className="glass rounded-2xl p-6 text-center text-white"
                >
                  <div className="h-12 w-12 rounded-full bg-brand-accent/20 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-brand-accent" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold mb-1">
                    <AnimatedCounter target={target} suffix={suffix} />
                  </div>
                  <p className="text-sm text-white/60">{label}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          MEDIA SECTORS
      ═══════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-b from-gray-50 via-white to-gray-50 relative overflow-hidden">
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-8 w-16 h-16 rounded-full border-2 border-brand/5 animate-float" aria-hidden="true" />
        <div className="absolute bottom-16 right-12 w-8 h-8 bg-brand-accent/5 rotate-45" aria-hidden="true" />
        <div className="absolute top-1/2 right-1/4 w-3 h-3 rounded-full bg-brand/10 animate-float-delayed" aria-hidden="true" />
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">All Sectors</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Every Media Vertical, One Platform</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Whether you specialise in broadcast, digital or outdoor, we have roles across every media sector in Ghana.</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {MEDIA_TYPES.map(({ icon: Icon, label, desc, count }, i) => (
              <ScrollReveal key={label} delay={`animation-delay-${(i + 1) * 100}`}>
                <Card className="text-center group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default border-transparent hover:border-brand/10">
                  <CardContent className="pt-6 pb-5">
                    <div className="h-14 w-14 rounded-2xl bg-brand/5 group-hover:bg-brand/10 flex items-center justify-center mx-auto mb-4 transition-colors">
                      <Icon className="h-7 w-7 text-brand" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{label}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{desc}</p>
                    <span className="text-xs font-medium text-brand-accent">{count}</span>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          DUAL-PATH VALUE PROPOSITION
      ═══════════════════════════════════════════ */}
      <section id="for-seekers" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">Two Paths, One Platform</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Both Sides of the Hire</h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-xl">
            {/* For Applicants */}
            <ScrollReveal direction="left">
              <div className="bg-white p-8 md:p-10 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-brand-accent/10 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-brand-accent" />
                  </div>
                  <h3 className="text-xl font-bold">For Media Sales Professionals</h3>
                </div>

                <ul className="space-y-4 mb-8">
                  {[
                    { icon: Target, text: 'AI-powered job matching tailored to your skills' },
                    { icon: CreditCard, text: 'One-time GHC 50 fee — no recurring charges' },
                    { icon: Building2, text: 'Visibility to 120+ verified media employers' },
                    { icon: MessageSquare, text: 'Direct messaging with hiring managers' },
                    { icon: BarChart3, text: 'Track your applications in real-time' },
                  ].map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-lg bg-brand-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="h-3.5 w-3.5 text-brand-accent" />
                      </div>
                      <span className="text-sm text-muted-foreground">{text}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild size="lg" className="bg-brand-accent hover:bg-brand-accent/90 text-white w-full sm:w-auto">
                  <Link href="/auth/register">
                    Create Your Profile <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </ScrollReveal>

            {/* For Employers */}
            <ScrollReveal direction="right" id="for-employers">
              <div className="bg-brand text-white p-8 md:p-10 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-brand-accent" />
                  </div>
                  <h3 className="text-xl font-bold">For Media Houses & Employers</h3>
                </div>

                <ul className="space-y-4 mb-8">
                  {[
                    { icon: Search, text: 'Access a vetted pool of media sales talent' },
                    { icon: Zap, text: 'Smart candidate ranking by match score' },
                    { icon: FileText, text: 'Subscription plans starting from free' },
                    { icon: Award, text: 'Pay-on-success revenue share model' },
                    { icon: BarChart3, text: 'Full analytics and placement tracking' },
                  ].map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="h-3.5 w-3.5 text-brand-accent" />
                      </div>
                      <span className="text-sm text-white/70">{text}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white hover:text-brand w-full sm:w-auto">
                  <Link href="/auth/register?role=employer">
                    Post a Job <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FEATURED JOBS PREVIEW
      ═══════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative">
        {/* Floating geometric accents */}
        <div className="absolute top-12 right-16 w-20 h-20 border border-brand-accent/10 rounded-xl rotate-12 animate-float" aria-hidden="true" />
        <div className="absolute bottom-20 left-10 w-6 h-6 rounded-full bg-brand/5" aria-hidden="true" />
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">Hot Opportunities</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Job Openings</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">A preview of what&apos;s waiting for you. Register to unlock all listings and apply.</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {FEATURED_JOBS.map((job, i) => (
              <ScrollReveal key={job.id} delay={`animation-delay-${(i + 1) * 100}`}>
                <Card className="group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`h-11 w-11 rounded-xl ${job.color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                        {job.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-sm group-hover:text-brand transition-colors">{job.title}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{job.company} &middot; {job.location}</p>
                          </div>
                          {job.featured && (
                            <Badge className="bg-brand-accent/10 text-brand-accent border-0 text-[10px] shrink-0">Featured</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{job.type}</span>
                          <span className="text-xs font-medium text-brand">{job.salary}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal>
            <div className="text-center mt-8">
              <Button asChild variant="outline" size="lg">
                <Link href="/auth/register">
                  Browse All Jobs <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          HOW IT WORKS — Connected Timeline with Tabs
      ═══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-10">
              <Badge variant="secondary" className="mb-4">Simple Process</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground">Get started in 4 simple steps</p>
            </div>
          </ScrollReveal>

          <Tabs defaultValue="applicants" className="max-w-4xl mx-auto">
            <ScrollReveal>
              <div className="flex justify-center mb-10">
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="applicants" className="px-6">For Applicants</TabsTrigger>
                  <TabsTrigger value="employers" className="px-6">For Employers</TabsTrigger>
                </TabsList>
              </div>
            </ScrollReveal>

            <TabsContent value="applicants">
              <div className="relative">
                {/* Connecting line */}
                <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-brand via-brand-accent to-brand-green" />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {[
                    { step: '01', title: 'Register & Pay', desc: 'Create your account and pay the one-time GHC 50 registration fee via mobile money or card.', icon: CreditCard, color: 'bg-brand' },
                    { step: '02', title: 'Build Your Profile', desc: 'Complete your professional profile including skills, work experience, and career preferences.', icon: FileText, color: 'bg-brand-light' },
                    { step: '03', title: 'Get Matched', desc: 'Our AI matching engine connects you with roles that fit your skills and salary expectations.', icon: Target, color: 'bg-brand-accent' },
                    { step: '04', title: 'Get Hired', desc: 'Apply, interview, and land your ideal media sales role. We celebrate your success.', icon: Award, color: 'bg-brand-green' },
                  ].map(({ step, title, desc, icon: Icon, color }) => (
                    <ScrollReveal key={step}>
                      <div className="text-center relative">
                        <div className={`h-16 w-16 rounded-2xl ${color} text-white flex items-center justify-center mx-auto mb-4 shadow-lg relative z-10`}>
                          <Icon className="h-7 w-7" />
                        </div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Step {step}</span>
                        <h3 className="font-bold mt-1 mb-2">{title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="employers">
              <div className="relative">
                <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-brand via-brand-accent to-brand-green" />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {[
                    { step: '01', title: 'Register Company', desc: 'Create your employer account with company details. Admin verifies in 1-2 business days.', icon: Building2, color: 'bg-brand' },
                    { step: '02', title: 'Post Jobs', desc: 'Create detailed job listings with required skills, salary range, and location preferences.', icon: FileText, color: 'bg-brand-light' },
                    { step: '03', title: 'Review Candidates', desc: 'Browse AI-ranked candidates, review profiles, and manage your hiring pipeline.', icon: Search, color: 'bg-brand-accent' },
                    { step: '04', title: 'Make Placements', desc: 'Hire the best talent and track placements. Only pay the revenue share on success.', icon: Award, color: 'bg-brand-green' },
                  ].map(({ step, title, desc, icon: Icon, color }) => (
                    <ScrollReveal key={step}>
                      <div className="text-center relative">
                        <div className={`h-16 w-16 rounded-2xl ${color} text-white flex items-center justify-center mx-auto mb-4 shadow-lg relative z-10`}>
                          <Icon className="h-7 w-7" />
                        </div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Step {step}</span>
                        <h3 className="font-bold mt-1 mb-2">{title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          TESTIMONIALS CAROUSEL
      ═══════════════════════════════════════════ */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">Testimonials</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by Talent & Employers Alike</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Hear from the professionals and companies who found success through MediaLink Ghana.</p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <TestimonialCarousel />
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FAQ ACCORDION
      ═══════════════════════════════════════════ */}
      <section id="faq" className="py-20 bg-gradient-to-b from-white via-gray-50/50 to-white relative overflow-hidden">
        {/* Subtle noise texture */}
        <div className="absolute top-10 left-1/3 w-40 h-40 rounded-full bg-brand/[0.02] blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-10 right-1/3 w-32 h-32 rounded-full bg-brand-accent/[0.03] blur-3xl" aria-hidden="true" />
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">FAQ</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Everything you need to know about MediaLink Ghana.</p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <FaqAccordion />
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          TRUST BADGES
      ═══════════════════════════════════════════ */}
      <section className="py-16 bg-white border-t">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-10">
              <h3 className="text-lg font-bold text-muted-foreground">Trusted & Secure</h3>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {[
                { icon: Shield, label: '256-bit SSL', sub: 'Encrypted' },
                { icon: CreditCard, label: 'Paystack', sub: 'Verified' },
                { icon: Smartphone, label: 'Mobile Money', sub: 'Accepted' },
                { icon: CheckCircle, label: 'GDPR Ready', sub: 'Compliant' },
                { icon: Award, label: '1,000+', sub: 'Placements' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center gap-2 text-center">
                  <div className="h-14 w-14 rounded-xl bg-brand/5 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Curve Divider */}
      <div className="bg-white" aria-hidden="true">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
          <path d="M0 60V20C360 0 720 40 1080 20C1260 10 1380 30 1440 20V60H0Z" fill="hsl(212, 61%, 27%)" />
        </svg>
      </div>

      {/* ═══════════════════════════════════════════
          SPLIT CTA
      ═══════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-br from-brand via-brand to-brand-light relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-1/4 w-64 h-64 bg-brand-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-brand-light/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative">
          <ScrollReveal>
            <div className="text-center mb-12 text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your <span className="text-brand-accent">Media Sales Career</span>?
              </h2>
              <p className="text-white/70 max-w-xl mx-auto">Join hundreds of media sales professionals and top employers who trust MediaLink Ghana.</p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Applicant CTA */}
              <div className="glass rounded-2xl p-8 text-center text-white">
                <div className="h-14 w-14 rounded-2xl bg-brand-accent/20 flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="h-7 w-7 text-brand-accent" />
                </div>
                <h3 className="text-lg font-bold mb-2">For Job Seekers</h3>
                <p className="text-sm text-white/60 mb-6">Register once, access forever. One-time GHC 50 fee.</p>
                <Button asChild size="lg" className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white border-0">
                  <Link href="/auth/register">Create Your Profile</Link>
                </Button>
              </div>

              {/* Employer CTA */}
              <div className="glass rounded-2xl p-8 text-center text-white">
                <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-7 w-7 text-brand-accent" />
                </div>
                <h3 className="text-lg font-bold mb-2">For Employers</h3>
                <p className="text-sm text-white/60 mb-6">Start with the free plan. Post your first job today.</p>
                <Button asChild size="lg" variant="outline" className="w-full bg-transparent border-white/30 text-white hover:bg-white hover:text-brand">
                  <Link href="/auth/register?role=employer">Post a Job Free</Link>
                </Button>
              </div>
            </div>
          </ScrollReveal>

          {/* Trust Row */}
          <ScrollReveal>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-white/40">
              <div className="flex items-center gap-1.5 text-xs">
                <Shield className="h-4 w-4" />
                <span>256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <CreditCard className="h-4 w-4" />
                <span>Paystack Secured</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Smartphone className="h-4 w-4" />
                <span>Mobile Money Accepted</span>
              </div>
              <span className="text-lg">🇬🇭</span>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}

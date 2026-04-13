import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand to-brand-light flex-col justify-between p-12 text-white">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center">
            <span className="text-white font-bold">ML</span>
          </div>
          <span className="font-bold text-xl">MediaLink Ghana</span>
        </Link>

        <div>
          <blockquote className="text-2xl font-medium leading-relaxed mb-6">
            &ldquo;Ghana&apos;s #1 platform for media sales recruitment. Connecting talent with opportunity.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-bold">AM</div>
            <div>
              <p className="font-semibold text-sm">Abena Mensah</p>
              <p className="text-white/70 text-xs">Senior Media Sales Executive, Joy FM</p>
            </div>
          </div>
        </div>

        <p className="text-white/50 text-sm">&copy; {new Date().getFullYear()} MediaLink Ghana</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center">
                <span className="text-white font-bold text-sm">ML</span>
              </div>
              <span className="font-bold text-xl text-brand">MediaLink Ghana</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

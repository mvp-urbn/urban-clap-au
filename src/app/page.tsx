import Link from 'next/link';
import {
  Sparkles,
  Star,
  Shield,
  Zap,
  ChevronRight,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-slate-900">Urban Clap AU</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <Link
                href="/bookings"
                className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                My Bookings
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                Sign In
              </Link>
            )}
            <Link
              href="/book"
              className="bg-emerald-600 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl hover:bg-emerald-700 transition shadow-sm whitespace-nowrap"
            >
              Book Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-24 grid sm:grid-cols-2 gap-8 sm:gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Australia&apos;s Fixed-Price Home Services Platform
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
              A spotless home,<br />
              <span className="text-emerald-200">done right.</span>
            </h1>
            <p className="text-emerald-100 text-base sm:text-lg leading-relaxed max-w-md">
              Book a vetted, insured cleaning professional in under 60 seconds.
              Fixed prices. Zero surprises.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/book"
                className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 font-bold px-6 py-3.5 rounded-2xl hover:bg-emerald-50 transition shadow-lg text-base"
              >
                Get an Instant Quote
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 pt-2 flex-wrap">
              {[
                { icon: <Clock className="w-4 h-4" />, label: 'Instant booking' },
                { icon: <Shield className="w-4 h-4" />, label: 'Fully insured' },
                { icon: <Star className="w-4 h-4" />, label: '4.9★ average' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-emerald-100 text-sm">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating card */}
          <div className="hidden sm:flex justify-center">
            <div className="bg-white rounded-3xl shadow-2xl p-6 w-72 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Gold Clean</span>
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">MOST POPULAR</span>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                {['Deep kitchen scrub', 'Window wiping', 'All rooms vacuumed', 'Bathrooms & toilets'].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-400">2 bed · 1 bath from</p>
                <p className="text-3xl font-extrabold text-slate-900">$196.00</p>
                <p className="text-xs text-slate-400">AUD incl. GST</p>
              </div>
              <Link
                href="/book"
                className="block text-center bg-emerald-600 text-white font-semibold py-2.5 rounded-xl hover:bg-emerald-700 transition text-sm"
              >
                Book This Package
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">How it works</h2>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">From booking to spotless in three easy steps</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              step: '01',
              icon: <Zap className="w-6 h-6 text-emerald-600" />,
              title: 'Choose your package',
              desc: 'Select Silver, Gold, or Pro based on your home and needs. Fixed prices, always.',
            },
            {
              step: '02',
              icon: <MapPin className="w-6 h-6 text-emerald-600" />,
              title: 'Pick a time & address',
              desc: 'Pick a day and time that works for you. We come to you anywhere in Australia.',
            },
            {
              step: '03',
              icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
              title: 'Relax. We handle the rest.',
              desc: 'A vetted pro arrives on time and delivers a spotless home, guaranteed.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-slate-50 rounded-2xl p-6 space-y-3 border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <span className="text-4xl font-extrabold text-slate-100 leading-none">{item.step}</span>
                <div className="p-2 bg-emerald-100 rounded-xl">{item.icon}</div>
              </div>
              <h3 className="font-bold text-slate-900">{item.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tier showcase */}
      <section className="bg-slate-50 py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Our packages</h2>
            <p className="text-slate-500 mt-2 text-sm sm:text-base">No hidden fees. What you see is what you pay.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                tier: 'Silver',
                icon: <Shield className="w-5 h-5" />,
                color: 'from-slate-500 to-slate-700',
                features: ['Vacuuming', 'Mopping', 'Bathroom clean', 'Kitchen wipe-down'],
                fromPrice: '$139',
                popular: false,
              },
              {
                tier: 'Gold',
                icon: <Star className="w-5 h-5" />,
                color: 'from-amber-400 to-amber-600',
                features: ['All Silver included', 'Window wiping', 'Deep kitchen scrub', 'Skirting boards'],
                fromPrice: '$196',
                popular: true,
              },
              {
                tier: 'Pro',
                icon: <Zap className="w-5 h-5" />,
                color: 'from-violet-500 to-violet-700',
                features: ['All Gold included', 'Inside oven clean', 'Inside fridge clean', 'Top-rated pros only'],
                fromPrice: '$253',
                popular: false,
              },
            ].map((t) => (
              <div
                key={t.tier}
                className={`bg-white rounded-2xl border-2 p-5 space-y-4 ${t.popular ? 'border-amber-400 shadow-lg' : 'border-slate-200'}`}
              >
                {t.popular && (
                  <div className="text-center">
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${t.color} text-white`}>
                    {t.icon}
                  </div>
                  <span className="font-bold text-slate-900 text-lg">{t.tier}</span>
                </div>
                <ul className="space-y-1.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-400">2 bed · 1 bath from</p>
                  <p className="text-2xl font-extrabold text-slate-900">
                    {t.fromPrice} <span className="text-sm font-normal text-slate-400">AUD</span>
                  </p>
                </div>
                <Link
                  href="/book"
                  className="block text-center bg-emerald-600 text-white font-semibold py-2.5 rounded-xl hover:bg-emerald-700 transition text-sm"
                >
                  Book {t.tier}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-700 text-sm">Urban Clap AU</span>
          </div>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Urban Clap AU Pty Ltd · ABN 00 000 000 000 · All prices include GST
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Phone className="w-3.5 h-3.5" />
            <span>1800 URBAN AU</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function ContractorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900">Urban Clap AU</span>
              <span className="ml-2 text-xs font-semibold text-teal-600 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                Contractor
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/contractor/jobs"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              My Jobs
            </Link>
            <Link
              href="/bookings"
              className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition"
            >
              Customer View
            </Link>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}

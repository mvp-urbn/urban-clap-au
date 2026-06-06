'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  TruckIcon,
  LogOut,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Booking, BookingStatus, TIER_BADGE_COLORS } from '@/types';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { getAllBookings, updateBookingStatus } from '@/app/actions/bookings';

interface AdminStats {
  totalRevenueCents: number;
  uniqueCustomers: number;
  pending: number;
  assigned: number;
  completed: number;
  cancelled: number;
  total: number;
}

interface AdminDashboardProps {
  initialBookings: Booking[];
  stats: AdminStats;
}

type FilterTab = 'all' | BookingStatus;

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending_dispatch: 'Pending',
  assigned: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending_dispatch: 'bg-amber-100 text-amber-700',
  assigned: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

function formatDate(dt: string) {
  return new Date(dt).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function AdminDashboard({ initialBookings, stats }: AdminDashboardProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [currentStats, setCurrentStats] = useState<AdminStats>(stats);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filtered =
    activeFilter === 'all' ? bookings : bookings.filter((b) => b.status === activeFilter);

  const handleSignOut = async () => {
    await fetch('/api/admin-auth', { method: 'DELETE' });
    window.location.href = '/admin/login';
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const fresh = await getAllBookings();
      setBookings(fresh ?? []);
      // Recompute stats client-side from fresh data
      const rows = fresh ?? [];
      setCurrentStats({
        totalRevenueCents: rows.filter((r) => r.status === 'completed').reduce((s, r) => s + r.total_price_cents, 0),
        uniqueCustomers: new Set(rows.map((r) => r.customer_id)).size,
        pending: rows.filter((r) => r.status === 'pending_dispatch').length,
        assigned: rows.filter((r) => r.status === 'assigned').length,
        completed: rows.filter((r) => r.status === 'completed').length,
        cancelled: rows.filter((r) => r.status === 'cancelled').length,
        total: rows.length,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: BookingStatus) => {
    setUpdatingId(id);
    const prev = bookings.find((b) => b.id === id)?.status;
    setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status: newStatus } : b)));
    try {
      await updateBookingStatus(id, newStatus);
    } catch {
      if (prev) setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status: prev } : b)));
    } finally {
      setUpdatingId(null);
    }
  };

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: currentStats.total },
    { key: 'pending_dispatch', label: 'Pending', count: currentStats.pending },
    { key: 'assigned', label: 'In Progress', count: currentStats.assigned },
    { key: 'completed', label: 'Completed', count: currentStats.completed },
    { key: 'cancelled', label: 'Cancelled', count: currentStats.cancelled },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-5 h-5 text-slate-500" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-xs text-slate-400">Urban Clap AU</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/admin/contractors"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Contractors</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
            <a
              href="/admin/dispatch"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <TruckIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Dispatch</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
            <Button variant="secondary" size="sm" onClick={handleRefresh} isLoading={isRefreshing}>
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={handleSignOut}>
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
            label="Revenue (Completed)"
            value={formatCents(currentStats.totalRevenueCents)}
            bg="bg-emerald-50"
          />
          <StatCard
            icon={<Users className="w-5 h-5 text-violet-600" />}
            label="Customers"
            value={String(currentStats.uniqueCustomers)}
            bg="bg-violet-50"
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            label="Pending Dispatch"
            value={String(currentStats.pending)}
            bg="bg-amber-50"
          />
          <StatCard
            icon={<TruckIcon className="w-5 h-5 text-blue-600" />}
            label="In Progress"
            value={String(currentStats.assigned)}
            bg="bg-blue-50"
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5 text-slate-600" />}
            label="Completed"
            value={String(currentStats.completed)}
            bg="bg-slate-100"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
                activeFilter === tab.key
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  activeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Bookings table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-slate-300" />
              <p className="text-sm text-slate-400">No bookings in this category.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Customer
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                      Address
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Service
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Price
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((b) => {
                    const tier = (b as any).services?.tier ?? 'Silver';
                    const customerName = (b as any).profiles?.full_name ?? '—';
                    return (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {formatDate(b.scheduled_datetime)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                          {customerName}
                        </td>
                        <td className="px-4 py-3 text-slate-600 hidden md:table-cell max-w-[200px] truncate">
                          {b.address}, {b.suburb} {b.postcode}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'text-xs font-semibold px-2 py-0.5 rounded-full border',
                              TIER_BADGE_COLORS[tier as keyof typeof TIER_BADGE_COLORS]
                            )}
                          >
                            {tier}
                          </span>
                          <span className="ml-1.5 text-xs text-slate-400">
                            {b.bedrooms_count}b/{b.bathrooms_count}ba
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                          {formatCents(b.total_price_cents)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'text-xs font-semibold px-2 py-1 rounded-full',
                              STATUS_COLORS[b.status]
                            )}
                          >
                            {STATUS_LABEL[b.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <ActionMenu
                            booking={b}
                            isUpdating={updatingId === b.id}
                            onStatusChange={(s) => handleStatusChange(b.id, s)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-2">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', bg)}>{icon}</div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ActionMenu({
  booking,
  isUpdating,
  onStatusChange,
}: {
  booking: Booking;
  isUpdating: boolean;
  onStatusChange: (s: BookingStatus) => void;
}) {
  const { status } = booking;

  if (status === 'cancelled' || status === 'completed') {
    return (
      <button
        onClick={() => onStatusChange('cancelled')}
        disabled={status === 'cancelled' || isUpdating}
        className="text-xs text-slate-400 cursor-default"
      >
        {status === 'completed' ? '—' : ''}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {status === 'pending_dispatch' && (
        <button
          onClick={() => onStatusChange('assigned')}
          disabled={isUpdating}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-40 whitespace-nowrap"
        >
          {isUpdating ? '…' : 'Mark Assigned'}
        </button>
      )}
      {status === 'assigned' && (
        <button
          onClick={() => onStatusChange('completed')}
          disabled={isUpdating}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 disabled:opacity-40 whitespace-nowrap"
        >
          {isUpdating ? '…' : 'Mark Completed'}
        </button>
      )}
      <button
        onClick={() => onStatusChange('cancelled')}
        disabled={isUpdating}
        className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40"
        title="Cancel booking"
      >
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
}

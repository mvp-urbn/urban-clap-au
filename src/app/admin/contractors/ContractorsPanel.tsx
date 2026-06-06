'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  TruckIcon,
  LogOut,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
} from 'lucide-react';
import { ContractorStatus, Profile } from '@/types';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { getAllContractors, updateContractorStatus } from '@/app/actions/contractor';

type ContractorRow = Profile & { email: string | null };

type FilterTab = 'all' | ContractorStatus;

const STATUS_LABEL: Record<ContractorStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  suspended: 'Suspended',
};

const STATUS_COLORS: Record<ContractorStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  suspended: 'bg-red-100 text-red-700',
};

export function ContractorsPanel({ initialContractors }: { initialContractors: ContractorRow[] }) {
  const [contractors, setContractors] = useState<ContractorRow[]>(initialContractors);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pending = contractors.filter((c) => c.contractor_status === 'pending').length;
  const approved = contractors.filter((c) => c.contractor_status === 'approved').length;
  const suspended = contractors.filter((c) => c.contractor_status === 'suspended').length;

  const filtered =
    activeFilter === 'all'
      ? contractors
      : contractors.filter((c) => c.contractor_status === activeFilter);

  const handleSignOut = async () => {
    await fetch('/api/admin-auth', { method: 'DELETE' });
    window.location.href = '/admin/login';
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const fresh = await getAllContractors();
      setContractors(fresh as ContractorRow[]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: ContractorStatus) => {
    setUpdatingId(id);
    const prev = contractors.find((c) => c.id === id)?.contractor_status;
    setContractors((cs) =>
      cs.map((c) => (c.id === id ? { ...c, contractor_status: newStatus } : c))
    );
    try {
      await updateContractorStatus(id, newStatus);
    } catch {
      if (prev) {
        setContractors((cs) =>
          cs.map((c) => (c.id === id ? { ...c, contractor_status: prev } : c))
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: contractors.length },
    { key: 'pending', label: 'Pending', count: pending },
    { key: 'approved', label: 'Approved', count: approved },
    { key: 'suspended', label: 'Suspended', count: suspended },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-slate-500" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Contractors</h1>
              <p className="text-xs text-slate-400">Urban Clap AU</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/admin"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-5 h-5 text-violet-600" />}
            label="Total Contractors"
            value={String(contractors.length)}
            bg="bg-violet-50"
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            label="Pending Review"
            value={String(pending)}
            bg="bg-amber-50"
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            label="Approved"
            value={String(approved)}
            bg="bg-emerald-50"
          />
          <StatCard
            icon={<XCircle className="w-5 h-5 text-red-500" />}
            label="Suspended"
            value={String(suspended)}
            bg="bg-red-50"
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

        {/* Contractors table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <Users className="w-8 h-8 text-slate-300" />
              <p className="text-sm text-slate-400">No contractors in this category.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                      ABN
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
                      Insurance Expiry
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
                      Postcodes
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                        {c.full_name ?? '—'}
                        {c.phone_number && (
                          <div className="text-xs text-slate-400 font-normal">{c.phone_number}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                        {c.email ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs hidden md:table-cell">
                        {c.abn ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">
                        {c.insurance_expiry
                          ? new Date(c.insurance_expiry).toLocaleDateString('en-AU', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {c.service_postcodes?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {c.service_postcodes.map((p) => (
                              <span
                                key={p}
                                className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {c.contractor_status ? (
                          <span
                            className={cn(
                              'text-xs font-semibold px-2 py-1 rounded-full',
                              STATUS_COLORS[c.contractor_status]
                            )}
                          >
                            {STATUS_LABEL[c.contractor_status]}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ContractorActions
                          contractor={c}
                          isUpdating={updatingId === c.id}
                          onStatusChange={(s) => handleStatusChange(c.id, s)}
                        />
                      </td>
                    </tr>
                  ))}
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

function ContractorActions({
  contractor,
  isUpdating,
  onStatusChange,
}: {
  contractor: ContractorRow;
  isUpdating: boolean;
  onStatusChange: (s: ContractorStatus) => void;
}) {
  const status = contractor.contractor_status;

  return (
    <div className="flex items-center gap-2">
      {status === 'pending' && (
        <button
          onClick={() => onStatusChange('approved')}
          disabled={isUpdating}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 disabled:opacity-40 whitespace-nowrap"
        >
          {isUpdating ? '…' : 'Approve'}
        </button>
      )}
      {status === 'approved' && (
        <button
          onClick={() => onStatusChange('suspended')}
          disabled={isUpdating}
          className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-40 whitespace-nowrap"
        >
          {isUpdating ? '…' : 'Suspend'}
        </button>
      )}
      {status === 'suspended' && (
        <button
          onClick={() => onStatusChange('approved')}
          disabled={isUpdating}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 disabled:opacity-40 whitespace-nowrap"
        >
          {isUpdating ? '…' : 'Reinstate'}
        </button>
      )}
    </div>
  );
}

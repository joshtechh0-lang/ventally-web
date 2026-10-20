import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tag, Plus, RefreshCw, Loader2, ChevronDown, ChevronUp, X,
} from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Toggle } from '../../components/ui/Toggle';
import { Badge } from '../../components/ui/Badge';
import apiInstance from '../../api/apiInstance';
import { toastSuccess, toastError } from '../../utils/toast';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
interface Discount {
  id: string;
  name: string;
  description: string | null;
  source: 'manual' | 'stripe' | 'verifypass' | 'referral';
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  eligibility_type: 'all' | 'community_verified' | 'referral' | 'manual';
  community_type: string | null;
  applies_to: 'subscription' | 'session' | 'both';
  max_uses: number | null;
  valid_until: string | null;
  is_active: boolean;
  stripe_coupon_id: string | null;
  applied_count: number;
  created_at: string;
}

interface NewDiscountForm {
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  eligibilityType: 'all' | 'community_verified';
  communityType: string;
  appliesTo: 'subscription' | 'session' | 'both';
  maxUses: string;
  validUntil: string;
}

const EMPTY_FORM: NewDiscountForm = {
  name: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  eligibilityType: 'all',
  communityType: '',
  appliesTo: 'subscription',
  maxUses: '',
  validUntil: '',
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function formatValue(d: Discount) {
  return d.discount_type === 'percentage'
    ? `${Number(d.discount_value)}% off`
    : `$${Number(d.discount_value).toFixed(2)} off`;
}

function sourceLabel(s: string) {
  return { manual: 'Manual', stripe: 'Stripe', verifypass: 'VerifyPass', referral: 'Referral' }[s] ?? s;
}

function sourceVariant(s: string): 'primary' | 'success' | 'warning' | 'accent' {
  return ({ manual: 'primary', stripe: 'success', verifypass: 'warning', referral: 'accent' } as any)[s] ?? 'primary';
}

function eligibilityLabel(e: string, ct: string | null) {
  if (e === 'community_verified') return ct ? `Verified (${ct})` : 'Community Verified';
  return { all: 'Everyone', referral: 'Referral', manual: 'Manual' }[e] ?? e;
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------
export const AdminDiscounts = () => {
  const navigate = useNavigate();

  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<NewDiscountForm>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchDiscounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiInstance.get('discounts');
      setDiscounts(res.data?.data ?? res.data ?? []);
    } catch {
      toastError('Failed to load discounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDiscounts(); }, [fetchDiscounts]);

  // ── Toggle active ─────────────────────────────────────────────────────────
  const handleToggle = async (id: string, current: boolean) => {
    setTogglingId(id);
    try {
      await apiInstance.patch(`discounts/${id}`, { isActive: !current });
      setDiscounts(prev =>
        prev.map(d => d.id === id ? { ...d, is_active: !current } : d)
      );
    } catch {
      toastError('Failed to update discount');
    } finally {
      setTogglingId(null);
    }
  };

  // ── Sync Stripe ───────────────────────────────────────────────────────────
  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await apiInstance.post('discounts/sync-stripe');
      const { synced } = res.data?.data ?? {};
      toastSuccess(`Synced ${synced ?? 0} Stripe coupon(s)`);
      await fetchDiscounts();
    } catch {
      toastError('Stripe sync failed');
    } finally {
      setSyncing(false);
    }
  };

  // ── Create discount ───────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.name.trim() || !form.discountValue) {
      toastError('Name and discount value are required');
      return;
    }
    setCreating(true);
    try {
      await apiInstance.post('discounts', {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        eligibilityType: form.eligibilityType,
        communityType: form.communityType || null,
        appliesTo: form.appliesTo,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        validUntil: form.validUntil || null,
      });
      toastSuccess('Discount created and Stripe coupon provisioned');
      setShowCreate(false);
      setForm(EMPTY_FORM);
      await fetchDiscounts();
    } catch {
      toastError('Failed to create discount');
    } finally {
      setCreating(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page-wrapper page-wrapper--wide animate-fade-in pb-20">
      <PageHeader
        title="Discounts"
        subtitle="Manage discount rules and Stripe coupons"
        centered
        onBack={() => navigate(-1)}
      />

      {/* Action row */}
      <div className="flex gap-3 mb-6">
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => setShowCreate(v => !v)}
          className="flex-1"
        >
          {showCreate ? 'Cancel' : 'New Discount'}
        </Button>
        <Button
          variant="glass"
          leftIcon={syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          onClick={handleSync}
          disabled={syncing}
        >
          Sync Stripe
        </Button>
      </div>

      {/* ── Create form ── */}
      {showCreate && (
        <GlassCard bordered padding="lg" className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-white">New Discount Rule</p>
            <button onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }}>
              <X size={18} className="text-white/50 hover:text-white" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs text-white/50 mb-1 uppercase tracking-widest">Name *</label>
              <input
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary"
                placeholder="e.g. Community 20% Off"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-white/50 mb-1 uppercase tracking-widest">Description</label>
              <input
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary"
                placeholder="Optional description"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>

            {/* Type + Value */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-white/50 mb-1 uppercase tracking-widest">Type</label>
                <select
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                  value={form.discountType}
                  onChange={e => setForm(p => ({ ...p, discountType: e.target.value as any }))}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed ($)</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-white/50 mb-1 uppercase tracking-widest">
                  Value * {form.discountType === 'percentage' ? '(%)' : '($)'}
                </label>
                <input
                  type="number"
                  min="0"
                  max={form.discountType === 'percentage' ? '100' : undefined}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary"
                  placeholder={form.discountType === 'percentage' ? '20' : '5.00'}
                  value={form.discountValue}
                  onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))}
                />
              </div>
            </div>

            {/* Eligibility */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-white/50 mb-1 uppercase tracking-widest">Eligibility</label>
                <select
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                  value={form.eligibilityType}
                  onChange={e => setForm(p => ({ ...p, eligibilityType: e.target.value as any }))}
                >
                  <option value="all">Everyone</option>
                  <option value="community_verified">Community Verified</option>
                </select>
              </div>
              {form.eligibilityType === 'community_verified' && (
                <div className="flex-1">
                  <label className="block text-xs text-white/50 mb-1 uppercase tracking-widest">Community Type</label>
                  <select
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                    value={form.communityType}
                    onChange={e => setForm(p => ({ ...p, communityType: e.target.value }))}
                  >
                    <option value="">Any verified</option>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="military">Military</option>
                    <option value="veteran">Veteran</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="nonprofit">Non-Profit</option>
                  </select>
                </div>
              )}
            </div>

            {/* Applies to + Max uses */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-white/50 mb-1 uppercase tracking-widest">Applies To</label>
                <select
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                  value={form.appliesTo}
                  onChange={e => setForm(p => ({ ...p, appliesTo: e.target.value as any }))}
                >
                  <option value="subscription">Subscription</option>
                  <option value="session">Session</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-white/50 mb-1 uppercase tracking-widest">Max Uses</label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary"
                  placeholder="Unlimited"
                  value={form.maxUses}
                  onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
                />
              </div>
            </div>

            {/* Valid until */}
            <div>
              <label className="block text-xs text-white/50 mb-1 uppercase tracking-widest">Valid Until</label>
              <input
                type="date"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                value={form.validUntil}
                onChange={e => setForm(p => ({ ...p, validUntil: e.target.value }))}
              />
            </div>

            <Button
              variant="primary"
              fullWidth
              loading={creating}
              onClick={handleCreate}
            >
              Create Discount + Stripe Coupon
            </Button>
          </div>
        </GlassCard>
      )}

      {/* ── Discount list ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="text-primary animate-spin" />
        </div>
      ) : discounts.length === 0 ? (
        <GlassCard bordered padding="lg" className="text-center">
          <Tag size={36} className="text-primary/40 mx-auto mb-3" />
          <p className="text-sm text-white/60">No discounts yet. Create one above or sync from Stripe.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {discounts.map(d => {
            const isExpanded = expandedId === d.id;
            const isExpiring = d.valid_until && new Date(d.valid_until) < new Date(Date.now() + 7 * 86400000);
            return (
              <GlassCard key={d.id} bordered padding="none" className="overflow-hidden">
                {/* Main row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Active toggle */}
                  <div onClick={e => e.stopPropagation()}>
                    {togglingId === d.id ? (
                      <Loader2 size={16} className="text-primary animate-spin" />
                    ) : (
                      <Toggle
                        checked={d.is_active}
                        onChange={() => handleToggle(d.id, d.is_active)}
                        size="sm"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold truncate ${d.is_active ? 'text-white' : 'text-white/40'}`}>
                        {d.name}
                      </p>
                      <Badge variant={sourceVariant(d.source)} size="sm">
                        {sourceLabel(d.source)}
                      </Badge>
                      {!d.is_active && (
                        <Badge variant="default" size="sm">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-xs text-primary font-bold mt-0.5">{formatValue(d)}</p>
                  </div>

                  {/* Usage + expand */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-white/40">Used</p>
                      <p className="text-sm font-bold text-white">{d.applied_count ?? 0}</p>
                    </div>
                    <button
                      className="text-white/40 hover:text-white transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : d.id)}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/5">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
                      <Detail label="Eligibility" value={eligibilityLabel(d.eligibility_type, d.community_type)} />
                      <Detail label="Applies To" value={d.applies_to} />
                      <Detail label="Max Uses" value={d.max_uses ? String(d.max_uses) : 'Unlimited'} />
                      <Detail
                        label="Valid Until"
                        value={d.valid_until ? new Date(d.valid_until).toLocaleDateString() : 'No expiry'}
                        alert={!!isExpiring}
                      />
                      <Detail label="Times Used" value={String(d.applied_count ?? 0)} />
                      <Detail
                        label="Stripe Coupon"
                        value={d.stripe_coupon_id ?? 'Not provisioned'}
                        mono
                      />
                    </div>
                    {d.description && (
                      <p className="text-xs text-white/50 mt-3 leading-relaxed">{d.description}</p>
                    )}
                    <p className="text-xs text-white/30 mt-3">
                      Created {new Date(d.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-component: detail row inside expanded card
// ---------------------------------------------------------------------------
function Detail({ label, value, mono, alert }: { label: string; value: string; mono?: boolean; alert?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">{label}</p>
      <p className={`text-xs mt-0.5 ${mono ? 'font-mono' : 'font-medium'} ${alert ? 'text-yellow-400' : 'text-white/70'}`}>
        {value}
      </p>
    </div>
  );
}

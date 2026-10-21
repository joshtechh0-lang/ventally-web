import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/ui/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAdmin } from '../../api/hooks/useAdmin';
import {
  User, Mail, Calendar as CalendarIcon, Clock, Shield,
  ChevronRight, ChevronDown, Download, FileText, CheckCircle, UserCog
} from 'lucide-react';
import { toast } from 'react-toastify';
import { GlassModal } from '../../components/ui/GlassModal';
import { cn } from '../../utils/cn';

export const AdminUserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getUserDetail, adminSuspendUser, adminDeleteUser, adminChangeUserRole } = useAdmin();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [suspending, setSuspending] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('support');
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'venter' | 'listener' | 'both'>('venter');
  const [showRoleConfirm, setShowRoleConfirm] = useState(false);
  const [changingRole, setChangingRole] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await getUserDetail(id!);
        setUser(res?.user ?? res);
      } catch (error) {
        toast.error(t('Common.error', 'Error loading details'));
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleToggleSuspend = async () => {
    setSuspending(true);
    try {
      const isCurrentlySuspended = user.status === 'suspended';
      await adminSuspendUser(id!, { suspended: !isCurrentlySuspended });
      setUser({ ...user, status: isCurrentlySuspended ? 'active' : 'suspended' });
      toast.success(isCurrentlySuspended ? t('Admin.review.userSuspended', 'User Reactivated') : t('Admin.review.userSuspended', 'User Suspended'));
    } catch (error) {
      toast.error(t('Common.error', 'Update failed'));
    } finally {
      setSuspending(false);
    }
  };

  const handleExportPDF = () => {
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3000);
  };

  const handleChangeRole = async () => {
    setChangingRole(true);
    try {
      await adminChangeUserRole(id!, selectedRole);
      // Update local user state to reflect new role
      const newRoles = selectedRole === 'both'
        ? ['venter', 'listener']
        : [selectedRole];
      setUser({
        ...user,
        availableRoles: newRoles,
        activeRole: selectedRole === 'both' ? 'listener' : selectedRole,
      });
      setShowRoleConfirm(false);
      toast.success(`Role updated to ${selectedRole === 'both' ? 'Venter + Listener' : selectedRole}`);
    } catch (error) {
      toast.error('Failed to update role');
    } finally {
      setChangingRole(false);
    }
  };

  if (loading) return (
    <div className="page-wrapper animate-fade-in max-w-2xl mx-auto space-y-4">
      <div className="skeleton h-10 w-48 rounded-2xl mx-auto" />
      <div className="skeleton h-48 rounded-3xl" />
      <div className="skeleton h-20 rounded-3xl" />
      <div className="skeleton h-64 rounded-3xl" />
    </div>
  );

  if (!user) return (
    <div className="page-wrapper max-w-2xl mx-auto">
      <PageHeader title={t('Common.notFound', 'User Not Found')} onBack={() => navigate(-1)} />
    </div>
  );

  const stats = [
    { label: t('Admin.userDetail.stats.totalSessions', 'Sessions'), value: user.stats?.totalSessions ?? 0 },
    { label: t('Admin.userDetail.stats.totalMinutes', 'Minutes'), value: Math.round(user.stats?.totalMinutes ?? 0) },
    { label: t('Admin.userDetail.stats.totalPayout', 'Payout'), value: `$${user.stats?.totalPayout ?? 0}` },
  ];

  const roles: string[] = user.availableRoles || (user.activeRole ? [user.activeRole] : (user.role ? [user.role] : []));
  const isListener = roles.includes('listener');

  return (
    <div className="page-wrapper animate-fade-in max-w-2xl mx-auto">
      <PageHeader 
        title={t('Admin.userDetail.title', 'User Detail')} 
        onBack={() => navigate('/admin/users')}
        centered
      />

      <div className="space-y-6 pb-24 px-1">
        {/* User Summary Card */}
        <GlassCard className="py-8 bg-white/[0.02] border-white/5">
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold text-white mb-4 text-center">
              {user.email || user.displayName || 'Anonymous'}
            </h2>
            <div className="space-y-1 text-center mb-6">
              <p className="text-sm text-white font-normal uppercase tracking-wide">
                {t('Admin.subAdminProfile.id', 'ID')}: {user.id}
              </p>
              <p className="text-sm text-white/60 font-normal">
                {t('Admin.subAdminProfile.email', 'Email')}: {user.email}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {roles.length > 0 ? roles.map((role) => (
                <Badge
                  key={role}
                  variant={role === 'listener' ? 'accent' : 'primary'}
                  className="px-5 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px]"
                >
                  {role === 'listener'
                    ? t('Admin.userDetail.listenerBadge', 'Support Guide')
                    : t('Admin.userDetail.venterBadge', 'Venter')}
                </Badge>
              )) : (
                <Badge variant="primary" className="px-5 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px]">
                  {t('Admin.userDetail.venterBadge', 'Venter')}
                </Badge>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Stats Grid - 3 Columns with Bottom Border like native */}
        <div className="grid grid-cols-3 bg-white/10 border border-white/20 rounded-2xl overflow-hidden">
          {stats.map((stat, idx) => (
            <div key={idx} className={cn("flex flex-col items-center py-4", idx < 2 && "border-r border-white/10")}>
              <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-bold">
                {stat.label}
              </span>
              <span className="text-lg font-bold text-white">
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Expandable Sections */}
        <div className="space-y-3">
          <GlassCard padding="none" className="overflow-hidden border-white/5">
            <button 
              onClick={() => setExpandedSection(expandedSection === 'support' ? null : 'support')}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
            >
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                {isListener ? t('Admin.userDetail.listenerInfo') : t('Admin.userDetail.venterInfo', 'Venter info')}
              </span>
              {expandedSection === 'support' ? <ChevronDown size={18} className="text-white" /> : <ChevronRight size={18} className="text-white" />}
            </button>
            
            {expandedSection === 'support' && (
              <div className="px-5 pb-5 space-y-4 animate-slide-down">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white/40">{t('Admin.userDetail.gender')}</span>
                      <span className="text-white/90 font-medium">{user.listenerInfo?.genderIdentity || user.gender || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white/40">{t('Admin.userDetail.ageGroup')}</span>
                      <span className="text-white/90 font-medium">{user.listenerInfo?.ageGroup || user.ageGroup || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white/40">{t('Admin.userDetail.stats.joined')}</span>
                      <span className="text-white/90 font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Verification Documents */}
        {user.verificationDocuments?.length > 0 && (
          <div className="space-y-4 pt-2">
            <h3 className="text-base font-bold text-white mb-4 uppercase tracking-wider">
              {t('Admin.review.verificationDocs', 'Verification Documents')}
            </h3>
            {user.verificationDocuments.map((doc: any, idx: number) => {
              const fileName = doc.originalFileName || doc.original_file_name || 'Document';
              const sizeBytes = doc.fileSizeBytes ?? doc.file_size_bytes;
              const createdAt = doc.createdAt || doc.created_at;
              const fileUrl = doc.fileUrl || doc.file_url || doc.documentUrl || doc.document_url;
              const handleOpen = () => {
                if (fileUrl) window.open(fileUrl, '_blank', 'noopener,noreferrer');
              };
              return (
              <GlassCard
                key={doc.id || idx}
                onClick={handleOpen}
                className={`flex items-center justify-between p-4 border-white/10 ${fileUrl ? 'hover:bg-white/5 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 glass rounded-xl flex items-center justify-center text-accent">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{fileName}</p>
                    <p className="text-[11px] text-white/40">
                      {sizeBytes ? `${Math.round(sizeBytes / 1024)} KB` : '—'}
                      {' • '}
                      {createdAt ? new Date(createdAt).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
                <Badge variant={doc.status === 'approved' ? 'success' : 'default'} className="uppercase text-[9px] font-bold">
                  {doc.status}
                </Badge>
              </GlassCard>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-6">
          <Button
            variant="secondary"
            fullWidth
            onClick={handleToggleSuspend}
            loading={suspending}
            className="rounded-full h-14 font-bold uppercase tracking-widest text-xs"
          >
            {user.status === 'suspended' ? t('Admin.review.suspend', 'Reactivate User') : t('Admin.review.suspend', 'Suspend User')}
          </Button>

          {/* Change Role */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as 'venter' | 'listener' | 'both')}
                className="w-full h-14 rounded-full bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-widest px-5 pr-10 appearance-none cursor-pointer focus:outline-none focus:border-white/30"
              >
                <option value="venter" className="bg-[#1a1a2e] text-white">Venter</option>
                <option value="listener" className="bg-[#1a1a2e] text-white">Listener</option>
                <option value="both" className="bg-[#1a1a2e] text-white">Venter + Listener</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            </div>
            <Button
              variant="glass"
              onClick={() => setShowRoleConfirm(true)}
              leftIcon={<UserCog size={16} />}
              className="rounded-full h-14 px-5 font-bold uppercase tracking-widest text-xs border-white/10 whitespace-nowrap"
            >
              Change Role
            </Button>
          </div>

          <Button
            variant="glass"
            fullWidth
            onClick={handleExportPDF}
            leftIcon={<Download size={18} />}
            className="rounded-full h-14 font-bold uppercase tracking-widest text-xs border-white/10"
          >
            {t('Admin.userDetail.exportPdf', 'Export PDF')}
          </Button>
        </div>
      </div>

      <GlassModal
        isOpen={showExportSuccess}
        onClose={() => setShowExportSuccess(false)}
        icon={<CheckCircle className="text-primary" />}
        title={t('Admin.userDetail.exportSuccess.title', 'Export Completed')}
        message={t('Admin.userDetail.exportSuccess.subtitle', 'Your user data has been exported successfully.')}
        showButtons={false}
      />

      <GlassModal
        isOpen={showRoleConfirm}
        onClose={() => setShowRoleConfirm(false)}
        icon={<UserCog className="text-white" />}
        title="Change User Role"
        message={`Set this user's role to "${selectedRole === 'both' ? 'Venter + Listener' : selectedRole}"? This will update their active role and available roles immediately.`}
        primaryButtonText={changingRole ? 'Updating…' : 'Confirm'}
        secondaryButtonText="Cancel"
        onPrimaryPress={handleChangeRole}
        onSecondaryPress={() => setShowRoleConfirm(false)}
        loading={changingRole}
        showButtons
      />
    </div>
  );
};

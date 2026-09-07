import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { toastInfo } from '../../utils/toast';

type Role = 'venter' | 'listener' | 'admin' | 'sub_admin';

interface ActionRedirectProps {
  destination: string;
  requiredRole?: Role;
}

const roleHome = (role?: string) => {
  if (role === 'listener') return '/listener';
  if (role === 'admin' || role === 'sub_admin') return '/admin';
  return '/venter';
};

export const ActionRedirect = ({ destination, requiredRole }: ActionRedirectProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector((s: RootState) => s.user.isAuthenticated);
  const user = useSelector((s: RootState) => s.user.user as any);
  const userType: string | undefined = user?.userType || user?.role;

  useEffect(() => {
    if (!isAuthenticated) {
      const returnTo = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?returnTo=${returnTo}`, { replace: true });
      return;
    }
    if (requiredRole && userType !== requiredRole) {
      toastInfo("That link isn't available for your account.");
      navigate(roleHome(userType), { replace: true });
      return;
    }
    navigate(destination, { replace: true });
  }, [isAuthenticated, userType, destination, requiredRole, navigate, location.pathname, location.search]);

  return null;
};

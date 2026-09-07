import { ListenerActiveCall } from '../pages/Listener/ListenerActiveCall';
import StandaloneCall from '../pages/StandaloneCall';
import { Routes, Route, Navigate, useLocation, useSearchParams as useSearchParamsRouter } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

// Auth Pages
import { Onboarding } from '../pages/Auth/Onboarding';
import { LoginWeb } from '../pages/Auth/LoginWeb';
import { SignUpWeb } from '../pages/Auth/SignUpWeb';
import { SignUpOTP } from '../pages/Auth/SignUpOTP';
import { NicknameScreen } from '../pages/Auth/NicknameScreen';
import { LanguageSelection } from '../pages/Auth/LanguageSelection';
import { TermsAndConditions } from '../pages/Auth/TermsAndConditions';
import { OptionalQuestionsHero } from '../pages/Auth/OptionalQuestionsHero';
import { VenterQuestionsFlow } from '../pages/Auth/VenterQuestionsFlow';
import { ChoosePlan } from '../pages/Auth/ChoosePlan';
const ListenerTraining = lazy(() => import('../pages/Auth/ListenerTraining').then(m => ({ default: m.ListenerTraining })));
const ListenerWhatToExpect = lazy(() => import('../pages/Auth/ListenerWhatToExpect').then(m => ({ default: m.ListenerWhatToExpect })));
const ListenerPhoneNumber = lazy(() => import('../pages/Auth/ListenerPhoneNumber').then(m => ({ default: m.ListenerPhoneNumber })));
const ListenerLegalFlow = lazy(() => import('../pages/Auth/ListenerLegalFlow').then(m => ({ default: m.ListenerLegalFlow })));
const ListenerTermsAndConditions = lazy(() => import('../pages/Auth/ListenerTermsAndConditions').then(m => ({ default: m.ListenerTermsAndConditions })));
const ListenerVerification = lazy(() => import('../pages/Auth/ListenerVerification').then(m => ({ default: m.ListenerVerification })));
const VerificationInProgress = lazy(() => import('../pages/Auth/VerificationInProgress').then(m => ({ default: m.VerificationInProgress })));
const VerificationVerified = lazy(() => import('../pages/Auth/VerificationVerified').then(m => ({ default: m.VerificationVerified })));
const ResetPasswordWeb = lazy(() => import('../pages/Auth/ResetPasswordWeb').then(m => ({ default: m.ResetPasswordWeb })));
const EmailVerificationWeb = lazy(() => import('../pages/Auth/EmailVerificationWeb').then(m => ({ default: m.EmailVerificationWeb })));
const CreateNewPasswordWeb = lazy(() => import('../pages/Auth/CreateNewPasswordWeb').then(m => ({ default: m.CreateNewPasswordWeb })));
const ResetSuccessfulWeb = lazy(() => import('../pages/Auth/ResetSuccessfulWeb').then(m => ({ default: m.ResetSuccessfulWeb })));

// Common Public Pages
import { LegalDocViewer } from '../pages/Common/LegalDocViewer';

// Email CTA Landing Routes
import { EmailVerifyRedirect } from '../pages/EmailCTA/EmailVerifyRedirect';
import { PasswordResetRedirect } from '../pages/EmailCTA/PasswordResetRedirect';
import { PhoneVerifyRedirect } from '../pages/EmailCTA/PhoneVerifyRedirect';
import { ActionRedirect } from '../pages/EmailCTA/ActionRedirect';

// Role Routers
import { VenterRouter } from './VenterRouter';
import { ListenerRouter } from './ListenerRouter';
import { AdminRouter } from './AdminRouter';

import { PaymentMethodsScreen } from '../pages/Auth/PaymentMethodsScreen';
import { AddPaymentMethodScreen } from '../pages/Auth/AddPaymentMethodScreen';
import { PaymentMethodSavedScreen } from '../pages/Auth/PaymentMethodSavedScreen';
import { SubscriptionSuccessScreen } from '../pages/Auth/SubscriptionSuccessScreen';
import { MainBackground } from '../components/ui/MainBackground';

import { useRoleNavigation } from '../hooks/useRoleNavigation';

const StateGuard = ({ children, role }: { children: React.ReactNode, role: string }) => {
  const user = useSelector((state: RootState) => state.user.user);
  const location = useLocation();
  const { getNextStep } = useRoleNavigation();
  const nextStep = getNextStep(user, location.pathname);

  // If nextStep is a dashboard path, it means they are ready. 
  // If nextStep is an onboarding path (OTP, Nickname, etc), redirect them.
  if (nextStep && nextStep.startsWith('/signup')) {
    return <Navigate to={nextStep} replace />;
  }

  return <>{children}</>;
};

const LoginReturnRedirect = ({ getRoleHome }: { getRoleHome: () => string }) => {
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const params = new URLSearchParams(search);
  const returnTo = params.get('returnTo');
  if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    return <Navigate to={returnTo} replace />;
  }
  return <Navigate to={getRoleHome()} replace />;
};

const AppRouter = () => {
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  const user = useSelector((state: RootState) => state.user.user as any);
  const userType = user?.userType || user?.role;

  // Determine post-login redirect based on role
  const getRoleHome = () => {
    if (userType === 'listener') return '/listener';
    if (userType === 'admin' || userType === 'sub_admin') return '/admin';
    return '/venter'; // default: venter
  };

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
    <Routes>
      {/* ── Onboarding & Auth routes — always accessible so mid-onboarding users don't break ── */}
      <Route path="/" element={<Onboarding />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/login" element={isAuthenticated ? <LoginReturnRedirect getRoleHome={getRoleHome} /> : <LoginWeb />} />
      <Route path="/signup" element={<SignUpWeb />} />
      <Route path="/signup/otp" element={<SignUpOTP />} />
      <Route path="/signup/nickname" element={<NicknameScreen />} />
      <Route path="/signup/language" element={<LanguageSelection />} />
      <Route path="/signup/terms" element={<TermsAndConditions />} />
      <Route path="/signup/questions" element={<OptionalQuestionsHero />} />
      <Route path="/signup/questions/:stepId" element={<VenterQuestionsFlow />} />
      <Route path="/signup/choose-plan" element={<Navigate to="/venter/home" replace />} />
      <Route path="/signup/payment" element={<PaymentMethodsScreen />} />
      <Route path="/signup/payment/add" element={<AddPaymentMethodScreen />} />
      <Route path="/signup/payment/saved" element={<PaymentMethodSavedScreen />} />
      <Route path="/signup/success" element={<Navigate to="/venter/home" replace />} />
      <Route path="/signup/listener-what-to-expect" element={<ListenerWhatToExpect />} />
      <Route path="/signup/listener-training" element={<ListenerTraining />} />
      <Route path="/signup/listener-legal" element={<ListenerLegalFlow />} />
      <Route path="/signup/listener-terms" element={<ListenerTermsAndConditions />} />
      <Route path="/signup/listener-phone" element={<ListenerPhoneNumber />} />
      <Route path="/signup/verification" element={<ListenerVerification />} />
      <Route path="/signup/verification-in-progress" element={<VerificationInProgress />} />
      <Route path="/signup/verification-verified" element={<VerificationVerified />} />
      <Route path="/forgot-password" element={<ResetPasswordWeb />} />
      <Route path="/forgot-password/verify-email" element={<EmailVerificationWeb />} />
      <Route path="/forgot-password/new-password" element={<CreateNewPasswordWeb />} />
      <Route path="/forgot-password/done" element={<ResetSuccessfulWeb />} />

      {/* ── Email CTA Landing Routes — always accessible; redirect internally based on auth ── */}
      <Route path="/email/verify" element={<EmailVerifyRedirect />} />
      <Route path="/password/reset" element={<PasswordResetRedirect />} />
      <Route path="/phone/verify" element={<PhoneVerifyRedirect />} />
      <Route path="/session/start" element={<ActionRedirect destination="/venter" />} />
      <Route path="/call/start" element={<ActionRedirect destination="/chat/finding-listener" requiredRole="venter" />} />
      <Route path="/listener/match" element={<ActionRedirect destination="/listener" requiredRole="listener" />} />
      <Route path="/call/first" element={<ActionRedirect destination="/venter" requiredRole="venter" />} />

      {/* ── Public Legal Document Viewer ── */}
      <Route path="/legal/:docId" element={
        <div className="relative flex flex-col min-h-screen w-full overflow-x-hidden">
          <MainBackground />
          <div className="relative z-10 flex flex-col flex-1 w-full min-h-0">
            <LegalDocViewer />
          </div>
        </div>
      } />

      {/* ── Redirect handler for authenticated users ── */}
      <Route path="/redirect" element={(() => {
        const params = new URLSearchParams(window.location.search);
        const to = params.get('to');
        if (isAuthenticated && to && to.startsWith('/')) {
          return <Navigate to={to} replace />;
        }
        return <Navigate to={isAuthenticated ? getRoleHome() : '/onboarding'} replace />;
      })()} />
      {/* ── App routes — gated by authentication ── */}
      {isAuthenticated ? (
        <>
          {/* Venter Routes */}
          <Route path="/venter/*" element={
            userType === 'listener' ? <Navigate to="/listener" replace /> :
            userType === 'admin' || userType === 'sub_admin' ? <Navigate to="/admin" replace /> :
            <StateGuard role="venter"><VenterRouter /></StateGuard>
          } />

          {/* Listener Routes */}
          <Route path="/listener/*" element={
            userType !== 'listener' ? <Navigate to={getRoleHome()} replace /> :
            <StateGuard role="listener"><ListenerRouter /></StateGuard>
          } />

          {/* Admin Routes */}
          <Route path="/admin/*" element={
            userType !== 'admin' && userType !== 'sub_admin' ? <Navigate to={getRoleHome()} replace /> :
            <StateGuard role="admin"><AdminRouter /></StateGuard>
          } />

          {/* Root redirect based on role */}
          <Route path="/login" element={<LoginReturnRedirect getRoleHome={getRoleHome} />} />
          <Route path="*" element={<Navigate to={getRoleHome()} replace />} />
        </>
      ) : (
        /* Unauthenticated — catch-all sends to onboarding */
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      )}
          <Route path="/mobile-call" element={<ListenerActiveCall />} />
          <Route path="/standalone-call" element={<StandaloneCall />} />
    </Routes>
    </Suspense>
  );
};

export default AppRouter;


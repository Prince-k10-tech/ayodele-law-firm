import { RouterProvider, useRouter } from '@/lib/router';
import { AuthProvider } from '@/lib/AuthContext';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AdminPage } from '@/pages/AdminPage';
import { SuperadminPage } from '@/pages/SuperadminPage';
import { ApprovePage } from '@/pages/ApprovePage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { DeviceVerifyPage } from '@/pages/DeviceVerifyPage';
import { FirmProfilePage } from '@/pages/FirmProfilePage';
import { InitialSetupPage } from '@/pages/InitialSetupPage';
import { AccountSetupPage } from '@/pages/AccountSetupPage';

function Routes() {
  const { path } = useRouter();
  if (new URLSearchParams(window.location.search).get('setup') === '1') return <AccountSetupPage />;
  const clean = path.replace(/^\/+/, '') || 'home';

  if (clean.startsWith('initial-setup')) return <InitialSetupPage />;
  if (clean.startsWith('account-setup')) return <AccountSetupPage />;
  if (clean.startsWith('login')) return <LoginPage />;
  if (clean.startsWith('register')) return <RegisterPage />;
  if (clean.startsWith('forgot-password')) return <ForgotPasswordPage />;
  if (clean.startsWith('device-verify')) return <DeviceVerifyPage />;
  if (clean.startsWith('firm-profile')) return <FirmProfilePage />;
  if (clean.startsWith('approve')) return <ApprovePage />;
  if (clean.startsWith('superadmin')) return <SuperadminPage />;
  if (clean.startsWith('admin')) return <AdminPage />;
  if (clean.startsWith('dashboard')) return <DashboardPage />;
  return <HomePage />;
}

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <Routes />
      </AuthProvider>
    </RouterProvider>
  );
}

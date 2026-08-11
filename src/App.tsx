import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { RequireAuth } from './components/RequireAuth';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ComingSoon } from './pages/ComingSoon';
import { AccountList } from './pages/accounts/AccountList';
import { AccountDetail } from './pages/accounts/AccountDetail';
import { AccountForm } from './pages/accounts/AccountForm';
import { BundleDetail } from './pages/subscriptions/BundleDetail';
import { CreateSubscription } from './pages/subscriptions/CreateSubscription';
import { SubscriptionsHome } from './pages/subscriptions/SubscriptionsHome';
import { InvoiceList } from './pages/invoices/InvoiceList';
import { InvoiceDetail } from './pages/invoices/InvoiceDetail';
import { PaymentList } from './pages/payments/PaymentList';
import { PaymentDetail } from './pages/payments/PaymentDetail';
import { AdminHome } from './pages/admin/AdminHome';
import { AdminTenants } from './pages/admin/AdminTenants';
import { AdminUsers } from './pages/admin/AdminUsers';
import { RoleDefinitions } from './pages/admin/RoleDefinitions';
import { TagDefinitions } from './pages/tags/TagDefinitions';
import { GlobalTags } from './pages/tags/GlobalTags';
import { GlobalCustomFields } from './pages/customFields/GlobalCustomFields';
import { Queues } from './pages/queues/Queues';

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />

                <Route path="/accounts" element={<AccountList />} />
                <Route path="/accounts/new" element={<AccountForm />} />
                <Route path="/accounts/:accountId" element={<AccountDetail />} />
                <Route path="/accounts/:accountId/edit" element={<AccountForm />} />
                <Route path="/accounts/:accountId/bundles/:bundleId" element={<BundleDetail />} />
                <Route path="/accounts/:accountId/subscriptions/new" element={<CreateSubscription />} />

                <Route path="/subscriptions" element={<SubscriptionsHome />} />

                <Route path="/invoices" element={<InvoiceList />} />
                <Route path="/invoices/:invoiceId" element={<InvoiceDetail />} />

                <Route path="/payments" element={<PaymentList />} />
                <Route path="/payments/:paymentId" element={<PaymentDetail />} />

                <Route path="/tags/definitions" element={<TagDefinitions />} />
                <Route path="/tags" element={<GlobalTags />} />
                <Route path="/custom-fields" element={<GlobalCustomFields />} />
                <Route path="/queues" element={<Queues />} />

                <Route path="/admin" element={<AdminHome />}>
                  <Route index element={<AdminTenants />} />
                  <Route path="tenants" element={<AdminTenants />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="roles" element={<RoleDefinitions />} />
                </Route>
                <Route path="*" element={<ComingSoon title="Not found" />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </TenantProvider>
    </AuthProvider>
  );
}

export default App;

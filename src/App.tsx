import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { RequireAuth } from './components/RequireAuth';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ComingSoon } from './pages/ComingSoon';

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
                <Route path="/accounts" element={<ComingSoon title="Accounts" />} />
                <Route path="/subscriptions" element={<ComingSoon title="Subscriptions" />} />
                <Route path="/invoices" element={<ComingSoon title="Invoices" />} />
                <Route path="/payments" element={<ComingSoon title="Payments" />} />
                <Route path="/admin" element={<ComingSoon title="Admin" />} />
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

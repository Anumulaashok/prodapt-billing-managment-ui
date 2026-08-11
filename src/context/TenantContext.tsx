import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { CURRENT_TENANT_STORAGE_KEY } from '../api/client';
import { getUserTenants, listTenants } from '../api/admin';
import { useAuth } from './AuthContext';

export interface TenantOption {
  tenantId: string;
  externalKey: string | null;
}

interface TenantContextValue {
  currentTenant: TenantOption | null;
  availableTenants: TenantOption[];
  setCurrentTenant: (tenant: TenantOption) => void;
  loading: boolean;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

function loadStoredTenantId(): string | null {
  return localStorage.getItem(CURRENT_TENANT_STORAGE_KEY);
}

function persistTenantId(tenantId: string | null) {
  if (tenantId) {
    localStorage.setItem(CURRENT_TENANT_STORAGE_KEY, tenantId);
  } else {
    localStorage.removeItem(CURRENT_TENANT_STORAGE_KEY);
  }
}

/**
 * Resolves which tenant(s) the logged-in user can operate against, straight
 * from the backend: root sees every tenant (GET /1.0/kb/tenants), a
 * tenant-scoped user sees only their own (GET /1.0/kb/security/users/{u}/tenants).
 * There is no manual API key/secret entry anywhere in this app -- a tenant
 * user is auto-scoped to their tenant on login, matching how a real
 * multi-tenant SaaS admin console works (see TenantAuthInterceptor on the
 * backend for the enforcement side of this).
 */
export function TenantProvider({ children }: { children: ReactNode }) {
  const { currentUser, isAuthenticated } = useAuth();

  const [availableTenants, setAvailableTenants] = useState<TenantOption[]>([]);
  const [currentTenantId, setCurrentTenantIdState] = useState<string | null>(loadStoredTenantId);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      setAvailableTenants([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const fetchTenants = currentUser.isRoot
      ? listTenants().then((r) => r.tenants)
      : getUserTenants(currentUser.username);

    fetchTenants
      .then((tenants) => {
        if (cancelled) return;
        const options = tenants.map((t) => ({ tenantId: t.tenantId, externalKey: t.externalKey }));
        setAvailableTenants(options);
        setCurrentTenantIdState((prev) => {
          const stillValid = prev && options.some((o) => o.tenantId === prev);
          const next = stillValid ? prev : (options[0]?.tenantId ?? null);
          persistTenantId(next);
          return next;
        });
      })
      .catch(() => {
        if (!cancelled) setAvailableTenants([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, currentUser]);

  const setCurrentTenant = useCallback((tenant: TenantOption) => {
    persistTenantId(tenant.tenantId);
    setCurrentTenantIdState(tenant.tenantId);
  }, []);

  const currentTenant = useMemo(
    () => availableTenants.find((t) => t.tenantId === currentTenantId) ?? null,
    [availableTenants, currentTenantId],
  );

  const value = useMemo<TenantContextValue>(
    () => ({ currentTenant, availableTenants, setCurrentTenant, loading }),
    [currentTenant, availableTenants, setCurrentTenant, loading],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return ctx;
}

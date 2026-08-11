import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { CURRENT_TENANT_STORAGE_KEY } from '../api/client';

export interface Tenant {
  name: string;
  apiKey: string;
  apiSecret: string;
}

/**
 * Hardcoded default tenant list. The tenant-switcher UI (letting a root
 * user pick among multiple tenants) is a later task; for now there is a
 * single bootstrap tenant matching the backend's default dev setup. The
 * context shape (list + current + setter) already supports adding more
 * tenants later without a rewrite.
 */
export const AVAILABLE_TENANTS: Tenant[] = [
  { name: 'Default', apiKey: 'bob', apiSecret: 'lazar' },
];

interface TenantContextValue {
  currentTenant: Tenant;
  availableTenants: Tenant[];
  setCurrentTenant: (tenant: Tenant) => void;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

function loadStoredTenant(): Tenant {
  try {
    const raw = localStorage.getItem(CURRENT_TENANT_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as Tenant;
    }
  } catch {
    // fall through to default
  }
  const fallback = AVAILABLE_TENANTS[0];
  // Persist immediately so the API client (which reads localStorage
  // directly, not through this context) sees a tenant on the very first
  // request too.
  localStorage.setItem(CURRENT_TENANT_STORAGE_KEY, JSON.stringify(fallback));
  return fallback;
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [currentTenant, setCurrentTenantState] = useState<Tenant>(loadStoredTenant);

  const setCurrentTenant = useCallback((tenant: Tenant) => {
    localStorage.setItem(CURRENT_TENANT_STORAGE_KEY, JSON.stringify(tenant));
    setCurrentTenantState(tenant);
  }, []);

  const value = useMemo<TenantContextValue>(
    () => ({
      currentTenant,
      availableTenants: AVAILABLE_TENANTS,
      setCurrentTenant,
    }),
    [currentTenant, setCurrentTenant],
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

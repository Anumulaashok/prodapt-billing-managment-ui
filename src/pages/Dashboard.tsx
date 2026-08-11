import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';

export function Dashboard() {
  const { currentUser } = useAuth();
  const { currentTenant } = useTenant();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>
        Welcome{currentUser ? `, ${currentUser.username}` : ''}. Current tenant:{' '}
        <strong>{currentTenant.name}</strong>.
      </p>
      <p>This is a placeholder dashboard — real widgets land in a later task.</p>
    </div>
  );
}

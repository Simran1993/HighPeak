import { useSyncExternalStore } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bookmark, Compass, Lock, LogOut, Map, Mountain, Plane, Plus, WifiOff } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/auth';
import { Avatar } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/dashboard', label: 'My Trips', icon: Map },
  { to: '/flights', label: 'Flights', icon: Plane },
  { to: '/saved', label: 'Saved', icon: Bookmark },
  { to: '/vault', label: 'Vault', icon: Lock },
];

function useOnline() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('online', cb);
      window.addEventListener('offline', cb);
      return () => {
        window.removeEventListener('online', cb);
        window.removeEventListener('offline', cb);
      };
    },
    () => navigator.onLine,
  );
}

export function AppLayout() {
  const { user, refreshToken, logout } = useAuthStore();
  const navigate = useNavigate();
  const online = useOnline();

  const handleLogout = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen">
      {!online && (
        <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-sm font-medium text-white">
          <WifiOff className="h-4 w-4" /> You're offline — showing saved itineraries. Changes will
          fail until you reconnect.
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
          <Link to="/explore" className="flex items-center gap-2 font-extrabold tracking-tight">
            <Mountain className="h-6 w-6 text-brand-600" />
            <span className="text-lg">HighPeak</span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <Button size="sm" onClick={() => navigate('/trips/new')}>
              <Plus className="h-4 w-4" /> New trip
            </Button>
            {user && (
              <Link
                to={`/users/${user.id}`}
                title="My profile"
                className="flex items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-gray-100"
              >
                <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                <span className="hidden text-sm font-medium sm:block">{user.name}</span>
              </Link>
            )}
            <button
              onClick={handleLogout}
              title="Log out"
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="flex border-t border-gray-100 sm:hidden">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium',
                  isActive ? 'text-brand-700' : 'text-gray-500',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

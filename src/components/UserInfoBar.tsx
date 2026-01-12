// src/components/UserInfoBar.tsx
'use client';

import { useEffect, useState } from 'react';
import { Zap, TrendingUp, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Usage {
  current: number;
  limit: number | string;
  role: string;
}

interface UserInfoBarProps {
  usage?: Usage;
}

export function UserInfoBar({ usage }: UserInfoBarProps) {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Fetch user info from Supabase
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getLimitDisplay = () => {
    if (!usage) return null;
    const limit = usage.limit === 'unlimited' ? '∞' : usage.limit;
    const percentage = usage.limit === 'unlimited' ? 0 : (usage.current / (usage.limit as number)) * 100;
    const isWarning = percentage > 80;
    const isCritical = percentage > 95;

    return (
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xs text-gray-600">Generations Used</p>
          <p className={`text-sm font-semibold ${isCritical ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-gray-900'}`}>
            {usage.current} / {limit}
          </p>
        </div>
        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${isCritical ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-green-500'
              }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  const getTierBadge = () => {
    if (!usage) return null;
    const colors = {
      free: 'bg-gray-100 text-gray-700 border-gray-300',
      pro: 'bg-blue-100 text-blue-700 border-blue-300',
      admin: 'bg-purple-100 text-purple-700 border-purple-300',
    };
    const colorClass = colors[usage.role as keyof typeof colors] || colors.free;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
        {usage.role.charAt(0).toUpperCase() + usage.role.slice(1)} Plan
      </span>
    );
  };

  const shouldShowUpgrade = usage?.role === 'free' && usage.current >= (usage.limit as number);

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="px-6 py-3 flex justify-between items-center">
        {/* Left: Logo/Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            R
          </div>
          <h1 className="text-xl font-bold text-gray-900">RUX</h1>
        </div>

        {/* Center: Status and Upgrades */}
        <div className="flex items-center gap-6">
          {/* Usage Info */}
          {usage && <div className="flex items-center gap-4">{getLimitDisplay()}</div>}

          {/* Upgrade Banner (if needed) */}
          {shouldShowUpgrade && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200 rounded-lg">
              <Zap size={16} className="text-orange-600" />
              <p className="text-sm font-medium text-orange-900">Limit reached</p>
              <button className="ml-2 px-2 py-1 bg-orange-600 text-white text-xs rounded font-semibold hover:bg-orange-700">
                Upgrade to Pro
              </button>
            </div>
          )}

          {/* Plan Badge */}
          <div>{getTierBadge()}</div>
        </div>

        {/* Right: User Menu */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-4 py-2 rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <span className="text-sm text-gray-700 hidden sm:inline">{user?.email?.split('@')[0] || 'User'}</span>
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              </div>

              <a
                href="/settings"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
              >
                Settings
              </a>
              <a
                href="/billing"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
              >
                Billing
              </a>
              {usage?.role === 'free' && (
                <a
                  href="/upgrade"
                  className="block px-4 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 transition flex items-center gap-2"
                >
                  <TrendingUp size={16} />
                  Upgrade to Pro
                </a>
              )}

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2 border-t border-gray-200 mt-2"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

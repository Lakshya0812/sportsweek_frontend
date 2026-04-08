import { NavLink, Link } from 'react-router-dom';
import { Trophy, Swords, LayoutDashboard, LogOut, Star, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import clsx from 'clsx';

const publicLinks = [
  { to: '/', label: 'Leaderboard', icon: Trophy },
  { to: '/matches', label: 'Matches', icon: Swords },
];

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/galaxies', label: 'Galaxies', icon: Star },
  { to: '/admin/players', label: 'Players', icon: Users },
  { to: '/admin/sports', label: 'Sports', icon: Trophy },
  { to: '/admin/matches', label: 'Matches', icon: Swords },
];

function NavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-galaxy-600 text-white'
            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
        )
      }
    >
      <Icon size={16} />
      {label}
    </NavLink>
  );
}

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const isAdmin = isAuthenticated && user?.isStaff;

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-galaxy-400 text-lg">
            <Trophy size={22} className="text-yellow-400" />
            Sports Week
          </Link>

          {/* Links */}
          <div className="flex items-center gap-1">
            {(isAdmin ? adminLinks : publicLinks).map((link) => (
              <NavItem key={link.to} {...link} />
            ))}
          </div>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <>
                <span className="text-xs text-slate-500 hidden sm:block">
                  {user.username}
                </span>
                <button onClick={logout} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5">
                  <LogOut size={14} />
                  Logout
                </button>
              </>
            ) : (
              <Link to="/admin/login" className="btn-primary text-sm py-1.5">
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

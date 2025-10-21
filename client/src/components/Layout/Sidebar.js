import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  CubeIcon, 
  ClipboardDocumentListIcon,
  UsersIcon,
  ChartBarIcon,
  UserIcon,
  CogIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, current: location.pathname === '/dashboard' },
    { name: 'Items', href: '/items', icon: CubeIcon, current: location.pathname.startsWith('/items') },
    { name: 'Transactions', href: '/transactions', icon: ClipboardDocumentListIcon, current: location.pathname.startsWith('/transactions') },
    { name: 'Checkout', href: '/checkout', icon: ClipboardDocumentListIcon, current: location.pathname === '/checkout' },
  ];

  const adminNavigation = [
    { name: 'Users', href: '/users', icon: UsersIcon, current: location.pathname.startsWith('/users') },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, current: location.pathname === '/analytics' },
  ];

  const userNavigation = [
    { name: 'Profile', href: '/profile', icon: UserIcon, current: location.pathname === '/profile' },
    { name: 'Settings', href: '/settings', icon: CogIcon, current: location.pathname === '/settings' },
  ];

  const canAccessAdmin = user?.role === 'admin' || user?.role === 'manager';
  const canManageUsers = user?.permissions?.canManageUsers || user?.role === 'admin';
  const canViewAnalytics = user?.permissions?.canViewAnalytics || user?.role === 'admin';

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 bg-gray-800">
          <div className="flex items-center">
            <CubeIcon className="h-8 w-8 text-blue-400" />
            <span className="ml-2 text-xl font-bold text-white">Inventory Tracker</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              // Hide checkout if user doesn't have permission
              if (item.href === '/checkout' && !user?.permissions?.canCheckout) {
                return null;
              }
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    item.current
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  onClick={onClose}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      item.current ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Admin section */}
          {canAccessAdmin && (
            <div className="mt-8">
              <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Administration
              </h3>
              <div className="mt-2 space-y-1">
                {adminNavigation.map((item) => {
                  // Check specific permissions
                  if (item.href === '/users' && !canManageUsers) return null;
                  if (item.href === '/analytics' && !canViewAnalytics) return null;
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                        item.current
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                      onClick={onClose}
                    >
                      <item.icon
                        className={`mr-3 h-5 w-5 ${
                          item.current ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'
                        }`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* User section */}
          <div className="mt-8">
            <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Account
            </h3>
            <div className="mt-2 space-y-1">
              {userNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    item.current
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  onClick={onClose}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      item.current ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'
                    }`}
                  />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

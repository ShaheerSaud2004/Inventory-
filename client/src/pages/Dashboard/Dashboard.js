import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  CubeIcon, 
  ClipboardDocumentListIcon, 
  UsersIcon, 
  ExclamationTriangleIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline';
import { analyticsAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import StatCard from '../../components/Dashboard/StatCard';
import RecentActivity from '../../components/Dashboard/RecentActivity';
import TopItems from '../../components/Dashboard/TopItems';
import OverdueItems from '../../components/Dashboard/OverdueItems';

const Dashboard = () => {
  const { data: dashboardData, isLoading, error } = useQuery(
    'dashboard',
    () => analyticsAPI.getDashboard(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading dashboard</h3>
        <p className="mt-1 text-sm text-gray-500">Please try refreshing the page.</p>
      </div>
    );
  }

    const { overview, recentActivity, topItems } = dashboardData?.data || {};

  const stats = [
    {
      name: 'Total Items',
      value: overview?.totalItems || 0,
      icon: CubeIcon,
      color: 'blue',
      href: '/items'
    },
    {
      name: 'Active Transactions',
      value: overview?.activeTransactions || 0,
      icon: ClipboardDocumentListIcon,
      color: 'green',
      href: '/transactions'
    },
    {
      name: 'Total Users',
      value: overview?.totalUsers || 0,
      icon: UsersIcon,
      color: 'purple',
      href: '/users'
    },
    {
      name: 'Overdue Items',
      value: overview?.overdueTransactions || 0,
      icon: ExclamationTriangleIcon,
      color: 'red',
      href: '/transactions?status=overdue'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening with your inventory.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.name} stat={stat} />
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              <Link
                to="/transactions"
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            <RecentActivity activities={recentActivity || []} />
          </div>
        </div>

        {/* Top Items */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Most Checked Out Items</h3>
              <Link
                to="/items"
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            <TopItems items={topItems || []} />
          </div>
        </div>
      </div>

      {/* Overdue Items - Full width */}
      {overview?.overdueTransactions > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Overdue Items</h3>
              <Link
                to="/transactions?status=overdue"
                className="text-sm text-red-600 hover:text-red-500 font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            <OverdueItems />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/checkout"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-300 hover:border-gray-400"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                  <ClipboardDocumentListIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Checkout Items
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Check out items from inventory
                </p>
              </div>
            </Link>

            <Link
              to="/items/new"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-300 hover:border-gray-400"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                  <CubeIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Add New Item
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Add a new item to inventory
                </p>
              </div>
            </Link>

            <Link
              to="/transactions"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-300 hover:border-gray-400"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                  <ClipboardDocumentListIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  View Transactions
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Manage all transactions
                </p>
              </div>
            </Link>

            <Link
              to="/analytics"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-300 hover:border-gray-400"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-yellow-50 text-yellow-700 ring-4 ring-white">
                  <ArrowUpIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  View Analytics
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Detailed reports and insights
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { transactionsAPI } from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';

const OverdueItems = () => {
  const { data: overdueData, isLoading, error } = useQuery(
    'overdueTransactions',
    () => transactionsAPI.getOverdueTransactions(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  if (isLoading) {
    return <LoadingSpinner size="sm" />;
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-600">Error loading overdue items</p>
      </div>
    );
  }

  const overdueTransactions = overdueData?.data?.transactions || [];

  if (overdueTransactions.length === 0) {
    return (
      <div className="text-center py-8">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-green-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No overdue items</h3>
        <p className="mt-1 text-sm text-gray-500">All items are returned on time!</p>
      </div>
    );
  }

  const calculateDaysOverdue = (expectedReturnDate) => {
    const now = new Date();
    const expected = new Date(expectedReturnDate);
    const diffTime = Math.abs(now - expected);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-4">
      {overdueTransactions.slice(0, 5).map((transaction) => {
        const daysOverdue = calculateDaysOverdue(transaction.expectedReturnDate);
        
        return (
          <div key={transaction._id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {transaction.item?.name}
                </p>
                <p className="text-xs text-gray-600">
                  Checked out by {transaction.user?.name}
                </p>
                <p className="text-xs text-gray-500">
                  Expected return: {new Date(transaction.expectedReturnDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="text-right">
                <p className="text-sm font-bold text-red-600">
                  {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                </p>
                <p className="text-xs text-gray-500">
                  {transaction.quantity} item{transaction.quantity !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        );
      })}
      
      {overdueTransactions.length > 5 && (
        <div className="pt-2">
          <Link
            to="/transactions?status=overdue"
            className="text-sm text-red-600 hover:text-red-500 font-medium"
          >
            View all overdue items →
          </Link>
        </div>
      )}
    </div>
  );
};

export default OverdueItems;

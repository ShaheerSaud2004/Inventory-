import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';

const Analytics = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          View detailed analytics and reports.
        </p>
      </div>

      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Analytics Coming Soon</h3>
        <p className="mt-1 text-sm text-gray-500">
          Advanced analytics features are being implemented.
        </p>
      </div>
    </div>
  );
};

export default Analytics;

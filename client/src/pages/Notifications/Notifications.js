import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';

const Notifications = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage your notifications.
        </p>
      </div>

      <div className="text-center py-12">
        <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
        <p className="mt-1 text-sm text-gray-500">
          You'll receive notifications for important updates and activities.
        </p>
      </div>
    </div>
  );
};

export default Notifications;

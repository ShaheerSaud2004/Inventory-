import React from 'react';
import { 
  ArrowUpIcon, 
  ArrowDownIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

const RecentActivity = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8">
        <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
        <p className="mt-1 text-sm text-gray-500">Activity will appear here as users interact with the system.</p>
      </div>
    );
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'checkout':
        return <ArrowUpIcon className="h-5 w-5 text-green-500" />;
      case 'return':
        return <ArrowDownIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'checkout':
        return 'text-green-600 bg-green-100';
      case 'return':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.slice(0, 5).map((activity, activityIdx) => (
          <li key={activity._id}>
            <div className="relative pb-8">
              {activityIdx !== activities.length - 1 ? (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium text-gray-900">{activity.user?.name}</span>{' '}
                      {activity.type === 'checkout' ? 'checked out' : 'returned'}{' '}
                      <span className="font-medium text-gray-900">{activity.quantity}x {activity.item?.name}</span>
                    </p>
                    {activity.purpose && (
                      <p className="text-xs text-gray-400 mt-1">
                        Purpose: {activity.purpose}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm whitespace-nowrap text-gray-500">
                    {formatDate(activity.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentActivity;

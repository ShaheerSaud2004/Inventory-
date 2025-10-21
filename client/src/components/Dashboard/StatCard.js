import React from 'react';
import { Link } from 'react-router-dom';

const StatCard = ({ stat }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <Link to={stat.href} className="block">
      <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`p-3 rounded-md ${colorClasses[stat.color] || 'bg-gray-500'}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {stat.name}
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stat.value}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default StatCard;

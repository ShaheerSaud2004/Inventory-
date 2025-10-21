import React from 'react';
import { Link } from 'react-router-dom';
import { CubeIcon } from '@heroicons/react/24/outline';

const TopItems = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8">
        <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No items data</h3>
        <p className="mt-1 text-sm text-gray-500">Item usage statistics will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.slice(0, 5).map((item, index) => (
        <div key={item._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {index + 1}
                </span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {item.itemName}
              </p>
              <p className="text-xs text-gray-500">
                {item.itemCategory}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {item.totalCheckouts}
              </p>
              <p className="text-xs text-gray-500">
                checkouts
              </p>
            </div>
          </div>
        </div>
      ))}
      
      {items.length > 5 && (
        <div className="pt-2">
          <Link
            to="/items"
            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            View all items →
          </Link>
        </div>
      )}
    </div>
  );
};

export default TopItems;

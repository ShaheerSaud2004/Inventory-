import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const Transactions = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage all item transactions.
        </p>
      </div>

      <div className="text-center py-12">
        <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Transactions Coming Soon</h3>
        <p className="mt-1 text-sm text-gray-500">
          Transaction management features are being implemented.
        </p>
        <div className="mt-6">
          <Link
            to="/checkout"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Checkout Items
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Transactions;

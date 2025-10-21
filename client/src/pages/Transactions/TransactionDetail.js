import React from 'react';
import { useParams } from 'react-router-dom';

const TransactionDetail = () => {
  const { id } = useParams();
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Transaction Details</h1>
        <p className="text-gray-600">Transaction ID: {id}</p>
        <p className="mt-4">Transaction details coming soon...</p>
      </div>
    </div>
  );
};

export default TransactionDetail;

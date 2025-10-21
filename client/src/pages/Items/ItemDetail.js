import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { itemsAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const ItemDetail = () => {
  const { id } = useParams();
  
  const { data: item, isLoading, error } = useQuery(
    ['item', id],
    () => itemsAPI.getItem(id)
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading item</div>;
  if (!item) return <div>Item not found</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">{item.data.name}</h1>
        <p className="text-gray-600">{item.data.description}</p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Category:</span> {item.data.category}
          </div>
          <div>
            <span className="font-medium">Available:</span> {item.data.availableQuantity}
          </div>
        </div>
        <div className="mt-4">
          <Link to="/items" className="text-blue-600 hover:text-blue-500">
            ← Back to Items
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;

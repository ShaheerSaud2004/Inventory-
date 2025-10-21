import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { itemsAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const EditItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: item, isLoading } = useQuery(
    ['item', id],
    () => itemsAPI.getItem(id)
  );

  const updateItemMutation = useMutation(
    (data) => itemsAPI.updateItem(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['item', id]);
        queryClient.invalidateQueries('items');
        toast.success('Item updated successfully!');
        navigate('/items');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update item');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    updateItemMutation.mutate(data);
  };

  if (isLoading) return <LoadingSpinner />;
  if (!item) return <div>Item not found</div>;

  const itemData = item.data;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Item</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              required
              defaultValue={itemData.name}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={itemData.description}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input
                type="text"
                name="category"
                required
                defaultValue={itemData.category}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Unit</label>
              <select
                name="unit"
                defaultValue={itemData.unit}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="piece">Piece</option>
                <option value="kg">Kilogram</option>
                <option value="g">Gram</option>
                <option value="liter">Liter</option>
                <option value="ml">Milliliter</option>
                <option value="meter">Meter</option>
                <option value="cm">Centimeter</option>
                <option value="box">Box</option>
                <option value="pack">Pack</option>
                <option value="set">Set</option>
                <option value="pair">Pair</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Quantity</label>
              <input
                type="number"
                name="totalQuantity"
                required
                min="0"
                defaultValue={itemData.totalQuantity}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Available Quantity</label>
              <input
                type="number"
                name="availableQuantity"
                required
                min="0"
                defaultValue={itemData.availableQuantity}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/items')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateItemMutation.isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {updateItemMutation.isLoading ? 'Updating...' : 'Update Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItem;

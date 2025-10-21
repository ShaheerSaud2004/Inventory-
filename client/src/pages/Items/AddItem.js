import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { itemsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AddItem = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    totalQuantity: '',
    availableQuantity: '',
    unit: 'piece',
    cost: '',
    value: '',
    sku: ''
  });

  const createItemMutation = useMutation(itemsAPI.createItem, {
    onSuccess: () => {
      queryClient.invalidateQueries('items');
      toast.success('Item created successfully!');
      navigate('/items');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create item');
    }
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createItemMutation.mutate(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Item</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input
                type="text"
                name="category"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.category}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Unit</label>
              <select
                name="unit"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.unit}
                onChange={handleChange}
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
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.totalQuantity}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Available Quantity</label>
              <input
                type="number"
                name="availableQuantity"
                required
                min="0"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.availableQuantity}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Cost</label>
              <input
                type="number"
                name="cost"
                min="0"
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.cost}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Value</label>
              <input
                type="number"
                name="value"
                min="0"
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={formData.value}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">SKU (Optional)</label>
            <input
              type="text"
              name="sku"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              value={formData.sku}
              onChange={handleChange}
            />
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
              disabled={createItemMutation.isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {createItemMutation.isLoading ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItem;

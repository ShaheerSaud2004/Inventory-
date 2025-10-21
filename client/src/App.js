import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Items from './pages/Items/Items';
import ItemDetail from './pages/Items/ItemDetail';
import AddItem from './pages/Items/AddItem';
import EditItem from './pages/Items/EditItem';
import Transactions from './pages/Transactions/Transactions';
import TransactionDetail from './pages/Transactions/TransactionDetail';
import Checkout from './pages/Transactions/Checkout';
import Users from './pages/Users/Users';
import UserDetail from './pages/Users/UserDetail';
import Notifications from './pages/Notifications/Notifications';
import Analytics from './pages/Analytics/Analytics';
import Profile from './pages/Profile/Profile';
import Settings from './pages/Settings/Settings';
import LoadingSpinner from './components/UI/LoadingSpinner';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Items Routes */}
        <Route path="/items" element={<Items />} />
        <Route path="/items/new" element={<AddItem />} />
        <Route path="/items/:id" element={<ItemDetail />} />
        <Route path="/items/:id/edit" element={<EditItem />} />
        
        {/* Transactions Routes */}
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/transactions/:id" element={<TransactionDetail />} />
        <Route path="/checkout" element={<Checkout />} />
        
        {/* Users Routes */}
        <Route path="/users" element={<Users />} />
        <Route path="/users/:id" element={<UserDetail />} />
        
        {/* Other Routes */}
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import LayoutEditor from '../components/Editor';
import MenuEditor from '../components/MenuEditor';
import ReservationsManager from '../components/ReservationsManager';
import Navbar from '../components/Navbar';

const AdminPage: React.FC = () => {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'layout' | 'menu' | 'reservations'>('layout');

  useEffect(() => {
    // Redirect if not admin
    if (!loading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [user, loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Панель администратора - Pure Heart</title>
      </Head>
      
      <Navbar />
      
      <main className="pt-20 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Панель администратора</h1>
          </header>

          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <nav className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('layout')}
                className={`py-4 px-6 font-medium text-sm  mb-3 mr-3 ${
                  activeTab === 'layout'
                    ? 'border-b-2 border-blue-500 text-white mb-3 mr-3'
                    : 'text-gray-600 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                План зала
              </button>
              <button
                onClick={() => setActiveTab('menu')}
                className={`py-4 px-6 font-medium text-sm  mb-3 mr-3 ${
                  activeTab === 'menu'
                    ? 'border-b-2 border-blue-500 text-white '
                    : 'text-gray-600 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Меню
              </button>
              <button
                onClick={() => setActiveTab('reservations')}
                className={`py-4 px-6 font-medium text-sm  mb-3 mr-3 ${
                  activeTab === 'reservations'
                    ? 'border-b-2 border-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Бронирования
              </button>
            </nav>
            
            <div className="p-6">
              {activeTab === 'layout' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Редактирование плана зала</h2>
                  <LayoutEditor />
                </div>
              )}
              
              {activeTab === 'menu' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Управление меню</h2>
                  <MenuEditor />
                </div>
              )}
              
              {activeTab === 'reservations' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Управление бронированиями</h2>
                  <ReservationsManager />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default AdminPage; 
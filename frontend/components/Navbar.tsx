import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeSidebar();
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="mr-4 text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <Link href="/" className="text-2xl font-bold text-gray-800">
              Pure Heart
            </Link>
          </div>
          
          {user && (
            <div className="text-sm text-gray-600">
              {user.first_name} {user.last_name}
            </div>
          )}
        </div>
      </header>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Pure Heart</h2>
            <button
              onClick={closeSidebar}
              className="text-white focus:outline-none"
              aria-label="Close menu"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <nav className="mt-6">
            <ul className="space-y-4">
              <li>
                <Link
                  href="/"
                  className={`block py-2 px-4 rounded ${
                    router.pathname === '/' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={closeSidebar}
                >
                  Главная
                </Link>
              </li>
              <li>
                <Link
                  href="/menu"
                  className={`block py-2 px-4 rounded ${
                    router.pathname === '/menu' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={closeSidebar}
                >
                  Меню ресторана
                </Link>
              </li>
              <li>
                <Link
                  href="/booking"
                  className={`block py-2 px-4 rounded ${
                    router.pathname === '/booking' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={closeSidebar}
                >
                  Забронировать стол
                </Link>
              </li>
              
              {user && (
                <>
                  <li>
                    <Link
                      href="/account"
                      className={`block py-2 px-4 rounded ${
                        router.pathname === '/account' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      onClick={closeSidebar}
                    >
                      Мои заказы
                    </Link>
                  </li>
                  {isAdmin && (
                    <>
                      <li>
                        <Link
                          href="/admin"
                          className={`block py-2 px-4 rounded ${
                            router.pathname === '/admin' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                          }`}
                          onClick={closeSidebar}
                        >
                          Панель управления
                        </Link>
                      </li>
                    </>
                  )}
                </>
              )}
            </ul>
          </nav>

          {user ? (
            <div className="mt-8 pt-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full text-left py-2 px-4 rounded text-red-700 hover:bg-red-50"
              >
                Выход
              </button>
            </div>
          ) : (
            <div className="mt-8 pt-4 border-t border-gray-200 space-y-4">
              <Link
                href="/login"
                className="block py-2 px-4 rounded text-blue-600 hover:bg-blue-50"
                onClick={closeSidebar}
              >
                Вход
              </Link>
              <Link
                href="/register"
                className="block py-2 px-4 rounded text-blue-600 hover:bg-blue-50"
                onClick={closeSidebar}
              >
                Регистрация
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        ></div>
      )}
    </>
  );
};

export default Navbar; 
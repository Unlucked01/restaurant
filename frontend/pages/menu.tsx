import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { menuAPI } from '../lib/api';
import Navbar from '../components/Navbar';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  image_url?: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  order: number;
}

const MenuPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await menuAPI.getMenu();
      const { categories = [], items = [] } = data;
      
      // Sort categories by order
      const sortedCategories = [...categories].sort((a, b) => a.order - b.order);
      
      setCategories(sortedCategories);
      setMenuItems(items);
      
      // Set the first category as active by default
      if (sortedCategories.length > 0 && !activeCategory) {
        setActiveCategory(sortedCategories[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch menu:', err);
      setError('Не удалось загрузить меню');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = activeCategory 
    ? menuItems.filter(item => item.category_id === activeCategory)
    : menuItems;

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Неизвестная категория';
  };

  return (
    <>
      <Head>
        <title>Меню - Pure Heart</title>
      </Head>
      
      <Navbar />
      
      <main className="pt-20 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Меню ресторана Pure Heart</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Наше меню сочетает в себе традиционные блюда и современные кулинарные тенденции.
              Все блюда готовятся из свежих сезонных ингредиентов и с любовью к деталям.
            </p>
          </header>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 max-w-3xl mx-auto">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Загрузка меню...</p>
            </div>
          ) : (
            <div>
              {/* Category filters */}
              <div className="mb-8 flex justify-center">
                <div className="flex flex-wrap gap-2 justify-center max-w-4xl">
                  <button
                    onClick={() => setActiveCategory(null)}
                    className={`px-4 py-2 rounded-full ${
                      activeCategory === null
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Все
                  </button>
                  
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`px-4 py-2 rounded-full ${
                        activeCategory === category.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Menu items grid */}
              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map(item => (
                    <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
                      <div className="h-48 overflow-hidden">
                        <img
                          src={item.image_url || item.image || '/images/dish-placeholder.svg'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/dish-placeholder.svg';
                          }}
                        />
                      </div>
                      <div className="p-4">
                        <div className="text-xs uppercase tracking-wide text-blue-600 font-semibold mb-1">
                          {getCategoryName(item.category_id)}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
                        <p className="text-gray-600 text-sm mb-4 h-14 overflow-hidden">
                          {item.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-900">{item.price} ₽</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">В этой категории пока нет блюд</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default MenuPage; 
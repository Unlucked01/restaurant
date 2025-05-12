import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { menuAPI } from '../lib/api';
import { Category, MenuItem } from '../types/components';
import ImageUpload from './ImageUpload';

const MenuEditor: React.FC = () => {
  const [menu, setMenu] = useState<{categories: Category[], items: MenuItem[]}>({ categories: [], items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState<{ id?: string, name: string }>({ name: '' });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  
  // MenuItem form state
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemFormData, setItemFormData] = useState<{
    id?: string,
    name: string,
    description: string,
    price: number,
    category_id: string,
    image_url: string
  }>({
    name: '',
    description: '',
    price: 0,
    category_id: '',
    image_url: ''
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const response = await menuAPI.getMenu();
      setMenu(response.data);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
      setError('Не удалось загрузить меню');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // Category form handlers
  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategoryFormData({ ...categoryFormData, [e.target.name]: e.target.value });
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategoryId) {
        await menuAPI.updateCategory(editingCategoryId, categoryFormData);
        setSuccess('Категория успешно обновлена');
      } else {
        await menuAPI.createCategory(categoryFormData);
        setSuccess('Категория успешно создана');
      }
      
      // Reset form and refresh menu
      setCategoryFormData({ name: '' });
      setShowCategoryForm(false);
      setEditingCategoryId(null);
      fetchMenu();
    } catch (err) {
      console.error('Failed to save category:', err);
      setError('Не удалось сохранить категорию');
    }
  };

  const handleEditCategory = (category: Category) => {
    setCategoryFormData({ id: category.id, name: category.name });
    setEditingCategoryId(category.id);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Вы уверены? Это действие также удалит все блюда в этой категории.')) {
      return;
    }
    
    try {
      await menuAPI.deleteCategory(categoryId);
      setSuccess('Категория успешно удалена');
      fetchMenu();
    } catch (err) {
      console.error('Failed to delete category:', err);
      setError('Не удалось удалить категорию');
    }
  };

  // Menu item form handlers
  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.name === 'price' 
      ? parseFloat(e.target.value) 
      : e.target.value;
    
    setItemFormData({ ...itemFormData, [e.target.name]: value });
  };

  const handleImageUploaded = (imageUrl: string) => {
    setItemFormData(prev => ({
      ...prev,
      image_url: imageUrl
    }));
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItemId) {
        await menuAPI.updateMenuItem(editingItemId, itemFormData);
        setSuccess('Блюдо успешно обновлено');
      } else {
        await menuAPI.createMenuItem(itemFormData);
        setSuccess('Блюдо успешно создано');
      }
      
      // Reset form and refresh menu
      setItemFormData({
        name: '',
        description: '',
        price: 0,
        category_id: menu.categories[0]?.id || '',
        image_url: ''
      });
      setShowItemForm(false);
      setEditingItemId(null);
      fetchMenu();
    } catch (err) {
      console.error('Failed to save menu item:', err);
      setError('Не удалось сохранить блюдо');
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setItemFormData({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category_id: item.category_id,
      image_url: item.image_url || ''
    });
    setEditingItemId(item.id);
    setShowItemForm(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить это блюдо?')) {
      return;
    }
    
    try {
      await menuAPI.deleteMenuItem(itemId);
      setSuccess('Блюдо успешно удалено');
      fetchMenu();
    } catch (err) {
      console.error('Failed to delete menu item:', err);
      setError('Не удалось удалить блюдо');
    }
  };

  // Default image when no image URL is provided
  const defaultImageUrl = '/images/unknown.png';

  if (loading && menu.categories.length === 0) {
    return <div className="p-4 text-center">Загрузка данных...</div>;
  }

  return (
    <div className="menu-editor">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button 
            className="text-gray-400 hover:text-gray-600 bg-transparent border-none"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>{success}</span>
          <button 
            className="text-gray-400 hover:text-gray-600 bg-transparent border-none"
            onClick={() => setSuccess(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Category Section */}
      <div className="categories-section mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Категории меню</h2>
          <button 
            onClick={() => {
              setCategoryFormData({ name: '' });
              setEditingCategoryId(null);
              setShowCategoryForm(true);
            }}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center"
          >
            <Image 
              src="/images/plus-large-svgrepo-com.svg" 
              alt="Add" 
              width={16} 
              height={16} 
              className="mr-1" 
            />
            Добавить категорию
          </button>
        </div>

        {showCategoryForm && (
          <div className="bg-gray-50 p-4 rounded mb-4">
            <h3 className="text-md font-medium mb-3">
              {editingCategoryId ? 'Редактировать категорию' : 'Новая категория'}
            </h3>
            <form onSubmit={handleCategorySubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Название категории
                </label>
                <input
                  type="text"
                  name="name"
                  value={categoryFormData.name}
                  onChange={handleCategoryChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryForm(false)}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="categories-list divide-y">
          {menu.categories.length === 0 ? (
            <p className="text-gray-500 italic">Нет категорий в меню</p>
          ) : (
            menu.categories.map(category => (
              <div key={category.id} className="py-3 flex justify-between items-center">
                <span className="font-medium">{category.name}</span>
                <div className="space-x-2">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Image 
                      src="/images/edit-svgrepo-com.svg" 
                      alt="Edit" 
                      width={20} 
                      height={20} 
                    />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Image 
                      src="/images/trash-can-svgrepo-com.svg" 
                      alt="Delete" 
                      width={20} 
                      height={20} 
                    />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Menu Items Section */}
      <div className="menu-items-section">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Блюда меню</h2>
          <button 
            onClick={() => {
              setItemFormData({
                name: '',
                description: '',
                price: 0,
                category_id: menu.categories[0]?.id || '',
                image_url: ''
              });
              setEditingItemId(null);
              setShowItemForm(true);
            }}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center"
            disabled={menu.categories.length === 0}
          >
            <Image 
              src="/images/plus-large-svgrepo-com.svg" 
              alt="Add" 
              width={16} 
              height={16} 
              className="mr-1" 
            />
            Добавить блюдо
          </button>
        </div>

        {menu.categories.length === 0 && (
          <p className="text-amber-600">
            Сначала добавьте хотя бы одну категорию, чтобы добавлять блюда
          </p>
        )}

        {showItemForm && (
          <div className="bg-gray-50 p-4 rounded mb-4">
            <h3 className="text-md font-medium mb-3">
              {editingItemId ? 'Редактировать блюдо' : 'Новое блюдо'}
            </h3>
            <form onSubmit={handleItemSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Название блюда
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={itemFormData.name}
                    onChange={handleItemChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Цена (₽)
                  </label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    min="0"
                    value={itemFormData.price}
                    onChange={handleItemChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Описание
                </label>
                <textarea
                  name="description"
                  value={itemFormData.description}
                  onChange={handleItemChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Категория
                </label>
                <select
                  name="category_id"
                  value={itemFormData.category_id}
                  onChange={handleItemChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Выберите категорию</option>
                  {menu.categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Изображение блюда
                </label>
                <ImageUpload 
                  currentImage={itemFormData.image_url}
                  onImageUploaded={handleImageUploaded}
                />
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowItemForm(false)}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        )}

        {menu.categories.map(category => (
          <div key={category.id} className="mb-6">
            <h3 className="font-medium mb-2 bg-gray-100 p-2 rounded">
              {category.name}
            </h3>
            <div className="menu-items-list space-y-2">
              {menu.items.filter(item => item.category_id === category.id).length === 0 ? (
                <p className="text-gray-500 italic pl-2">Нет блюд в этой категории</p>
              ) : (
                menu.items
                  .filter(item => item.category_id === category.id)
                  .map(item => (
                    <div 
                      key={item.id} 
                      className="py-2 px-3 border rounded flex items-center"
                    >
                      <div className="mr-3">
                        <img
                          src={item.image_url || defaultImageUrl}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = defaultImageUrl;
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-600 truncate max-w-xs">
                          {item.description}
                        </div>
                        <div className="text-sm mt-1">{item.price.toFixed(2)} ₽</div>
                      </div>
                      <div className="space-x-2">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <Image 
                            src="/images/edit-svgrepo-com.svg" 
                            alt="Edit" 
                            width={20} 
                            height={20} 
                          />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          <Image 
                            src="/images/trash-can-svgrepo-com.svg" 
                            alt="Delete" 
                            width={20} 
                            height={20} 
                          />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuEditor; 
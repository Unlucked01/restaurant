import React, { useState, useEffect } from 'react';
import { menuAPI } from '../lib/api';
import { Category, MenuItem, OrderItem } from '../types/components';

interface MenuProps {
  onAddToOrder: (item: OrderItem) => void;
  reservationId?: string;
  readOnly?: boolean;
}

const Menu: React.FC<MenuProps> = ({ onAddToOrder, reservationId, readOnly = false }) => {
  const [menu, setMenu] = useState<{categories: Category[], items: MenuItem[]}>({ categories: [], items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const response = await menuAPI.getMenu();
        setMenu(response.data);
        
        if (response.data.categories.length > 0) {
          setSelectedCategory(response.data.categories[0].id);
        }
        
        // Initialize quantities
        const initialQuantities: Record<string, number> = {};
        response.data.items.forEach((item: MenuItem) => {
          initialQuantities[item.id] = 0;
        });
        setQuantities(initialQuantities);
        
      } catch (err) {
        console.error('Failed to fetch menu:', err);
        setError('Не удалось загрузить меню');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const handleQuantityChange = (itemId: string, change: number) => {
    setQuantities((prev) => {
      const newValue = Math.max(0, (prev[itemId] || 0) + change);
      return { ...prev, [itemId]: newValue };
    });
  };

  const handleAddToOrder = (itemId: string) => {
    if (quantities[itemId] > 0) {
      onAddToOrder({
        menu_item_id: itemId,
        quantity: quantities[itemId]
      });
      
      // Reset quantity after adding to order
      setQuantities((prev) => ({ ...prev, [itemId]: 0 }));
    }
  };

  if (loading) return <div className="p-4 text-center">Загрузка меню...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (menu.categories.length === 0) return <div className="p-4 text-center">Меню пока недоступно</div>;

  const filteredItems = selectedCategory 
    ? menu.items.filter(item => item.category_id === selectedCategory)
    : menu.items;

  // Default image path
  const defaultImageUrl = '/images/unknown.png';

  return (
    <div className="menu-container">
      <div className="category-tabs mb-4 pb-2 border-b gap-2 flex overflow-x-auto">
        {menu.categories.map(category => (
          <button
            key={category.id}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
              selectedCategory === category.id 
                ? 'border-b-2 bg-blue-500 text-white' 
                : 'text-gray-500 bg-gray-200 hover:bg-gray-300 '
            }`}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="menu-items space-y-4">
        {filteredItems.map(item => (
          <div 
            key={item.id} 
            className="menu-item p-4 border rounded-lg flex gap-4 items-center"
          >
            <div className="item-image">
              <img 
                src={item.image_url || defaultImageUrl} 
                alt={item.name}
                className="w-24 h-24 object-cover rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = defaultImageUrl;
                }}
              />
            </div>
            <div className="item-info flex-1">
              <h3 className="font-medium">{item.name}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
              <p className="text-sm font-semibold mt-1">{item.price.toFixed(2)} ₽</p>
            </div>
            
            {!readOnly && (
              <div className="item-actions flex items-center">
                <button 
                  onClick={() => handleQuantityChange(item.id, -1)}
                  disabled={quantities[item.id] <= 0}
                  className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center disabled:opacity-50"
                >
                  -
                </button>
                <span className="mx-2 w-6 text-center">{quantities[item.id] || 0}</span>
                <button 
                  onClick={() => handleQuantityChange(item.id, 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                >
                  +
                </button>
                <button 
                  onClick={() => handleAddToOrder(item.id)}
                  disabled={!quantities[item.id]}
                  className="ml-4 px-3 py-1 text-sm bg-blue-500 text-white rounded disabled:opacity-50"
                >
                  Добавить
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Menu;
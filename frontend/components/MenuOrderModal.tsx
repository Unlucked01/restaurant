import React, {useState, useEffect} from 'react';
import {menuAPI} from '../lib/api';
import {OrderItem, MenuItem} from '../types/components';
import Menu from './Menu';

interface MenuOrderModalProps {
    reservationId: string;
    onClose: () => void;
    onOrderComplete: () => void;
    onSkip?: () => void;
}

const MenuOrderModal: React.FC<MenuOrderModalProps> = ({
                                                           reservationId,
                                                           onClose,
                                                           onOrderComplete,
                                                           onSkip
                                                       }) => {
    const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
    const [menuItems, setMenuItems] = useState<Record<string, MenuItem>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        // Fetch menu items to get details like name and image
        const fetchMenuItems = async () => {
            try {
                const response = await menuAPI.getMenu();
                const itemsMap: Record<string, MenuItem> = {};
                response.data.items.forEach((item: MenuItem) => {
                    itemsMap[item.id] = item;
                });
                setMenuItems(itemsMap);
            } catch (err) {
                console.error('Failed to fetch menu items:', err);
            }
        };

        fetchMenuItems();
    }, []);

    const handleAddToOrder = (item: OrderItem) => {
        setSelectedItems((prev) => {
            const existingItemIndex = prev.findIndex(i => i.menu_item_id === item.menu_item_id);

            if (existingItemIndex >= 0) {
                // Update existing item quantity
                const updatedItems = [...prev];
                updatedItems[existingItemIndex].quantity += item.quantity;
                return updatedItems;
            } else {
                // Add new item
                return [...prev, item];
            }
        });
    };

    const handleRemoveFromOrder = (menuItemId: string) => {
        setSelectedItems(prev => prev.filter(item => item.menu_item_id !== menuItemId));
    };

    const handleSubmitOrder = async () => {
        if (selectedItems.length === 0) {
            setError('Добавьте хотя бы одно блюдо в заказ');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Process each order item sequentially
            for (const item of selectedItems) {
                await menuAPI.addToOrder(reservationId, item);
            }

            setSuccessMessage('Заказ успешно оформлен!');

            // Clear selected items
            setSelectedItems([]);

            // Wait a moment to show success message, then close
            setTimeout(() => {
                onOrderComplete();
            }, 1500);

        } catch (err) {
            console.error('Failed to submit order:', err);
            setError('Не удалось оформить заказ. Пожалуйста, попробуйте снова.');
        } finally {
            setLoading(false);
        }
    };

    // Default image path
    const defaultImageUrl = '/images/unknown.png';

    // Calculate total price
    const totalPrice = selectedItems.reduce((sum, item) => {
        const menuItem = menuItems[item.menu_item_id];
        if (menuItem) {
            return sum + (menuItem.price * item.quantity);
        }
        return sum;
    }, 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Выберите блюда для заказа</h2>
                    <button
                        onClick={onClose}
                        className="text-black bg-white hover:bg-white hover:text-black"
                    >
                        ✕
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        {successMessage}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <h3 className="font-medium mb-3">Меню</h3>
                        <Menu
                            onAddToOrder={handleAddToOrder}
                            reservationId={reservationId}
                        />
                    </div>

                    <div className="bg-gray-50 p-0 rounded">
                        <h3 className="font-medium mb-3 px-4 pt-2">Ваш заказ</h3>

                        {selectedItems.length === 0 ? (
                            <p className="text-gray-500 italic px-2">Добавьте блюда из меню</p>
                        ) : (
                            <div className="space-y-3 mb-4 px-2">
                                {selectedItems.map(item => {
                                    const menuItem = menuItems[item.menu_item_id];
                                    return (
                                        <div key={item.menu_item_id} className="flex pb-2">
                                            {menuItem && (
                                                <div className='flex justify-between w-full border-b border-gray-200'>
                                                    <div className="mr-2">
                                                        <img
                                                            src={menuItem.image_url || defaultImageUrl}
                                                            alt={menuItem.name}
                                                            className="w-12 h-12 object-cover rounded"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.onerror = null;
                                                                target.src = defaultImageUrl;
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium">{menuItem.name}</div>
                                                        <div className="flex justify-between items-start flex-col">
                                                            <div className="text-xs text-gray-500">
                                                                {item.quantity} × {menuItem.price.toFixed(0)} ₽
                                                            </div>
                                                            <div className="font-medium">
                                                                {(menuItem.price * item.quantity).toFixed(0)} ₽
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveFromOrder(item.menu_item_id)}
                                                        className="text-sm text-gray-400 self-start bg-transparent hover:bg-transparent p-0"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                <div className=" flex justify-between font-semibold">
                                    <span>Итого:</span>
                                    <span>{totalPrice.toFixed(0)} ₽</span>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-4 mt-4 pb-4 px-4">
                            <button
                                onClick={handleSubmitOrder}
                                disabled={loading || selectedItems.length === 0}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
                            >
                                {loading ? 'Оформление...' : 'Оформить заказ'}
                            </button>
                        </div>
                    </div>
                    {onSkip && (
                        <div className='col-span-3 flex items-center justify-end'>
                            <button
                                onClick={onSkip}
                                className="px-4  py-2 bg-gray-200 text-gray-500 hover:bg-gray-400 hover:text-white self-center "
                            >
                                Не сейчас
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MenuOrderModal; 
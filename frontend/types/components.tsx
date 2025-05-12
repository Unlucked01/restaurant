import React from 'react';

export interface BaseComponent {
  type: string;
  title: string;
  scale: string;
}

export interface TableComponent extends BaseComponent {
  maxGuests: number;
  isTable: true;
  width: number;
  height: number;
}

export interface StaticComponent extends BaseComponent {
  isTable: false;
}

export type LayoutComponent = TableComponent | StaticComponent;

export const LAYOUT_COMPONENTS: LayoutComponent[] = [
  {
    type: 'circular',
    title: 'Круглый стол (2)',
    scale: 'scale-75',
    maxGuests: 2,
    isTable: true,
    width: 60,
    height: 60
  },
  {
    type: 'circular-large',
    title: 'Круглый стол с диванами (4)',
    scale: 'scale-75',
    maxGuests: 4,
    isTable: true,
    width: 80,
    height: 80
  },
  {
    type: 'rectangular',
    title: 'Прямоугольный стол (10)',
    scale: 'scale-75',
    maxGuests: 10,
    isTable: true,
    width: 80,
    height: 60
  },
  {
    type: 'vip',
    title: 'ВИП (8)',
    scale: 'scale-75',
    maxGuests: 8,
    isTable: true,
    width: 100,
    height: 80
  },
  {
    type: 'banquet',
    title: 'Банкетный зал (25)',
    scale: 'scale-75',
    maxGuests: 25,
    isTable: true,
    width: 200,
    height: 100
  },
  {
    type: 'bar',
    title: 'Бар',
    scale: 'scale-75',
    isTable: false
  },
  {
    type: 'wc',
    title: 'Туалет',
    scale: 'scale-75',
    isTable: false
  },
  {
    type: 'wardrobe',
    title: 'Гардероб',
    scale: 'scale-75',
    isTable: false
  },
  {
    type: 'kitchen',
    title: 'Кухня',
    scale: 'scale-75',
    isTable: false
  },
  {
    type: 'wall',
    title: 'Стена',
    scale: 'scale-75',
    isTable: false
  }
];

export const renderComponentPreview = (component: LayoutComponent): JSX.Element => {
  switch (component.type) {
    case 'circular':
      return (
        <div className="relative w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-500 rounded" />
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-500 rounded" />
          <span className="text-white font-bold text-sm">2</span>
        </div>
      );
    case 'circular-large':
      return (
        <div className="relative w-24 h-24 rounded-full bg-green-500 flex items-center justify-center">
          <div className="absolute -top-6 w-full h-4 bg-gray-500 rounded-lg" />
          <div className="absolute -bottom-6 w-full h-4 bg-gray-500 rounded-lg" />
          <span className="text-white font-bold text-sm">4</span>
        </div>
      );
    case 'rectangular':
      return (
        <div className="relative w-36 h-16 bg-green-500 rounded flex items-center justify-center">
          {/* Top chairs */}
          {[...Array(4)].map((_, i) => (
            <div
              key={`top-${i}`}
              className="absolute w-4 h-4 bg-gray-500 rounded"
              style={{ top: '-1rem', left: `${(i + 1) * 20}%`, transform: 'translateX(-50%)' }}
            />
          ))}
    
          {/* Bottom chairs */}
          {[...Array(4)].map((_, i) => (
            <div
              key={`bottom-${i}`}
              className="absolute w-4 h-4 bg-gray-500 rounded"
              style={{ bottom: '-1rem', left: `${(i + 1) * 20}%`, transform: 'translateX(-50%)' }}
            />
          ))}
    
          {/* Left chair */}
          <div
            className="absolute w-4 h-4 bg-gray-500 rounded"
            style={{ left: '-1rem', top: '50%', transform: 'translateY(-50%)' }}
          />
    
          {/* Right chair */}
          <div
            className="absolute w-4 h-4 bg-gray-500 rounded"
            style={{ right: '-1rem', top: '50%', transform: 'translateY(-50%)' }}
          />
    
          <span className="text-white font-bold text-sm">10</span>
        </div>
      );
    case 'vip':
      return (
        <div className="w-36 h-36 border-4 border-yellow-500 bg-yellow-100 rounded-lg flex items-center justify-center">
          <span className="text-yellow-800 font-bold text-sm">VIP</span>
        </div>
      );
    case 'banquet':
      return (
        <div className="relative w-36 h-20 border-4 border-purple-500 bg-purple-100 rounded-lg flex items-center justify-center">
          {/* Multiple chairs around */}
          <div className="absolute -top-3 left-1/4 w-3 h-3 bg-gray-500 rounded" />
          <div className="absolute -top-3 left-1/2 w-3 h-3 bg-gray-500 rounded" />
          <div className="absolute -top-3 left-3/4 w-3 h-3 bg-gray-500 rounded" />
          
          <div className="absolute -bottom-3 left-1/4 w-3 h-3 bg-gray-500 rounded" />
          <div className="absolute -bottom-3 left-1/2 w-3 h-3 bg-gray-500 rounded" />
          <div className="absolute -bottom-3 left-3/4 w-3 h-3 bg-gray-500 rounded" />
          
          <div className="absolute -left-3 top-1/3 w-3 h-3 bg-gray-500 rounded" />
          <div className="absolute -left-3 top-2/3 w-3 h-3 bg-gray-500 rounded" />
          
          <div className="absolute -right-3 top-1/3 w-3 h-3 bg-gray-500 rounded" />
          <div className="absolute -right-3 top-2/3 w-3 h-3 bg-gray-500 rounded" />
          
          <div className="text-center">
            <div className="text-sm font-bold text-purple-800">БАНКЕТ</div>
            <div className="text-xs text-purple-800">до 25 гостей</div>
          </div>
        </div>
      );
    case 'bar':
      return (
        <div className="w-24 h-16 bg-red-100 border-l-4 border-red-600 flex items-center justify-center">
          <span className="text-red-700 font-semibold text-xs">Бар</span>
        </div>
      );
    case 'wc':
      return (
        <div className="w-20 h-20 bg-blue-100 border-2 border-blue-500 rounded flex items-center justify-center">
          <span className="text-blue-700 text-xs">WC</span>
        </div>
      );
    case 'wardrobe':
      return (
        <div className="w-20 h-20 bg-purple-100 border-2 border-purple-500 rounded flex items-center justify-center">
          <span className="text-purple-700 text-xs">Гардероб</span>
        </div>
      );
    case 'kitchen':
      return (
        <div className="w-24 h-16 bg-amber-100 border-2 border-amber-600 flex flex-col items-center justify-center">
          <div className="text-amber-800 font-bold text-xs">Кухня</div>
          <div className="text-xs text-center text-amber-600">служебная зона</div>
        </div>
      );
    case 'wall':
      return (
        <div className="w-32 h-6 bg-gray-800 rounded-sm flex items-center justify-center">
          <span className="text-gray-100 text-xs">Стена</span>
        </div>
      );
    default:
      return (
        <div className="w-20 h-20 bg-gray-300 flex items-center justify-center">
          <span className="text-gray-700 text-xs">{component.title}</span>
        </div>
      );
  }
};

// Menu related types
export interface Category {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url?: string;
}

export interface MenuItemWithCategory extends MenuItem {
  category: Category;
}

export interface OrderItem {
  menu_item_id: string;
  quantity: number;
}

export interface Menu {
  categories: Category[];
  items: MenuItem[];
} 
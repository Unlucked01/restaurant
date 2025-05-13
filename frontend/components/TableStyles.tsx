import React from 'react';

// Common table rendering functions for consistent style across the application
export interface TableRenderProps {
  type_name: string;
  table_number: number;
  maxGuests: number;
  isReserved?: boolean;
  isSelected?: boolean;
  isAdmin?: boolean;
}

// Helper function to get the correct word form for guest based on count
const getGuestsWord = (count: number): string => {
  if (count === 1) return 'место';
  if (count >= 2 && count <= 4) return 'места';
  return 'мест';
};

// Helper function for "гость" word forms
const getGuestWord = (count: number): string => {
  if (count === 1) return 'гость';
  if (count >= 2 && count <= 4) return 'гостя';
  return 'гостей';
};

// Shared rendering functions for different table types
export const renderCircularTable = (props: TableRenderProps) => {
  const { table_number, maxGuests, isReserved = false, isSelected = false, isAdmin = false } = props;
  const displayText = `${table_number}`;
  
  const available = !isReserved;
  const baseClasses = isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-md';
  const tableColor = available ? 'bg-green-500' : 'bg-red-400';
  const textColor = available ? 'text-white' : 'text-white';
  
  return (
    <div className={`relative w-full h-full rounded-full ${tableColor} flex items-center justify-center ${baseClasses}`}>
      {/* Стулья вокруг стола */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-500 rounded"></div>
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-500 rounded"></div>
      
      <div className="text-center">
        <div className={`text-xs font-medium ${textColor}`}>{displayText}</div>
        <div className={`text-xs ${textColor}`}>{maxGuests} {getGuestsWord(maxGuests)}</div>
      </div>
    </div>
  );
};

export const renderCircularLargeTable = (props: TableRenderProps) => {
  const { table_number, maxGuests, isReserved = false, isSelected = false, isAdmin = false } = props;
  const displayText = `${table_number}`;
  
  const available = !isReserved;
  const baseClasses = isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-md';
  const tableColor = available ? 'bg-green-500' : 'bg-red-400';
  const textColor = available ? 'text-white' : 'text-white';
  
  return (
    <div className={`relative w-full h-full rounded-full ${tableColor} flex items-center justify-center ${baseClasses}`}>
      {/* Большие диваны сверху и снизу */}
      <div className="absolute -top-6 w-full h-4 bg-gray-500 rounded-lg"></div>
      <div className="absolute -bottom-6 w-full h-4 bg-gray-500 rounded-lg"></div>
      
      <div className="text-center">
        <div className={`text-xs font-medium ${textColor}`}>{displayText}</div>
        <div className={`text-xs ${textColor}`}>{maxGuests} {getGuestsWord(maxGuests)}</div>
      </div>
    </div>
  );
};

export const renderRectangularTable = (props: TableRenderProps) => {
  const { table_number, maxGuests, isReserved = false, isSelected = false, isAdmin = false } = props;
  const displayText = `${table_number}`;
  
  const available = !isReserved;
  const baseClasses = isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-md';
  const tableColor = available ? 'bg-green-500' : 'bg-red-400';
  const textColor = available ? 'text-white' : 'text-white';
  
  return (
    <div className={`relative w-full h-full ${tableColor} rounded flex items-center justify-center ${baseClasses}`}>
      {/* Стулья сверху */}
      {[...Array(4)].map((_, i) => (
        <div
          key={`top-${i}`}
          className="absolute w-4 h-4 bg-gray-500 rounded"
          style={{ top: '-1rem', left: `${(i + 1) * 20}%`, transform: 'translateX(-50%)' }}
        />
      ))}

      {/* Стулья снизу */}
      {[...Array(4)].map((_, i) => (
        <div
          key={`bottom-${i}`}
          className="absolute w-4 h-4 bg-gray-500 rounded"
          style={{ bottom: '-1rem', left: `${(i + 1) * 20}%`, transform: 'translateX(-50%)' }}
        />
      ))}

      {/* Стул слева */}
      <div
        className="absolute w-4 h-4 bg-gray-500 rounded"
        style={{ left: '-1rem', top: '50%', transform: 'translateY(-50%)' }}
      />

      {/* Стул справа */}
      <div
        className="absolute w-4 h-4 bg-gray-500 rounded"
        style={{ right: '-1rem', top: '50%', transform: 'translateY(-50%)' }}
      />

      <div className="text-center">
        <div className={`text-xs font-medium ${textColor}`}>{displayText}</div>
        <div className={`text-xs ${textColor}`}>{maxGuests} {getGuestsWord(maxGuests)}</div>
      </div>
    </div>
  );
};

export const renderVipTable = (props: TableRenderProps) => {
  const { table_number, maxGuests, isReserved = false, isSelected = false, isAdmin = false } = props;
  const displayText = `${table_number}`;
  
  const available = !isReserved;
  const baseClasses = isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-md';
  
  return (
    <div className={`w-full h-full border-4 ${available ? 'border-yellow-500 bg-yellow-100' : 'border-red-500 bg-red-100'} rounded-lg flex items-center justify-center ${baseClasses}`}>
      <div className="text-center">
        <div className={`text-md font-bold ${available ? 'text-yellow-800' : 'text-red-800'}`}>VIP</div>
        <div className={`text-xs ${available ? 'text-yellow-800' : 'text-red-800'}`}>{maxGuests} {getGuestWord(maxGuests)}</div>
      </div>
    </div>
  );
};

export const renderBanquetTable = (props: TableRenderProps) => {
  const { table_number, maxGuests, isReserved = false, isSelected = false, isAdmin = false } = props;
  const displayText = `${table_number}`;
  
  const available = !isReserved;
  const baseClasses = isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-md';
  
  return (
    <div className={`border-4 ${available ? 'border-purple-500 bg-purple-100' : 'border-red-500 bg-red-100'} rounded-lg flex items-center justify-center ${baseClasses}`} style={{ width: '100%', height: '100%' }}>
      {/* Multiple chairs on all sides */}
      <div className="absolute top-0 left-0 w-full">
        {[...Array(6)].map((_, i) => (
          <div
            key={`top-${i}`}
            className="absolute w-4 h-4 bg-gray-500 rounded"
            style={{ top: '-1rem', left: `${(i + 1) * 14}%`, transform: 'translateX(-50%)' }}
          />
        ))}
      </div>
      
      <div className="absolute bottom-0 left-0 w-full">
        {[...Array(6)].map((_, i) => (
          <div
            key={`bottom-${i}`}
            className="absolute w-4 h-4 bg-gray-500 rounded"
            style={{ bottom: '-1rem', left: `${(i + 1) * 14}%`, transform: 'translateX(-50%)' }}
          />
        ))}
      </div>
      
      <div className="absolute left-0 top-0 h-full">
        {[...Array(4)].map((_, i) => (
          <div
            key={`left-${i}`}
            className="absolute w-4 h-4 bg-gray-500 rounded"
            style={{ left: '-1rem', top: `${(i + 1) * 20}%`, transform: 'translateY(-50%)' }}
          />
        ))}
      </div>
      
      <div className="absolute right-0 top-0 h-full">
        {[...Array(4)].map((_, i) => (
          <div
            key={`right-${i}`}
            className="absolute w-4 h-4 bg-gray-500 rounded"
            style={{ right: '-1rem', top: `${(i + 1) * 20}%`, transform: 'translateY(-50%)' }}
          />
        ))}
      </div>
      
      <div className="text-center">
        <div className={`text-md font-bold ${available ? 'text-purple-800' : 'text-red-800'}`}>БАНКЕТ</div>
        <div className={`text-xs ${available ? 'text-purple-800' : 'text-red-800'}`}>до {maxGuests} {getGuestWord(maxGuests)}</div>
      </div>
    </div>
  );
};

export const renderDefaultTable = (props: TableRenderProps) => {
  const { table_number, maxGuests, isReserved = false, isSelected = false, isAdmin = false } = props;
  const displayText = `${table_number}`;
  
  const available = !isReserved;
  const baseClasses = isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-md';
  const tableColor = available ? 'bg-green-500' : 'bg-red-400';
  const textColor = available ? 'text-white' : 'text-white';
  
  return (
    <div className={`${tableColor} rounded flex items-center justify-center ${baseClasses}`} style={{ width: '100%', height: '100%' }}>
      <div className="text-center">
        <div className={`text-xs ${textColor}`}>{maxGuests} {getGuestsWord(maxGuests)}</div>
      </div>
    </div>
  );
};

// Main rendering function that selects appropriate table type
export const renderTableByType = (props: TableRenderProps) => {
  // Проверяем наличие и тип параметра type_name
  if (!props || !props.type_name || typeof props.type_name !== 'string') {
    return renderDefaultTable({
      type_name: 'default',
      table_number: props?.table_number || 0,
      maxGuests: props?.maxGuests || 2,
      isReserved: props?.isReserved || false,
      isSelected: props?.isSelected || false
    });
  }
  
  const { type_name } = props;
  const tableType = type_name.toLowerCase();
  
  switch (tableType) {
    case 'circular':
      return renderCircularTable(props);
    case 'circular-large':
      return renderCircularLargeTable(props);
    case 'rectangular':
      return renderRectangularTable(props);
    case 'vip':
      return renderVipTable(props);
    case 'banquet':
      return renderBanquetTable(props);
    default:
      return renderDefaultTable(props);
  }
};

// Компонент для предпросмотра элементов в админ-панели
export const renderPreviewComponent = (component: any): JSX.Element => {
  switch (component.type) {
    case 'circular':
      return (
        <div className="relative w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-500 rounded" />
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-500 rounded" />
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-500 rounded" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-500 rounded" />
          <span className="text-white font-bold text-sm">{component.maxGuests} {getGuestsWord(component.maxGuests)}</span>
        </div>
      );
      
    case 'circular-large':
      return (
        <div className="relative w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
          <div className="absolute -top-4 w-full h-3 bg-gray-700 rounded-lg" />
          <div className="absolute -bottom-4 w-full h-3 bg-gray-700 rounded-lg" />
          <span className="text-white font-bold text-sm">{component.maxGuests} {getGuestsWord(component.maxGuests)}</span>
        </div>
      );
      
    case 'rectangular':
      return (
        <div className="relative w-24 h-12 bg-green-500 rounded flex items-center justify-center">
          {/* Стулья сверху и снизу */}
          {[...Array(3)].map((_, i) => (
            <React.Fragment key={i}>
              <div
                className="absolute w-3 h-3 bg-gray-500 rounded"
                style={{ top: '-0.75rem', left: `${(i + 1) * 25}%`, transform: 'translateX(-50%)' }}
              />
              <div
                className="absolute w-3 h-3 bg-gray-500 rounded"
                style={{ bottom: '-0.75rem', left: `${(i + 1) * 25}%`, transform: 'translateX(-50%)' }}
              />
            </React.Fragment>
          ))}
          
          {/* Стулья слева и справа */}
          <div
            className="absolute w-3 h-3 bg-gray-500 rounded"
            style={{ left: '-0.75rem', top: '50%', transform: 'translateY(-50%)' }}
          />
          <div
            className="absolute w-3 h-3 bg-gray-500 rounded"
            style={{ right: '-0.75rem', top: '50%', transform: 'translateY(-50%)' }}
          />
          
          <span className="text-white font-bold text-sm">{component.maxGuests} {getGuestsWord(component.maxGuests)}</span>
        </div>
      );
      
    case 'vip':
      return (
        <div className="w-24 h-24 border-3 border-yellow-500 bg-yellow-100 rounded-lg flex items-center justify-center">
          <span className="text-yellow-800 font-bold text-sm">VIP</span>
        </div>
      );
      
    case 'bar':
      return (
        <div className="w-full h-full bg-red-100 border-l-4 border-red-600 flex items-center justify-center">
          <span className="text-red-700 font-semibold text-xs">Бар</span>
        </div>
      );
      
    case 'bathroom':
    case 'wc':
      return (
        <div className="w-16 h-16 bg-blue-100 border-2 border-blue-500 rounded flex items-center justify-center">
          <span className="text-blue-700 text-xs">WC</span>
        </div>
      );
      
    case 'kitchen':
      return (
        <div className="w-24 h-16 bg-red-100 border-2 border-red-600 flex flex-col items-center justify-center">
          <div className="text-red-800 font-bold text-sm">Кухня</div>
          <div className="text-xs text-red-500">служебная зона</div>
        </div>
      );
      
    case 'wardrobe':
      return (
        <div className="w-16 h-16 bg-purple-100 border-2 border-purple-500 rounded flex items-center justify-center">
          <span className="text-purple-700 text-xs">Гардероб</span>
        </div>
      );
      
    default:
      return (
        <div className="w-16 h-16 bg-gray-300 flex items-center justify-center">
          <span className="text-gray-700 text-xs">{component.title || component.label || component.type}</span>
        </div>
      );
  }
};

// Функция получения отображаемого имени типа стола
export const getDisplayTypeName = (type_name: string): string => {
  if (!type_name || typeof type_name !== 'string') {
    return 'Стол';
  }
  
  switch (type_name.toLowerCase()) {
    case 'circular': return 'Круглый';
    case 'circular-large': return 'Круглый большой';
    case 'rectangular': return 'Прямоугольный';
    case 'vip': return 'VIP';
    default: return type_name;
  }
};

// Function to properly render static items (not tables)
export const renderStaticItem = (type: string): JSX.Element => {
  switch (type.toLowerCase()) {
    case 'kitchen':
      return (
        <div className="w-full h-full bg-amber-100 border-2 border-amber-600 flex flex-col items-center justify-center">
          <div className="text-amber-800 font-bold text-xs">Кухня</div>
          <div className="text-xs text-center text-amber-600">служебная зона</div>
        </div>
      );
      
    case 'bathroom':
    case 'wc':
      return (
        <div className="w-full h-full bg-blue-100 border-2 border-blue-500 rounded flex items-center justify-center">
          <span className="text-blue-700 font-bold text-xs">WC</span>
        </div>
      );
      
    case 'bar':
      return (
        <div className="w-full h-full bg-red-100 border-l-4 border-red-600 flex items-center justify-center">
          <span className="text-red-700 font-semibold text-xs">Бар</span>
        </div>
      );
      
    case 'wardrobe':
      return (
        <div className="w-full h-full bg-purple-100 border-2 border-purple-500 rounded flex items-center justify-center">
          <span className="text-purple-700 font-bold text-xs">Гардероб</span>
        </div>
      );
      
    case 'window':
      return (
        <div className="w-full h-full border border-gray-300 rounded flex items-center justify-center">
          <div className="grid grid-cols-2 gap-1 w-full h-full p-1">
            <div className="border border-gray-400 bg-blue-50 opacity-70"></div>
            <div className="border border-gray-400 bg-blue-50 opacity-70"></div>
            <div className="border border-gray-400 bg-blue-50 opacity-70"></div>
            <div className="border border-gray-400 bg-blue-50 opacity-70"></div>
          </div>
        </div>
      );
      
    default:
      return (
        <div className="w-full h-full bg-gray-100 border border-gray-300 flex items-center justify-center">
          <span className="text-gray-700 text-xs">{type}</span>
        </div>
      );
  }
}; 
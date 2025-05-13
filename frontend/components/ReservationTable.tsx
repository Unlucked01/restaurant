import React, { useEffect } from 'react';
import { renderTableByType } from './TableStyles';

interface TableProps {
  id: string;
  type_id: number;
  type_name: string;
  table_number: number;
  maxGuests: number;
  x: number;
  y: number;
  rotation: number;
  width?: number;
  height?: number;
  isReserved: boolean;
  onClick?: (id: string, maxGuests: number) => void;
  scale?: number;
}

const ReservationTable: React.FC<TableProps> = ({
  id,
  type_id,
  type_name,
  table_number,
  maxGuests,
  x,
  y,
  rotation,
  width: propWidth,
  height: propHeight,
  isReserved,
  onClick,
  scale = 1,
}) => {
  // Debug log to check values
  useEffect(() => {
    console.log(`Table ${id} (${table_number}): x=${x}, y=${y}, rotation=${rotation}, type=${type_name}, isReserved=${isReserved}`);
  }, [id, table_number, x, y, rotation, type_name, isReserved]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      if (isReserved) {
        console.log(`Attempted click on reserved table ${id} (${table_number})`);
      } else {
        onClick(id, maxGuests);
      }
    }
  };

  // Get table dimensions
  const getTableDimensions = () => {
    if (propWidth && propHeight) {
      return { width: propWidth, height: propHeight };
    }
    
    // Default dimensions based on table type
    const tableType = type_name && typeof type_name === 'string'
      ? type_name.toLowerCase()
      : '';
      
    switch (tableType) {
      case 'circular':
        return { width: 64, height: 64 };
      case 'circular-large':
        return { width: 80, height: 80 };
      case 'rectangular':
        return { width: 144, height: 64 };
      case 'vip':
        return { width: 192, height: 192 };
      case 'banquet':
        return { width: 200, height: 100 };
      default:
        return { width: 64, height: 64 };
    }
  };

  const { width, height } = getTableDimensions();
  
  // Логируем итоговые значения размеров
  console.log(`Table ${id}: final dimensions - width=${width}, height=${height}`);

  // Координаты стола для масштабирования
  // Позиционирование как в админке: стол размещается верхним левым углом в точке (x,y)
  // и центрируется с помощью transformOrigin
  const scaledX = x * scale;
  const scaledY = y * scale;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${scaledX}px`,
        top: `${scaledY}px`,
        width: `${width * scale}px`,
        height: `${height * scale}px`,
        transform: `rotate(${rotation || 0}deg)`,
        transformOrigin: 'center',
        cursor: isReserved ? 'not-allowed' : 'pointer',
        zIndex: 10,
      }}
      onClick={handleClick}
      className={isReserved ? 'reservation-reserved' : 'reservation-available'}
    >
      <div style={{ width: '100%', height: '100%' }}>
        {renderTableByType({
          type_name,
          table_number,
          maxGuests,
          isReserved
        })}
      </div>
    </div>
  );
};

export default ReservationTable; 
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
  // Debug log to check isReserved value
  useEffect(() => {
    if (isReserved) {
      console.log(`Table ${id} (${table_number}) is reserved:`, isReserved);
    }
  }, [id, table_number, isReserved]);

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

  // Determine table dimensions based on type
  const getTableDimensions = () => {
    // Use props width/height if provided
    if (propWidth && propHeight) {
      return { width: propWidth, height: propHeight };
    }
    
    // Set dimensions based on table type
    const tableType = type_name.toLowerCase();
    
    switch (tableType) {
      case 'circular':
      case 'circular-large':
        // Make circular tables square (equal width and height)
        return { width: 50, height: 50 };
      case 'rectangular':
        // Make rectangular tables wider than tall
        return { width: 80, height: 40 };
      case 'vip':
        return { width: 100, height: 100 };
      case 'banquet':
        return { width: 150, height: 70 };
      default:
        return { width: 50, height: 50 };
    }
  };

  const { width, height } = getTableDimensions();

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x * scale}px`,
        top: `${y * scale}px`,
        width: `${width * scale}px`,
        height: `${height * scale}px`,
        transform: `scale(${scale}) rotate(${rotation || 0}deg)`,
        transformOrigin: 'top left',
        cursor: isReserved ? 'not-allowed' : 'pointer',
        zIndex: 10,
      }}
      onClick={handleClick}
      className={isReserved ? 'reservation-reserved' : 'reservation-available'}
    >
      {renderTableByType({
        type_name,
        table_number,
        maxGuests,
        isReserved
      })}
    </div>
  );
};

export default ReservationTable; 
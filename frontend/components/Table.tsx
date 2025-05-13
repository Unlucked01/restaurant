import React from 'react';
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
  available: boolean;
  onClick?: (id: string) => void;
  isEditing?: boolean;
  isSelected?: boolean;
  scale?: number;
  width?: number;
  height?: number;
}

const Table: React.FC<TableProps> = ({
  id,
  type_id,
  type_name,
  table_number,
  maxGuests,
  x,
  y,
  rotation,
  available,
  onClick,
  isEditing = false,
  isSelected = false,
  scale = 1,
  width: propWidth,
  height: propHeight,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick && (available || isEditing)) {
      onClick(id);
    }
  };

  // Функция определения размеров стола
  const getTableDimensions = () => {
    // Use props width/height if provided
    if (propWidth && propHeight) {
      return { width: `${propWidth}px`, height: `${propHeight}px` };
    }
    
    // Проверяем, что type_name определен
    const tableType = type_name && typeof type_name === 'string' 
      ? type_name.toLowerCase() 
      : '';
      
    switch (tableType) {
      case 'circular':
        return { width: '64px', height: '64px' };
      case 'circular-large':
        return { width: '80px', height: '80px' };
      case 'rectangular':
        return { width: '144px', height: '64px' };
      case 'vip':
        return { width: '192px', height: '192px' };
      case 'banquet':
        return { width: '200px', height: '100px' };
      default:
        return { width: '64px', height: '64px' };
    }
  };

  const { width, height } = getTableDimensions();

  return (
    <div
      style={{
        position: 'absolute',
        left: `${(x - (parseInt(width) / 2) / scale) * scale}px`,
        top: `${(y - (parseInt(height) / 2) / scale) * scale}px`,
        width: width,
        height: height,
        transform: `scale(${scale}) rotate(${rotation}deg)`,
        transformOrigin: 'center',
        cursor: available || isEditing ? 'move' : 'not-allowed',
        zIndex: isSelected ? 20 : 10,
      }}
      onClick={handleClick}
    >
      {renderTableByType({
        type_name,
        table_number,
        maxGuests,
        isReserved: !available,
        isSelected
      })}
    </div>
  );
};

export default Table; 
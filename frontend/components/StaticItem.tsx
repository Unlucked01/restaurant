import React from 'react';
import { renderStaticItem } from './TableStyles';

interface StaticItemProps {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation: number;
  scale?: number;
}

const StaticItem: React.FC<StaticItemProps> = ({
  id,
  type,
  x,
  y,
  width,
  height,
  rotation,
  scale = 1,
}) => {
  // Set default dimensions based on type
  const getDefaultSize = (type: string) => {
    switch (type.toLowerCase()) {
      case 'bar':
        return { width: 120, height: 50 };
      case 'bathroom':
      case 'wc':
        return { width: 80, height: 80 };
      case 'kitchen':
        return { width: 120, height: 80 };
      case 'wardrobe':
        return { width: 80, height: 80 };
      case 'window':
        return { width: 100, height: 50 };
      default:
        return { width: 80, height: 80 };
    }
  };
  
  const defaultSize = getDefaultSize(type);
  const finalWidth = width || defaultSize.width;
  const finalHeight = height || defaultSize.height;
  
  // Координаты с учетом масштаба
  const scaledX = x * scale;
  const scaledY = y * scale;
  
  return (
    <div
      style={{
        position: 'absolute',
        left: `${scaledX}px`,
        top: `${scaledY}px`,
        width: `${finalWidth * scale}px`,
        height: `${finalHeight * scale}px`,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center',
        zIndex: 5,
      }}
      className="shadow-md"
    >
      {renderStaticItem(type)}
    </div>
  );
};

export default StaticItem; 
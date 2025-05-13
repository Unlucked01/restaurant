import React from 'react';

interface WallProps {
  id: string;
  x: number;
  y: number;
  rotation: number;
  length: number;
  width?: number;
  scale?: number;
}

const ReservationWall: React.FC<WallProps> = ({
  id,
  x,
  y,
  rotation,
  length,
  width = 8,
  scale = 1,
}) => {
  // Debug log для отладки
  console.log(`Wall ${id}: x=${x}, y=${y}, rotation=${rotation}, length=${length}`);
  
  // Координаты с учетом масштаба
  const scaledX = x * scale;
  const scaledY = y * scale;
  const scaledLength = length * scale;
  
  return (
    <div
      style={{
        position: 'absolute',
        left: `${scaledX}px`,
        top: `${scaledY}px`,
        width: `${scaledLength}px`,
        height: `${width}px`,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'top left',
        zIndex: 5,
      }}
      className="bg-gray-800 rounded-sm shadow-md"
    />
  );
};

export default ReservationWall; 
import React, { useState } from 'react';

interface WallProps {
  id: string;
  x: number;
  y: number;
  rotation: number;
  length: number;
  onClick?: (id: string) => void;
  isEditing?: boolean;
  isSelected?: boolean;
  scale?: number;
}

const Wall: React.FC<WallProps> = ({
  id,
  x,
  y,
  rotation,
  length,
  onClick,
  isEditing = false,
  isSelected = false,
  scale = 1,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(id);
    }
  };

  const baseClasses = isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-md';
  
  // Adjust position based on wall orientation to ensure proper centering
  let adjustedX = x;
  let adjustedY = y;
  
  // For vertical walls (90° or -90°)
  if (Math.abs(Math.abs(rotation) - 90) < 0.5) {
    adjustedX = x - 4; // Half of wall thickness to center it on the point
  }
  // For horizontal walls (0° or 180°)
  else if (Math.abs(rotation) < 0.5 || Math.abs(Math.abs(rotation) - 180) < 0.5) {
    adjustedY = y - 4; // Half of wall thickness to center it on the point
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: `${adjustedX * scale}px`,
        top: `${adjustedY * scale}px`,
        transform: `scale(${scale}) rotate(${rotation}deg)`,
        transformOrigin: 'top left',
        width: `${length}px`,
        height: '8px',
        cursor: isEditing ? 'move' : 'pointer',
        zIndex: isSelected ? 20 : 10,
      }}
      onClick={handleClick}
      className={`${baseClasses} bg-gray-800 rounded-sm`}
    />
  );
};

export default Wall; 
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
  // Adjust position based on wall orientation to ensure proper centering
  let adjustedX = x;
  let adjustedY = y;
  
  // For vertical walls (90° or -90°)
  if (Math.abs(Math.abs(rotation) - 90) < 0.5) {
    adjustedX = x - width / 2; // Half of wall thickness to center it on the point
  }
  // For horizontal walls (0° or 180°)
  else if (Math.abs(rotation) < 0.5 || Math.abs(Math.abs(rotation) - 180) < 0.5) {
    adjustedY = y - width / 2; // Half of wall thickness to center it on the point
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
        height: `${width}px`,
        zIndex: 5,
      }}
      className="bg-gray-800 rounded-sm shadow-md"
    />
  );
};

export default ReservationWall; 
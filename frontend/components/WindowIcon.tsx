import React from 'react';

interface WindowIconProps {
  x: number;
  y: number;
  rotation?: number;
  width?: number;
  height?: number;
}

const WindowIcon: React.FC<WindowIconProps> = ({
  x,
  y,
  rotation = 0,
  width = 100,
  height = 50
}) => {
  const style = {
    position: 'absolute' as 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
    transform: `rotate(${rotation}deg)`,
  };

  return (
    <div
      style={style}
      className="border border-gray-300 rounded flex items-center justify-center"
    >
      <div className="grid grid-cols-2 gap-1 w-full h-full p-1">
        <div className="border border-gray-400 bg-blue-50 opacity-70"></div>
        <div className="border border-gray-400 bg-blue-50 opacity-70"></div>
        <div className="border border-gray-400 bg-blue-50 opacity-70"></div>
        <div className="border border-gray-400 bg-blue-50 opacity-70"></div>
      </div>
    </div>
  );
};

export default WindowIcon; 
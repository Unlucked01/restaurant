import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DndContext, useSensor, useSensors, PointerSensor, DragEndEvent, DragStartEvent, useDraggable } from '@dnd-kit/core';
import { layoutAPI } from '../lib/api';
import Table from './Table';
import Wall from './Wall';
import StaticItem from './StaticItem';
import { LAYOUT_COMPONENTS, renderComponentPreview, LayoutComponent, TableComponent } from '../types/components';
import { renderTableByType, renderStaticItem } from './TableStyles';

interface TableItem {
  id: string;
  type_id: number; // ID типа стола (1-4)
  type: string;    // Название типа ('circular', 'vip', и т.д.)
  type_name: string; // То же, что и type, для внутреннего использования
  table_number: number; // Порядковый номер стола
  max_guests: number;
  x: number;
  y: number;
  rotation: number;
  width?: number;
  height?: number;
}

interface StaticItem {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation: number;
  width?: number;
  height?: number;
}

interface WallItem {
  id: string;
  x: number;
  y: number;
  rotation: number;
  length: number;
}

// Simple draggable component
function Draggable({id, children}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id
  });
  
  // Only apply transform during active dragging
  const style = isDragging ? {
    transform: `translate3d(${transform?.x || 0}px, ${transform?.y || 0}px, 0)`,
    zIndex: 1000,
    opacity: 0.8,
    position: 'absolute' as const,
    touchAction: 'none' as const
  } : {
    position: 'absolute' as const,
    touchAction: 'none' as const
  };

  return (
    <div 
      id={id}
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      data-dragging={isDragging ? "true" : "false"}
    >
      {children}
    </div>
  );
}

const LayoutEditor: React.FC = () => {
  const [tables, setTables] = useState<TableItem[]>([]);
  const [staticItems, setStaticItems] = useState<StaticItem[]>([]);
  const [walls, setWalls] = useState<WallItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isDrawingWall, setIsDrawingWall] = useState(false);
  const [wallStartPoint, setWallStartPoint] = useState<{x: number, y: number} | null>(null);
  const [currentWallEndPoint, setCurrentWallEndPoint] = useState<{x: number, y: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateCounter, setUpdateCounter] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    fetchLayout();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (editorRef.current) {
        const containerWidth = editorRef.current.clientWidth;
        // Set scale based on container width
        const newScale = Math.min(1, (containerWidth - 40) / 800);
        setScale(newScale);
      }
    };

    // Initial scale
    handleResize();

    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const fetchLayout = async () => {
    try {
      setLoading(true);
      const response = await layoutAPI.getLayout();
      
      // Map type_id to proper type_name strings
      const mapTypeIdToName = (typeId) => {
        switch (typeId) {
          case 1: return 'circular';
          case 2: return 'circular-large';
          case 3: return 'rectangular';
          case 4: return 'vip';
          case 5: return 'banquet';
          default: return 'circular'; // Default to circular
        }
      };
      
      // Ensure tables have proper type_name based on type_id
      const tablesWithTypeName = (response.data.tables || []).map(table => ({
        ...table,
        type_name: table.type || mapTypeIdToName(table.type_id) // Use type if available, otherwise map from type_id
      }));
      
      console.log('Fetched tables with type_name:', tablesWithTypeName);
      
      setTables(tablesWithTypeName);
      setStaticItems(response.data.static_items || []);
      setWalls(response.data.walls || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch layout:', err);
      setError('Не удалось загрузить план зала');
    } finally {
      setLoading(false);
    }
  };

  const forceUpdate = useCallback(() => {
    setUpdateCounter(prev => prev + 1);
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const dragId = active.id.toString();
    
    // Extract the item type and ID - correctly handle UUID format
    let type, itemId;
    if (dragId.startsWith('table-')) {
      type = 'table';
      itemId = dragId.substring(6); // Remove 'table-' prefix to get the full ID
    } else if (dragId.startsWith('static-')) {
      type = 'static';
      itemId = dragId.substring(7); // Remove 'static-' prefix to get the full ID
    } else if (dragId.startsWith('wall-')) {
      type = 'wall';
      itemId = dragId.substring(5); // Remove 'wall-' prefix
    } else {
      console.error('Unknown item type in ID:', dragId);
      return;
    }
    
    // Round delta values to snap to grid
    const roundedDeltaX = Math.round(delta.x / 5) * 5;
    const roundedDeltaY = Math.round(delta.y / 5) * 5;
    
    console.log("Drag end:", { dragId, type, itemId, roundedDeltaX, roundedDeltaY });
    
    // Create completely new arrays to ensure React detects the change
    if (type === 'table') {
      const updatedTables = [...tables];
      const tableIndex = updatedTables.findIndex(t => t.id === itemId);
      
      if (tableIndex >= 0) {
        const oldX = updatedTables[tableIndex].x;
        const oldY = updatedTables[tableIndex].y;
        const newX = oldX + roundedDeltaX;
        const newY = oldY + roundedDeltaY;
        
        console.log(`Updating table ${itemId} position from (${oldX},${oldY}) to (${newX},${newY})`);
        
        updatedTables[tableIndex] = {
          ...updatedTables[tableIndex],
          x: newX,
          y: newY
        };
        
        setTables(updatedTables);
        
        // Update selected item if needed
        if (selectedItem && selectedItem.itemType === 'table' && selectedItem.id === itemId) {
          setSelectedItem({
            ...selectedItem,
            x: newX,
            y: newY
          });
        }
      } else {
        console.error(`Table with ID ${itemId} not found`);
      }
    } else if (type === 'static') {
      const updatedItems = [...staticItems];
      const itemIndex = updatedItems.findIndex(i => i.id === itemId);
      
      if (itemIndex >= 0) {
        const oldX = updatedItems[itemIndex].x;
        const oldY = updatedItems[itemIndex].y;
        const newX = oldX + roundedDeltaX;
        const newY = oldY + roundedDeltaY;
        
        console.log(`Updating static item ${itemId} position from (${oldX},${oldY}) to (${newX},${newY})`);
        
        // Create a new object to ensure React detects the change
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          x: newX,
          y: newY
        };
        
        // Set the state with the new array
        setStaticItems(updatedItems);
        
        // Update selected item if needed
        if (selectedItem && selectedItem.itemType === 'static' && selectedItem.id === itemId) {
          setSelectedItem({
            ...selectedItem,
            x: newX,
            y: newY
          });
        }
      } else {
        console.error(`Static item with ID ${itemId} not found`);
      }
    } else if (type === 'wall') {
      const updatedWalls = [...walls];
      const wallIndex = updatedWalls.findIndex(w => w.id === itemId);
      
      if (wallIndex >= 0) {
        const oldX = updatedWalls[wallIndex].x;
        const oldY = updatedWalls[wallIndex].y;
        const newX = oldX + roundedDeltaX;
        const newY = oldY + roundedDeltaY;
        
        // Create a new object to ensure React detects the change
        updatedWalls[wallIndex] = {
          ...updatedWalls[wallIndex],
          x: newX,
          y: newY
        };
        
        // Set the state with the new array
        setWalls(updatedWalls);
        
        // Update selected item if needed
        if (selectedItem && selectedItem.itemType === 'wall' && selectedItem.id === itemId) {
          setSelectedItem({
            ...selectedItem,
            x: newX,
            y: newY
          });
        }
      } else {
        console.error(`Wall with ID ${itemId} not found`);
      }
    }
    
    // Force update after a small delay to ensure state is updated
    setTimeout(forceUpdate, 50);
  };

  const handleItemClick = (id: string) => {
    // Find the clicked item
    const table = tables.find((t) => t.id === id);
    if (table) {
      setSelectedItem({ ...table, itemType: 'table' });
      return;
    }

    const staticItem = staticItems.find((item) => item.id === id);
    if (staticItem) {
      setSelectedItem({ ...staticItem, itemType: 'static' });
      return;
    }
    
    const wall = walls.find((w) => w.id === id);
    if (wall) {
      setSelectedItem({ ...wall, itemType: 'wall' });
      return;
    }

    // If clicked on empty space, deselect
    if (!table && !staticItem && !wall) {
      setSelectedItem(null);
    }
  };

  const rotateItem = () => {
    if (!selectedItem) return;

    if (selectedItem.itemType === 'table') {
      const updatedTables = tables.map((table) => {
        if (table.id === selectedItem.id) {
          return {
            ...table,
            rotation: (table.rotation + 90) % 360,
          };
        }
        return table;
      });
      setTables(updatedTables);
      setSelectedItem({ ...selectedItem, rotation: (selectedItem.rotation + 90) % 360 });
    } else if (selectedItem.itemType === 'static') {
      const updatedItems = staticItems.map((item) => {
        if (item.id === selectedItem.id) {
          return {
            ...item,
            rotation: (item.rotation + 90) % 360,
          };
        }
        return item;
      });
      setStaticItems(updatedItems);
      setSelectedItem({ ...selectedItem, rotation: (selectedItem.rotation + 90) % 360 });
    } else if (selectedItem.itemType === 'wall') {
      const updatedWalls = walls.map((wall) => {
        if (wall.id === selectedItem.id) {
          return {
            ...wall,
            rotation: (wall.rotation + 90) % 360,
          };
        }
        return wall;
      });
      setWalls(updatedWalls);
      setSelectedItem({ ...selectedItem, rotation: (selectedItem.rotation + 90) % 360 });
    }
  };
  
  const deleteItem = () => {
    if (!selectedItem) return;
    
    if (selectedItem.itemType === 'table') {
      setTables(tables.filter(table => table.id !== selectedItem.id));
    } else if (selectedItem.itemType === 'static') {
      setStaticItems(staticItems.filter(item => item.id !== selectedItem.id));
    } else if (selectedItem.itemType === 'wall') {
      setWalls(walls.filter(wall => wall.id !== selectedItem.id));
    }
    setSelectedItem(null);
  };

  const addTable = async (type: string) => {
    try {
      // Obtain component details for defaults
      const tableComponent = LAYOUT_COMPONENTS.find(comp => comp.type === type && comp.isTable) as TableComponent;
      
      // Determine type_id based on table type
      let type_id: number;
      switch (type) {
        case 'circular': type_id = 1; break;  // Круглый стол
        case 'circular-large': type_id = 2; break;  // Большой круглый стол
        case 'rectangular': type_id = 3; break;  // Прямоугольный стол
        case 'vip': type_id = 4; break;  // VIP-стол
        case 'banquet': type_id = 5; break;  // Банкетный зал
        default: type_id = 1;  // По умолчанию круглый стол
      }
      
      // Count existing tables to determine the next number
      const existingTablesOfType = tables.filter(t => t.type_id === type_id).length;
      const nextTableNumber = existingTablesOfType + 1;
      
      // Set width and height based on table type
      let width = 80;
      let height = 80;
      
      switch (type) {
        case 'circular': 
          width = 60; 
          height = 60; 
          break;
        case 'circular-large': 
          width = 80; 
          height = 80; 
          break;
        case 'rectangular': 
          width = 140; 
          height = 60; 
          break;
        case 'vip': 
          width = 180; 
          height = 180; 
          break;
        case 'banquet': 
          width = 200; 
          height = 100; 
          break;
      }
      
      // Create table data with appropriate dimensions
      const tableData = {
        type_id: type_id,
        table_number: nextTableNumber,
        max_guests: type === 'banquet' ? 25 : (tableComponent ? tableComponent.maxGuests : 2),
        x: 150,
        y: 150,
        rotation: 0,
        width: width,
        height: height,
      };

      console.log("Sending table data to server:", tableData);
      const response = await layoutAPI.addTable(tableData);
      console.log("Server response:", response.data);
      
      // Add type_name for frontend rendering
      const newTable = {
        ...response.data,
        type: type, // Original string type
        type_name: type // For rendering
      };
      
      console.log('Added new table:', newTable);
      setTables([...tables, newTable]);
      setSelectedItem({ ...newTable, itemType: 'table' });
    } catch (err) {
      console.error('Failed to add table:', err);
      setError('Не удалось добавить стол');
    }
  };

  const addStaticItem = async (type: string) => {
    try {
      const itemData = {
        type,
        x: 150,
        y: 150,
        rotation: 0,
      };

      const response = await layoutAPI.addStaticItem(itemData);
      setStaticItems([...staticItems, response.data]);
      setSelectedItem({ ...response.data, itemType: 'static' });
    } catch (err) {
      console.error('Failed to add static item:', err);
      setError('Не удалось добавить элемент');
    }
  };
  
  const toggleWallDrawing = () => {
    setIsDrawingWall(!isDrawingWall);
    setWallStartPoint(null);
    setCurrentWallEndPoint(null);
  };
  
  const handleEditorClick = (e: React.MouseEvent) => {
    // Deselect if not drawing wall
    if (!isDrawingWall) {
      setSelectedItem(null);
    }
  };

  const handleEditorMouseDown = (e: React.MouseEvent) => {
    if (!isDrawingWall || !editorRef.current) return;
    
    // Get editor element position
    const rect = editorRef.current.getBoundingClientRect();
    
    // Calculate position and snap to grid (20px grid)
    const x = Math.round((e.clientX - rect.left) / 20) * 20;
    const y = Math.round((e.clientY - rect.top) / 20) * 20;
    
    setWallStartPoint({ x, y });
  };

  const handleEditorMouseMove = (e: React.MouseEvent) => {
    if (!isDrawingWall || !wallStartPoint || !editorRef.current) return;
    
    // Get editor element position
    const rect = editorRef.current.getBoundingClientRect();
    
    // Calculate position and snap to grid (20px grid)
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    // Calculate the grid-aligned position
    let x = Math.round(rawX / 20) * 20;
    let y = Math.round(rawY / 20) * 20;
    
    // For straight lines: if close to straight (horizontal or vertical), snap to it
    const dx = Math.abs(x - wallStartPoint.x);
    const dy = Math.abs(y - wallStartPoint.y);
    
    // Snap to horizontal or vertical if within 10 pixels (adjust threshold as needed)
    if (dx > 0 && dy > 0) { // Not already perfectly aligned
      if (dy < 20) { // Close to horizontal
        y = wallStartPoint.y;
      } else if (dx < 20) { // Close to vertical
        x = wallStartPoint.x;
      }
    }
    
    setCurrentWallEndPoint({ x, y });
  };

  const handleEditorMouseUp = (e: React.MouseEvent) => {
    if (!isDrawingWall || !wallStartPoint || !editorRef.current) return;
    
    // Get editor element position
    const rect = editorRef.current.getBoundingClientRect();
    
    // Calculate position and snap to grid (20px grid)
    const x = Math.round((e.clientX - rect.left) / 20) * 20;
    const y = Math.round((e.clientY - rect.top) / 20) * 20;
    
    // Check if points are different
    if (x === wallStartPoint.x && y === wallStartPoint.y) {
      // Just a click, not a drag
      return;
    }
    
    // Calculate length and angle
    const dx = x - wallStartPoint.x;
    const dy = y - wallStartPoint.y;
    

    const length = Math.sqrt(dx * dx + dy * dy);
    if (length < 20) return;
    

    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    addWall(wallStartPoint.x, wallStartPoint.y, angle, length);
  };

  const handleEditorMouseLeave = () => {
    if (isDrawingWall && wallStartPoint) {
      // Reset if mouse leaves the editor during drawing
      setWallStartPoint(null);
      setCurrentWallEndPoint(null);
    }
  };
  
  const addWall = async (x: number, y: number, rotation: number, length: number) => {
    try {
      const wallData = {
        x,
        y,
        rotation,
        length,
      };
      
      const response = await layoutAPI.addWall(wallData);
      setWalls([...walls, response.data]);
      setSelectedItem({ ...response.data, itemType: 'wall' });
      
      // Exit wall drawing mode after adding a wall
      setIsDrawingWall(false);
      setWallStartPoint(null);
      setCurrentWallEndPoint(null);
    } catch (err) {
      console.error('Failed to add wall:', err);
      setError('Не удалось добавить стену');
    }
  };
  
  const clearLayout = async () => {
    if (window.confirm('Вы уверены, что хотите очистить план зала? Все элементы будут удалены.')) {
      try {
        await layoutAPI.clearLayout();
        setTables([]);
        setStaticItems([]);
        setWalls([]);
        setSelectedItem(null);
        setError(null);
      } catch (err) {
        console.error('Failed to clear layout:', err);
        setError('Не удалось очистить план зала');
      }
    }
  };

  const saveLayout = async () => {
    try {
      // Преобразуем таблицы для отправки на сервер
      const transformedTables = tables.map(({ id, ...rest }) => ({
        ...rest,
        type: rest.type_name // Ensure type field is set properly for backend
      }));
      
      const layoutData = {
        tables: transformedTables,
        static_items: staticItems.map(({ id, ...rest }) => rest),
        walls: walls.map(({ id, ...rest }) => rest),
      };

      // Отладочный вывод
      console.log('Saving layout:', JSON.stringify(layoutData));

      await layoutAPI.saveLayout(layoutData);
      setError(null);
      alert('План зала сохранен успешно');
    } catch (err) {
      console.error('Failed to save layout:', err);
      setError('Не удалось сохранить план зала');
    }
  };

  // Debug output of current positions
  useEffect(() => {
    if (tables.length > 0 || staticItems.length > 0 || walls.length > 0) {
      console.log("Current table positions:", tables.map(t => ({ id: t.id, x: t.x, y: t.y })));
      console.log("Current static item positions:", staticItems.map(i => ({ id: i.id, x: i.x, y: i.y })));
      console.log("Current wall positions:", walls.map(w => ({ id: w.id, x: w.x, y: w.y, length: w.length })));
    }
  }, [tables, staticItems, walls, updateCounter]);

  if (loading) {
    return <div className="p-8 text-center">Загрузка...</div>;
  }

  return (
    <div className="flex flex-col max-w-[1400px] mx-auto px-4">
      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Layout controls - top toolbar */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
        {/* Add elements panel */}
        <div className="bg-white p-2 border rounded-lg shadow-md max-w-full">
          <h3 className="font-bold mb-2 text-center text-sm">Добавить элемент</h3>
          <div className="flex flex-wrap gap-2">
            {LAYOUT_COMPONENTS.filter(comp => comp.type !== 'wall').map((component) => (
              <button
                key={component.type}
                onClick={() => component.isTable ? addTable(component.type) : addStaticItem(component.type)}
                className="p-1 bg-white border rounded hover:bg-gray-100 shadow-sm flex items-center justify-center"
                title={component.title}
              >
                <div className={`${component.scale} transform`}>
                  {renderComponentPreview(component)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Buttons - save, draw wall, clear */}
        <div className="flex flex-col gap-2">
          <button
            onClick={saveLayout}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md w-full"
          >
            Сохранить план
          </button>
          <button
            onClick={toggleWallDrawing}
            className={`px-4 py-2 border rounded-lg w-full ${
              isDrawingWall ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {isDrawingWall ? 'Закончить рисование стен' : 'Рисовать стены'}
          </button>
          <button
            onClick={clearLayout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-md w-full"
          >
            Очистить план
          </button>
        </div>
      </div>

      {/* Drawing instructions */}
      {isDrawingWall && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded mb-4">
          Нажмите и перетащите мышь, чтобы нарисовать стену. Стены будут привязаны к сетке.
        </div>
      )}

      {/* Editor area */}
      <div className="mt-4 bg-white rounded-lg shadow-md overflow-auto" ref={editorRef}>
        <div 
          className="border relative" 
          style={{ 
            width: '100%', 
            height: '80vh', 
            margin: '0 auto',
            backgroundColor: '#f9fafb',
            minWidth: '800px',
            minHeight: '600px'
          }}
          onClick={handleEditorClick}
          onMouseDown={handleEditorMouseDown}
          onMouseMove={handleEditorMouseMove}
          onMouseUp={handleEditorMouseUp}
          onMouseLeave={handleEditorMouseLeave}
        >
          {/* Grid background */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>

          {/* Selection controls (SVG icons) */}
          {selectedItem && (
            <div className="absolute top-2 right-2 flex space-x-2 z-50">
              <button 
                onClick={rotateItem}
                className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
                title="Повернуть"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
                </svg>
              </button>
              <button 
                onClick={deleteItem}
                className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
                title="Удалить"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          )}

          {/* Wall drawing overlay */}
          {isDrawingWall && wallStartPoint && currentWallEndPoint && (
            <div
              style={{
                position: 'absolute',
                left: `${Math.min(wallStartPoint.x, currentWallEndPoint.x)}px`,
                top: `${Math.min(wallStartPoint.y, currentWallEndPoint.y)}px`,
                width: `${Math.abs(currentWallEndPoint.x - wallStartPoint.x)}px`,
                height: `${Math.abs(currentWallEndPoint.y - wallStartPoint.y)}px`,
                border: '2px dashed #000',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                zIndex: 100
              }}
            />
          )}
          
          {/* Wall start point marker */}
          {isDrawingWall && wallStartPoint && (
            <div
              style={{
                position: 'absolute',
                left: `${wallStartPoint.x - 5}px`,
                top: `${wallStartPoint.y - 5}px`,
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: 'blue',
                zIndex: 101
              }}
            />
          )}

          {/* Tables, walls, and static items */}
          <DndContext 
            sensors={sensors} 
            onDragEnd={handleDragEnd}
          >
            <div className="h-full w-full relative">
              {/* Walls */}
              {walls.map((wall) => (
                <Draggable key={`wall-${wall.id}`} id={`wall-${wall.id}`}>
                  <div 
                    key={`wall-container-${wall.id}-${updateCounter}`}
                  >
                    <Wall
                      id={wall.id}
                      x={wall.x}
                      y={wall.y}
                      rotation={wall.rotation}
                      length={wall.length}
                      onClick={(id) => {
                        handleItemClick(id);
                      }}
                      isEditing={true}
                      isSelected={selectedItem && selectedItem.itemType === 'wall' && selectedItem.id === wall.id}
                    />
                  </div>
                </Draggable>
              ))}
              
              {/* Tables */}
              {tables.map((table) => {
                // Ensure we have valid width and height
                const tableWidth = table.width || (table.type_name === 'banquet' ? 200 : 80);
                const tableHeight = table.height || (table.type_name === 'banquet' ? 100 : 80);
                
                console.log(`Rendering table ${table.id}, type: ${table.type_name}, dimensions: ${tableWidth}x${tableHeight}`);
                
                return (
                  <Draggable key={`table-${table.id}`} id={`table-${table.id}`}>
                    <div
                      key={`table-container-${table.id}-${updateCounter}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(table.id);
                      }}
                      style={{
                        position: 'absolute',
                        left: `${table.x}px`,
                        top: `${table.y}px`,
                        width: `${tableWidth}px`,
                        height: `${tableHeight}px`,
                        zIndex: selectedItem && selectedItem.itemType === 'table' && selectedItem.id === table.id ? 20 : 10,
                      }}
                      className={selectedItem && selectedItem.itemType === 'table' && selectedItem.id === table.id ? 'ring-2 ring-blue-500' : ''}
                    >
                      <div style={{ width: '100%', height: '100%' }}>
                        {renderTableByType({
                          type_name: table.type_name || 'circular',
                          table_number: table.table_number || 1,
                          maxGuests: table.max_guests || 4,
                          isSelected: selectedItem && selectedItem.itemType === 'table' && selectedItem.id === table.id,
                          isAdmin: true
                        })}
                      </div>
                    </div>
                  </Draggable>
                );
              })}
                      
              {/* Static items */}
              {staticItems.map((item) => (
                <Draggable key={`static-${item.id}`} id={`static-${item.id}`}>
                  <div
                    key={`static-item-${item.id}-${updateCounter}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemClick(item.id);
                    }}
                    style={{
                      position: 'absolute',
                      left: `${item.x}px`,
                      top: `${item.y}px`,
                      zIndex: selectedItem && selectedItem.itemType === 'static' && selectedItem.id === item.id ? 20 : 10,
                    }}
                    className={selectedItem && selectedItem.itemType === 'static' && selectedItem.id === item.id ? 'ring-2 ring-blue-500' : ''}
                  >
                    <StaticItem
                      id={item.id}
                      type={item.type}
                      x={0}
                      y={0}
                      width={item.width || 80}
                      height={item.height || 60}
                      rotation={item.rotation || 0}
                      scale={scale}
                    />
                  </div>
                </Draggable>
              ))}
            </div>
          </DndContext>
        </div>
      </div>
    </div>
  );
};

export default LayoutEditor;
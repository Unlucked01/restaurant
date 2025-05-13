import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { layoutAPI, reservationsAPI } from '../../lib/api';
import ReservationModal from '../../components/ReservationModal';
import Navbar from '../../components/Navbar';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import ReservationTable from '../../components/ReservationTable';
import ReservationWall from '../../components/ReservationWall';
import StaticItem from '../../components/StaticItem';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';

export default function BookingPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [staticItems, setStaticItems] = useState<any[]>([]);
  const [walls, setWalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [maxGuests, setMaxGuests] = useState(4);
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [time, setTime] = useState(() => {
    // Get the next available hour for today
    const now = new Date();
    const currentHour = now.getHours();
    // If it's after 23:00, default to 12:00 (for the next day)
    // Otherwise, use the next hour after current hour (if available)
    const nextHour = currentHour >= 23 ? 12 : currentHour + 1;
    // Only use times between 12 and 23
    return nextHour >= 12 && nextHour < 24 ? `${nextHour}:00` : '12:00';
  });
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservedTables, setReservedTables] = useState<string[]>([]);
  const [modalKey, setModalKey] = useState(0);

  // Для масштабирования
  const [scale, setScale] = useState(1);
  const layoutContainerRef = useRef(null);

  // Добавляем состояние для хранения активной комнаты
  const [activeRoom, setActiveRoom] = useState<any>(null);

  const router = useRouter();
  const { edit: editReservationId, date: urlDate, time: urlTime, tableId: urlTableId, guests: urlGuests } = router.query;
  const [isEditMode, setIsEditMode] = useState(false);
  const { user, loading: authLoading } = useAuth();

  // Add state for duration
  const [duration, setDuration] = useState(1);

  useEffect(() => {
    // Redirect if not logged in
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      initializeRoomAndLayout();
    }
  }, [user]);

  useEffect(() => {
    if (date && time && user && activeRoom) {
      fetchAvailability();
    }
  }, [date, time, user, activeRoom]);

  // Новая функция для инициализации комнаты и макета
  const initializeRoomAndLayout = async () => {
    try {
      setLoading(true);
      // Получаем или создаем дефолтную комнату
      const defaultRoom = await layoutAPI.getOrCreateDefaultRoom();
      console.log('Default room:', defaultRoom);
      setActiveRoom(defaultRoom);
      
      // Загружаем макет для этой комнаты
      await fetchLayout(defaultRoom.id);
    } catch (err) {
      console.error('Failed to initialize room and layout:', err);
      setError('Не удалось загрузить план зала. Пожалуйста, попробуйте позже.');
    }
  };

  useEffect(() => {
    if (editReservationId) {
      setIsEditMode(true);
      
      if (urlTableId) {
        setSelectedTable(urlTableId as string);
      }
      
      if (urlDate) {
        setDate(urlDate as string);
      }
      
      if (urlTime) {
        const formattedTime = urlTime.toString().substring(0, 5);
        // Check if the time is valid for today
        if (urlDate === new Date().toISOString().split('T')[0]) {
          const now = new Date();
          const currentHour = now.getHours();
          const timeHour = parseInt(formattedTime.split(':')[0], 10);
          
          // Only set the time if it's after the current hour
          if (timeHour > currentHour) {
            setTime(formattedTime);
          } else {
            // Set to next available hour
            const nextHour = currentHour >= 23 ? 12 : currentHour + 1;
            const validTime = nextHour >= 12 && nextHour < 24 ? `${nextHour}:00` : '12:00';
            setTime(validTime);
          }
        } else {
          // Not today, so any time is valid
          setTime(formattedTime);
        }
      }
      
      if (urlGuests) {
        setMaxGuests(parseInt(urlGuests as string, 10) || 4);
      }
      
      setShowReservationModal(true);
    }
  }, [editReservationId, urlTableId, urlDate, urlTime, urlGuests]);

  // Обработчик для изменения размера окна
  useEffect(() => {
    const handleResize = () => {
      if (layoutContainerRef.current) {
        const containerWidth = layoutContainerRef.current.clientWidth;
        // Устанавливаем масштаб в зависимости от ширины контейнера
        // 800px - это исходная ширина плана зала
        const newScale = Math.min(1, (containerWidth - 40) / 800);
        setScale(newScale);
      }
    };

    // Устанавливаем начальный масштаб
    handleResize();

    // Добавляем обработчик события изменения размера окна
    window.addEventListener('resize', handleResize);
    
    // Удаляем обработчик при размонтировании компонента
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Обновляем fetchLayout для работы с комнатой
  const fetchLayout = async (roomId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await layoutAPI.getLayout(roomId);
      
      // Extract tables, static items, and walls from the layout data
      const { tables = [], static_items = [], walls = [] } = data;
      
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
      const tablesWithTypeName = tables.map(table => ({
        ...table,
        type_name: table.type || mapTypeIdToName(table.type_id) // Use type if available, otherwise map from type_id
      }));
      
      console.log('Fetched tables with type_name:', tablesWithTypeName);
      
      // Remove the code that adds a banquet hall
      // No longer automatically adding a banquet hall table
      
      setTables(tablesWithTypeName);
      setStaticItems(static_items);
      setWalls(walls);
    } catch (error) {
      console.error('Failed to fetch layout:', error);
      setError('Не удалось загрузить план зала');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      const { data } = await reservationsAPI.getAvailability(date, time, duration);
      console.log('Availability data:', data);
      
      // Check for the format in the pasted sample (array with table_id and available)
      if (Array.isArray(data) && data.length > 0 && 'table_id' in data[0] && 'available' in data[0]) {
        // Extract IDs of unavailable tables
        const unavailableTables = data
          .filter(table => table.available === false)
          .map(table => table.table_id);
        
        console.log('Reserved table IDs:', unavailableTables);
        setReservedTables(unavailableTables);
      }
      // Check if data.tables exists (array of table objects)
      else if (data.tables && Array.isArray(data.tables)) {
        // Extract IDs of unavailable tables
        const unavailableTables = data.tables
          .filter(table => table.available === false)
          .map(table => table.table_id);
        
        console.log('Reserved table IDs:', unavailableTables);
        setReservedTables(unavailableTables);
      } 
      // Fallback to the old format if it exists
      else if (data.reserved_tables && Array.isArray(data.reserved_tables)) {
        console.log('Reserved tables (old format):', data.reserved_tables);
        setReservedTables(data.reserved_tables);
      } else {
        console.warn('Unexpected availability data format:', data);
        setReservedTables([]);
      }
    } catch (error) {
      console.error('Failed to fetch availability:', error);
      setError('Не удалось загрузить данные о доступности столиков');
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTime(e.target.value);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDuration(parseInt(e.target.value, 10));
  };

  const handleTableClick = (tableId: string, maxGuests: number) => {
    // Check if the table is already reserved
    if (reservedTables.includes(tableId)) {
      setError('Этот столик уже забронирован на выбранное время. Пожалуйста, выберите другой столик или время.');
      return;
    }
    
    setSelectedTable(tableId);
    setMaxGuests(maxGuests);
    setShowReservationModal(true);
    setModalKey(prevKey => prevKey + 1);
  };

  const handleReservationSuccess = () => {
    setShowReservationModal(false);
    fetchAvailability(); // Refresh availability data
  };

  return (
    <>
      <Head>
        <title>Забронировать столик - Pure Heart</title>
        <meta name="description" content="Бронирование столиков в ресторане Pure Heart" />
      </Head>

      <Navbar />

      <main className="pt-20 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Забронировать столик</h1>
            <p className="mt-2 text-gray-600">
              Выберите дату, время и столик, который вам подходит
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 mx-auto max-w-3xl">
              {error}
            </div>
          )}

          <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow mb-8">
            <div className="mb-4 flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-gray-700 mb-2 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-1 text-gray-500" />
                  <span>Дата:</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={handleDateChange}
                  min={new Date().toISOString().split('T')[0]}
                  max={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className="border rounded px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-1 text-gray-500" />
                  <span>Время:</span>
                </label>
                <select
                  value={time}
                  onChange={handleTimeChange}
                  className="border rounded px-3 py-2"
                >
                  {(() => {
                    // Generate time slots from 12:00 to 23:00
                    let timeSlots = Array.from({ length: 12 }, (_, i) => {
                      const hour = i + 12;
                      return hour < 24 ? `${hour}:00` : null;
                    }).filter(Boolean);
                    
                    // Filter out times up to and including current hour for same-day reservations
                    if (date === new Date().toISOString().split('T')[0]) {
                      const now = new Date();
                      const currentHour = now.getHours();
                      
                      timeSlots = timeSlots.filter(timeSlot => {
                        const [hour] = timeSlot.split(':').map(Number);
                        return hour > currentHour;
                      });
                    }
                    
                    // Filter out times that would extend past closing
                    timeSlots = timeSlots.filter(timeSlot => {
                      const [hour] = timeSlot.split(':').map(Number);
                      return hour + duration <= 24;
                    });
                    
                    return timeSlots.map((timeSlot) => (
                      <option key={timeSlot} value={timeSlot}>
                        {timeSlot}
                      </option>
                    ));
                  })()}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-1 text-gray-500" />
                  <span>Продолжительность:</span>
                </label>
                <select
                  value={duration}
                  onChange={handleDurationChange}
                  className="border rounded px-3 py-2"
                >
                  {[1, 2, 3, 4, 5, 6].map((hours) => (
                    <option key={hours} value={hours}>
                      {hours} {hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-3">
                <div className="flex items-center mb-2">
                  <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                  <span>Доступен для бронирования</span>
                </div>
                <div className="flex items-center mb-2">
                  <div className="w-4 h-4 rounded-full bg-red-400 mr-2"></div>
                  <span>Забронирован</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-purple-500 mr-2"></div>
                  <span>Банкетный зал (до 25 гостей)</span>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Загрузка плана зала...</p>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow overflow-auto" ref={layoutContainerRef}>
              <div className="border relative" style={{ 
                width: '100%', 
                height: '80vh', 
                margin: '0 auto',
                backgroundColor: '#f9fafb',
                minWidth: '800px',
                minHeight: '600px'
              }}>
                {/* Walls */}
                {walls.map((wall) => (
                  <ReservationWall
                    key={wall.id}
                    id={wall.id}
                    x={wall.x}
                    y={wall.y}
                    rotation={wall.rotation}
                    length={wall.length}
                    scale={scale}
                  />
                ))}

                {/* Static Items */}
                {staticItems.map((item) => {
                  // Ensure item has defaults for width and height
                  const width = item.width || 80;
                  const height = item.height || 60;
                  
                  return (
                    <StaticItem
                      key={item.id}
                      id={item.id}
                      type={item.type}
                      x={item.x}
                      y={item.y}
                      width={width}
                      height={height}
                      rotation={item.rotation}
                      scale={scale}
                    />
                  );
                })}

                {/* Tables */}
                {tables.map((table) => {
                  const isReserved = reservedTables.includes(table.id);
                  
                  return (
                    <ReservationTable
                      key={table.id}
                      id={table.id}
                      type_id={table.type_id || 1}
                      type_name={table.type_name || 'circular'}
                      table_number={table.table_number || 1}
                      maxGuests={table.max_guests || 4}
                      x={table.x}
                      y={table.y}
                      width={table.width || 80}
                      height={table.height || 80}
                      rotation={table.rotation}
                      isReserved={isReserved}
                      onClick={handleTableClick}
                      scale={scale}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Reservation Modal */}
        {showReservationModal && selectedTable && (
          <ReservationModal
            key={modalKey}
            tableId={selectedTable}
            maxGuests={maxGuests}
            onClose={() => {
              setShowReservationModal(false);
              if (isEditMode) {
                router.push('/booking');
              }
            }}
            onSuccess={() => {
              handleReservationSuccess();
              if (isEditMode) {
                router.push('/account');
              }
            }}
            initialDate={date}
            initialTime={time}
            initialDuration={duration}
            editMode={isEditMode}
            reservationId={editReservationId as string}
          />
        )}
      </main>
    </>
  );
} 
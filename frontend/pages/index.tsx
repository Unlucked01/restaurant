import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { layoutAPI, reservationsAPI } from '../lib/api';
import ReservationModal from '../components/ReservationModal';
import Navbar from '../components/Navbar';
import { CalendarIcon, MapPinIcon, ClockIcon, PhoneIcon } from '@heroicons/react/24/outline';
import ReservationTable from '../components/ReservationTable';
import ReservationWall from '../components/ReservationWall';
import StaticItem from '../components/StaticItem';
import { useAuth } from '../context/AuthContext';


export default function Home() {
  const [tables, setTables] = useState<any[]>([]);
  const [staticItems, setStaticItems] = useState<any[]>([]);
  const [walls, setWalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [maxGuests, setMaxGuests] = useState(4);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const nextHour = currentHour >= 23 ? 12 : currentHour + 1;
    return nextHour >= 12 && nextHour < 24 ? `${nextHour}:00` : '12:00';
  });
  const [tableSizes, setTableSizes] = useState<Record<string, { width: number; height: number }>>(
    {}
  );
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservedTables, setReservedTables] = useState<string[]>([]);
  const [modalKey, setModalKey] = useState(0);
  const [scale, setScale] = useState(1);
  const layoutContainerRef = useRef(null);
  
  // Добавляем состояние для комнаты
  const [activeRoom, setActiveRoom] = useState<any>(null);

  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    initializeRoomAndLayout();
  }, []);

  useEffect(() => {
    if (date && time && activeRoom) {
      fetchAvailability();
    }
  }, [date, time, activeRoom]);

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
    const handleResize = () => {
      if (layoutContainerRef.current) {
        const containerWidth = layoutContainerRef.current.clientWidth;
        const newScale = Math.min(1, (containerWidth - 40) / 800);
        setScale(newScale);
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
      
      setTables(tablesWithTypeName);
      setStaticItems(static_items);
      setWalls(walls);

      // Create a mapping of table sizes
      const sizes: Record<string, { width: number; height: number }> = {};
      tablesWithTypeName.forEach((table: any) => {
        sizes[table.id] = { width: table.width, height: table.height };
      });
      setTableSizes(sizes);
    } catch (error) {
      console.error('Failed to fetch layout:', error);
      setError('Не удалось загрузить план зала');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      const { data } = await reservationsAPI.getAvailability(date, time);
      console.log('Availability data:', data);
      
      // Check for the format with table objects
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
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTime(e.target.value);
  };

  // Move to next day when no time slots available
  const moveToNextDay = () => {
    const currentDate = new Date(date);
    currentDate.setDate(currentDate.getDate() + 1);
    const nextDay = currentDate.toISOString().split('T')[0];
    setDate(nextDay);
    setTime('12:00'); // Reset to earliest time
  };

  // Generate time slots for the current date
  const getTimeSlots = () => {
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
    
    return timeSlots;
  };

  // Check if current time slots are empty and move to next day if necessary
  useEffect(() => {
    const timeSlots = getTimeSlots();
    
    if (timeSlots.length === 0) {
      moveToNextDay();
    } else if (!timeSlots.includes(time) && timeSlots.length > 0) {
      // If current time is no longer valid, select the first available time
      setTime(timeSlots[0]);
    }
  }, [date]);

  const handleTableClick = (tableId: string, maxGuests: number) => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (reservedTables.includes(tableId)) {
      return; // Table is already reserved
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
        <title>Pure Heart - Ресторан</title>
        <meta name="description" content="Бронирование столиков в ресторане Pure Heart" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navbar />

      <main className="pt-20 pb-10">
        {/* Hero Section */}
        <section className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                Pure Heart
              </h1>
              <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
                Изысканная кухня в атмосфере уюта и комфорта
              </p>
              <div className="mt-8 flex justify-center space-x-4">
                <Link
                  href="/menu"
                  className="px-6 py-3 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition"
                >
                  Наше меню
                </Link>
                <button
                  onClick={() => {
                    if (!user) {
                      router.push('/login');
                    } else {
                      const layoutSection = document.getElementById('reservation-section');
                      if (layoutSection) {
                        layoutSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition"
                >
                  Забронировать стол
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Restaurant Info Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">О ресторане</h2>
                <p className="text-gray-600 mb-6">
                  Pure Heart - это место, где традиции встречаются с инновациями. Наш ресторан предлагает 
                  изысканные блюда русской и европейской кухни, приготовленные из свежих сезонных 
                  продуктов. Уютная атмосфера и внимательный сервис создадут идеальные условия 
                  для вашего отдыха.
                </p>
                
                <div className="space-y-4 text-gray-600">
                  <div className="flex items-start">
                    <ClockIcon className="h-6 w-6 mr-2 text-blue-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">Часы работы</h3>
                      <p>Каждый день: 12:00 - 24:00</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPinIcon className="h-6 w-6 mr-2 text-blue-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">Адрес</h3>
                      <p>г. Москва, ул. Ресторанная, 123</p>
                      <p>5 минут от метро "Кулинария"</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <PhoneIcon className="h-6 w-6 mr-2 text-blue-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">Контакты</h3>
                      <p>Телефон: +7 (123) 456-78-90</p>
                      <p>Email: info@pureheart.com</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative h-96 rounded-lg overflow-hidden shadow-lg">
                <img 
                  src="/images/restaurant.png" 
                  alt="Ресторан Pure Heart" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/unknown.png';
                  }} 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Reservation Section */}
        <section id="reservation-section" className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Забронировать столик</h2>
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
                    {getTimeSlots().map((timeSlot) => (
                      <option key={timeSlot} value={timeSlot}>
                        {timeSlot}
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
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                    <span>Забронирован</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                <button
                  onClick={() => {
                    if (!user) {
                      router.push('/login');
                    } else {
                      router.push('/booking');
                    }
                  }}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Просмотреть все столики
                </button>
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
                  {staticItems.map((item) => (
                    <StaticItem
                      key={item.id}
                      id={item.id}
                      type={item.type}
                      x={item.x}
                      y={item.y}
                      width={item.width || 80}
                      height={item.height || 60}
                      rotation={item.rotation}
                      scale={scale}
                    />
                  ))}

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
        </section>
      </main>

      {/* Reservation Modal */}
      {showReservationModal && selectedTable && (
        <ReservationModal
          key={modalKey}
          tableId={selectedTable}
          maxGuests={maxGuests}
          onClose={() => setShowReservationModal(false)}
          onSuccess={handleReservationSuccess}
          initialDate={date}
          initialTime={time}
        />
      )}
    </>
  );
} 
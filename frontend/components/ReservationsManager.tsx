import React, { useState, useEffect } from 'react';
import { reservationsAPI, menuAPI } from '../lib/api';
import { format } from 'date-fns';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface ReservationStats {
  total_reservations: number;
  reservations_by_date: Record<string, number>;
  reservations_by_table: Record<string, number>;
  average_guests: number;
}

interface OrderStats {
  total_orders: number;
  items_sold: Record<string, number>;
  items_by_category: Record<string, number>;
  total_revenue: number;
}

const ReservationsManager: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [reservationStats, setReservationStats] = useState<ReservationStats | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [statsPeriod, setStatsPeriod] = useState<string>('week');
  
  // Fetch reservations for selected date
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        const response = await reservationsAPI.getAllReservations(selectedDate);
        setReservations(response.data);
      } catch (err) {
        console.error('Failed to fetch reservations:', err);
        setError('Не удалось загрузить данные о бронированиях');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [selectedDate]);

  // Fetch statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        
        // Use actual API calls 
        const resStatsResponse = await reservationsAPI.getReservationStats(statsPeriod);
        const orderStatsResponse = await reservationsAPI.getOrderStats();
        
        setReservationStats(resStatsResponse.data);
        setOrderStats(orderStatsResponse.data);
      } catch (err) {
        console.error('Failed to fetch statistics:', err);
        
        // Fallback to mock data if API fails
        // Mock reservation stats data
        const mockResStats: ReservationStats = {
          total_reservations: 145,
          reservations_by_date: {
            '2023-05-01': 12,
            '2023-05-02': 15,
            '2023-05-03': 8,
            '2023-05-04': 20,
            '2023-05-05': 25,
            '2023-05-06': 30,
            '2023-05-07': 35,
          },
          reservations_by_table: {
            'Столик 1': 30,
            'Столик 2': 25,
            'Столик 3': 20,
            'Столик 4': 15,
            'Столик 5': 10,
            'Столик 6': 25,
            'Столик 7': 20,
          },
          average_guests: 3.5,
        };
        
        // Mock order stats data
        const mockOrderStats: OrderStats = {
          total_orders: 120,
          items_sold: {
            'Стейк': 45,
            'Паста': 35,
            'Салат Цезарь': 30,
            'Пицца': 60,
            'Бургер': 50,
            'Тирамису': 25,
            'Чизкейк': 20,
          },
          items_by_category: {
            'Основные блюда': 190,
            'Закуски': 85,
            'Десерты': 65,
            'Напитки': 110,
          },
          total_revenue: 256000,
        };
        
        setReservationStats(mockResStats);
        setOrderStats(mockOrderStats);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [statsPeriod]);

  // Prepare chart data for top ordered items
  const dishSalesData = {
    labels: orderStats ? Object.keys(orderStats.items_sold) : [],
    datasets: [
      {
        label: 'Продажи блюд',
        data: orderStats ? Object.values(orderStats.items_sold) : [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare chart data for reservations by table
  const tableReservationsData = {
    labels: reservationStats ? Object.keys(reservationStats.reservations_by_table) : [],
    datasets: [
      {
        label: 'Бронирования по столикам',
        data: reservationStats ? Object.values(reservationStats.reservations_by_table) : [],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare bar chart data for reservations by date
  const dateReservationsData = {
    labels: reservationStats ? Object.keys(reservationStats.reservations_by_date).map(date => 
      format(new Date(date), 'dd.MM')
    ) : [],
    datasets: [
      {
        label: 'Бронирования по дням',
        data: reservationStats ? Object.values(reservationStats.reservations_by_date) : [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Распределение бронирований по дням',
      },
    },
  };

  return (
    <div className="reservations-manager">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button 
            className="text-gray-400 hover:text-gray-600 bg-transparent border-none"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-3">Статистика бронирований</h3>
          
          <div className="flex gap-5 mb-4">
            <button 
              onClick={() => setStatsPeriod('week')}
              className={`px-4 py-2 rounded text-sm ${
                statsPeriod === 'week' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Неделя
            </button>
            <button 
              onClick={() => setStatsPeriod('month')}
              className={`px-4 py-2 rounded text-sm ${
                statsPeriod === 'month' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Месяц
            </button>
            <button 
              onClick={() => setStatsPeriod('year')}
              className={`px-4 py-2 rounded text-sm ${
                statsPeriod === 'year' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Год
            </button>
          </div>
          
          {statsLoading ? (
            <div className="text-center py-4">Загрузка статистики...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Всего бронирований</div>
                  <div className="text-2xl font-semibold">
                    {reservationStats?.total_reservations || 0}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Средний размер группы</div>
                  <div className="text-2xl font-semibold">
                    {reservationStats?.average_guests.toFixed(1) || 0}
                  </div>
                </div>
              </div>
              
              <div className="h-64 mb-4">
                <h4 className="text-sm font-medium mb-2">Распределение бронирований по столикам</h4>
                <Pie data={tableReservationsData} />
              </div>
              
              <div className="h-64">
                <Bar options={barOptions} data={dateReservationsData} />
              </div>
            </>
          )}
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-3">Популярные блюда</h3>
          
          {statsLoading ? (
            <div className="text-center py-4">Загрузка статистики...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Всего заказов</div>
                  <div className="text-2xl font-semibold">
                    {orderStats?.total_orders || 0}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Выручка</div>
                  <div className="text-2xl font-semibold">
                    {orderStats ? `${orderStats.total_revenue.toLocaleString('ru-RU')} ₽` : '0 ₽'}
                  </div>
                </div>
              </div>
              
              <div className="h-80">
                <h4 className="text-sm font-medium mb-2">Продажи блюд</h4>
                <Pie data={dishSalesData} />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Текущие бронирования</h3>
          
          <div className="flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-4">Загрузка бронирований...</div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            На выбранную дату нет бронирований
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Столик
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Имя
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Время
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Гости
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Телефон
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(reservation.table_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {reservation.first_name} {reservation.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {reservation.reservation_time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {reservation.guests_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {reservation.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {reservation.status === 'confirmed' ? 'Подтверждено' :
                         reservation.status === 'pending' ? 'Ожидание' :
                         reservation.status || 'Ожидание'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button 
                          className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          title="Редактировать"
                          onClick={() => {
                            // Handle edit
                            alert('Редактирование бронирования ' + reservation.id);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                          title="Оплатить"
                          onClick={() => {
                            // Handle payment
                            alert('Оплата бронирования ' + reservation.id);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <button 
                          className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          title="Удалить"
                          onClick={() => {
                            // Handle delete
                            if (confirm('Вы уверены, что хотите удалить бронирование?')) {
                              alert('Удаление бронирования ' + reservation.id);
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservationsManager; 
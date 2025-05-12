import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { reservationsAPI } from '../../lib/api';

const AdminReservationsPage: React.FC = () => {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    // Redirect if not logged in or not admin
    if (!loading && (!user || !isAdmin)) {
      router.push('/login');
    }
  }, [user, loading, isAdmin, router]);

  useEffect(() => {
    // Fetch reservations when the component mounts or the date changes
    if (user && isAdmin) {
      fetchReservations();
    }
  }, [user, isAdmin, filterDate]);

  const fetchReservations = async () => {
    try {
      setLoadingReservations(true);
      setError(null);
      const response = await reservationsAPI.getAllReservations(filterDate);
      
      // Sort reservations by date and time
      const sortedReservations = response.data.sort((a: any, b: any) => {
        const dateA = new Date(`${a.reservation_date}T${a.reservation_time}`);
        const dateB = new Date(`${b.reservation_date}T${b.reservation_time}`);
        return dateA.getTime() - dateB.getTime();
      });
      
      setReservations(sortedReservations);
    } catch (err) {
      console.error('Failed to fetch reservations:', err);
      setError('Не удалось загрузить бронирования');
    } finally {
      setLoadingReservations(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'd MMMM yyyy', { locale: ru });
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null; // Will redirect in the useEffect
  }

  return (
    <>
      <Head>
        <title>Управление бронированиями - Pure Heart</title>
      </Head>
      
      <Navbar />
      
      <main className="pt-20 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <header className="mb-8 flex flex-wrap justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Управление бронированиями</h1>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <span className="text-gray-700">Дата:</span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="border rounded px-3 py-2"
              />
            </label>
            
            <button
              onClick={fetchReservations}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Обновить
            </button>
          </div>
        </header>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {loadingReservations ? (
          <p className="text-gray-500">Загрузка бронирований...</p>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {reservations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Гость
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Контакт
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата и время
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Столик
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Гостей
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Сумма
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reservations.map((reservation) => (
                      <tr key={reservation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {reservation.first_name} {reservation.last_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{reservation.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(reservation.reservation_date)}</div>
                          <div className="text-sm text-gray-500">{reservation.reservation_time}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{reservation.table_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reservation.guests_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reservation.total_price ? `${reservation.total_price} ₽` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {reservation.status === 'confirmed' ? 'Подтверждено' :
                             reservation.status === 'pending' ? 'Ожидание' :
                             reservation.status || 'Ожидание'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                На выбранную дату нет бронирований
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
};

export default AdminReservationsPage; 
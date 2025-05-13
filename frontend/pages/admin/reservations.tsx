import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { reservationsAPI } from '../../lib/api';
import ReservationEditModal from '../../components/ReservationEditModal';

const AdminReservationsPage: React.FC = () => {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentReservationId, setCurrentReservationId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<string | null>(null);

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
  
  const calculateAverageCheck = () => {
    if (reservations.length === 0) return 0;
    
    // Filter completed reservations with a price
    const completedReservations = reservations.filter(res => 
      res.total_price && res.total_price > 0 && res.status === 'confirmed'
    );
    
    if (completedReservations.length === 0) return 0;
    
    // Calculate total revenue
    const totalRevenue = completedReservations.reduce(
      (sum, res) => sum + (parseFloat(res.total_price) || 0), 
      0
    );
    
    // Calculate average check
    return Math.round(totalRevenue / completedReservations.length);
  };
  
  const calculateTotalRevenue = () => {
    return reservations.reduce(
      (sum, res) => sum + (parseFloat(res.total_price) || 0), 
      0
    );
  };
  
  const handleEditClick = (reservationId: string) => {
    setCurrentReservationId(reservationId);
    setEditModalOpen(true);
  };
  
  const handleDeleteClick = (reservationId: string) => {
    setReservationToDelete(reservationId);
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = async () => {
    if (!reservationToDelete) return;
    
    try {
      await reservationsAPI.deleteReservation(reservationToDelete);
      setReservations(prev => prev.filter(res => res.id !== reservationToDelete));
      setShowDeleteConfirm(false);
      setReservationToDelete(null);
    } catch (err) {
      console.error('Failed to delete reservation:', err);
      setError('Не удалось удалить бронирование');
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
        
        {/* Revenue Statistics Summary */}
        <div className="bg-white shadow rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-md p-4 bg-blue-50">
            <h3 className="text-lg font-medium text-gray-900">Общая выручка</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{calculateTotalRevenue().toLocaleString()} ₽</p>
          </div>
          
          <div className="border rounded-md p-4 bg-green-50">
            <h3 className="text-lg font-medium text-gray-900">Средний чек</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{calculateAverageCheck().toLocaleString()} ₽</p>
          </div>
        </div>
        
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleEditClick(reservation.id)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Изменить
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(reservation.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Удалить
                            </button>
                          </div>
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
      
      {/* Edit Modal */}
      {editModalOpen && currentReservationId && (
        <ReservationEditModal
          reservationId={currentReservationId}
          onClose={() => setEditModalOpen(false)}
          onSuccess={() => {
            setEditModalOpen(false);
            fetchReservations();
          }}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Подтверждение удаления</h3>
            <p className="text-gray-600 mb-6">
              Вы уверены, что хотите удалить это бронирование? Это действие нельзя отменить.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded"
              >
                Отмена
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminReservationsPage; 
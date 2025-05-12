import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ReservationCard from '../components/ReservationCard';
import { reservationsAPI } from '../lib/api';

const AccountPage: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editReservationId, setEditReservationId] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not logged in
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Fetch user's reservations
    if (user) {
      fetchUserReservations();
    }
  }, [user]);

  const fetchUserReservations = async () => {
    try {
      setLoadingReservations(true);
      setError(null);
      const response = await reservationsAPI.getMyReservations();
      setReservations(response.data);
    } catch (err) {
      console.error('Failed to fetch reservations:', err);
      setError('Не удалось загрузить бронирования');
    } finally {
      setLoadingReservations(false);
    }
  };

  const handleDeleteReservation = (id: string) => {
    // Filter out the deleted reservation
    setReservations(reservations.filter(r => r.id !== id));
  };

  const handleEditReservation = (id: string) => {
    // Find reservation to edit
    const reservation = reservations.find(r => r.id === id);
    if (reservation) {
      // Navigate to booking page with reservation data
      router.push({
        pathname: '/booking',
        query: { 
          edit: id,
          date: reservation.reservation_date,
          time: reservation.reservation_time,
          tableId: reservation.table_id,
          guests: reservation.guests_count
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in the useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Мой аккаунт - Pure Heart</title>
        <meta name="description" content="Управление личным аккаунтом" />
      </Head>

      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Личный кабинет</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Мой профиль</h2>
              
              {user && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Имя</p>
                    <p className="font-medium">{user.first_name} {user.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Телефон</p>
                    <p className="font-medium">{user.phone || 'Не указан'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Мои бронирования</h2>
              
              {error && (
                <div className="bg-red-50 text-red-700 p-3 mb-4 rounded-lg">
                  {error}
                </div>
              )}

              {loadingReservations ? (
                <div className="py-8 text-center text-gray-500">
                  Загрузка бронирований...
                </div>
              ) : reservations.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {reservations.map((reservation) => (
                    <ReservationCard 
                      key={reservation.id} 
                      reservation={reservation}
                      onDelete={handleDeleteReservation}
                      onEdit={handleEditReservation}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center border-2 border-dashed rounded-lg">
                  <p className="text-gray-500 mb-2">У вас пока нет бронирований</p>
                  <button
                    onClick={() => router.push('/booking')}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Забронировать столик
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccountPage; 
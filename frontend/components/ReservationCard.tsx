import React, { useState } from 'react';
import { format, parseISO, addHours, isPast } from 'date-fns';
import { ru } from 'date-fns/locale';
import Image from 'next/image';
import { reservationsAPI } from '../lib/api';
import { renderTableByType } from './TableStyles';

interface ReservationCardProps {
  reservation: {
    id: string;
    reservation_date: string;
    reservation_time: string;
    guests_count: number;
    first_name: string;
    last_name: string;
    phone: string;
    table_id: string;
    table?: {
      id: string;
      type_id: number;
      table_number: number;
      width?: number;
      height?: number;
      table_type?: {
        id: number;
        name: string;
        display_name: string;
        color_code?: string;
        default_width: number;
        default_height: number;
        default_max_guests: number;
      };
    };
    table_name?: string;
    total_price?: number;
    status?: string;
    duration?: number;
  };
  tableNameMap?: Record<string, string>;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

const ReservationCard: React.FC<ReservationCardProps> = ({ 
  reservation, 
  tableNameMap = {},
  onDelete,
  onEdit
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format the date to a more readable format
  const formattedDate = (() => {
    try {
      const date = parseISO(reservation.reservation_date);
      return format(date, 'd MMMM', { locale: ru });
    } catch (e) {
      return reservation.reservation_date;
    }
  })();

  // Get the table name from the map, table data, or use a default
  const tableName = reservation.table_name || 
                   (reservation.table?.table_type?.display_name && 
                    `${reservation.table.table_type.display_name} №${reservation.table.table_number}`) ||
                   tableNameMap[reservation.table_id] || 
                   `Столик №${reservation.table_id.slice(0, 4)}`;
                   
  // Get table type for icon rendering
  const tableType = reservation.table?.table_type?.name || 'circular';
  const tableNumber = reservation.table?.table_number || 1;

  // Check if reservation can be edited or canceled
  const reservationDateTime = (() => {
    try {
      const date = parseISO(reservation.reservation_date);
      const [hours, minutes] = reservation.reservation_time.split(':');
      const result = new Date(date);
      result.setHours(parseInt(hours, 10));
      result.setMinutes(parseInt(minutes, 10));
      return result;
    } catch (e) {
      return new Date();
    }
  })();

  const canCancel = new Date() < addHours(reservationDateTime, -6);
  const canEdit = new Date() < addHours(reservationDateTime, -3);
  const isPastReservation = isPast(reservationDateTime);

  // Get the appropriate card width based on table type
  const getCardWidth = () => {
    switch (tableType) {
      case 'rectangular':
        return '260px';
      case 'vip':
      case 'banquet':
        return '280px';
      default:
        return '220px';
    }
  };
  
  // Get margins for wider cards to prevent overlapping
  const getCardMargin = () => {
    switch (tableType) {
      case 'rectangular':
      case 'vip':
      case 'banquet':
        return 'mx-2'; // Add horizontal margin to wider cards
      default:
        return '';
    }
  };

  const getIconWidth = () => {
    switch (tableType) {
      case 'rectangular':
        return 'w-24 h-20 mt-6';
      case 'vip':
      case 'banquet':
        return 'w-20 h-20 mt-6';
      default:
        return 'w-16 h-16 mt-10';
    }
  };

  const handleDelete = async () => {
    if (!canCancel) {
      setError("Бронирование можно отменить не позднее чем за 6 часов до начала");
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      await reservationsAPI.deleteReservation(reservation.id);
      setShowModal(false);
      if (onDelete) {
        onDelete(reservation.id);
      }
    } catch (err: any) {
      console.error('Failed to delete reservation:', err);
      setError(err.response?.data?.detail || 'Не удалось отменить бронирование');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    if (!canEdit) {
      setError("Бронирование можно изменить не позднее чем за 3 часа до начала");
      return;
    }

    if (onEdit) {
      onEdit(reservation.id);
    }
  };

  return (
    <>
      <div 
        className={`border rounded-lg p-3 shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer flex flex-col ${getCardMargin()}`}
        onClick={() => setShowModal(true)}
        style={{ width: getCardWidth() }}
      >
        {/* Table Icon */}
        <div className="flex justify-center mb-2">
          <div className={getIconWidth()}>
            {renderTableByType({
              type_name: tableType,
              table_number: tableNumber,
              maxGuests: reservation.guests_count,
              isReserved: false
            })}
          </div>
        </div>
        
        {/* Status badge if needed */}
        {reservation.status && (
          <div className="absolute top-2 right-2">
            <span className={`text-xs px-2 py-1 rounded ${
              reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
              reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {reservation.status === 'confirmed' ? 'Подтверждено' :
              reservation.status === 'pending' ? 'Ожидание' :
              reservation.status}
            </span>
          </div>
        )}
        
        {/* Info line - in a single line */}
        <div className="text-xs text-gray-600 text-center mt-5">
          <div className="truncate">
            {formattedDate} · {reservation.reservation_time.substring(0, 5)} · {reservation.guests_count} {reservation.guests_count === 1 ? 'гость' : reservation.guests_count < 5 ? 'гостя' : 'гостей'}
          </div>
        </div>
      </div>

      {/* Reservation Detail Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-90vh overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">Информация о бронировании</h2>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowModal(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Table visualization */}
              <div className="flex justify-center p-3">
                <div className={getIconWidth()}>
                  {renderTableByType({
                    type_name: tableType,
                    table_number: tableNumber,
                    maxGuests: reservation.guests_count,
                    isReserved: false
                  })}
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Детали бронирования</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-gray-600">Дата:</div>
                  <div className="font-medium">{formattedDate}</div>
                  
                  <div className="text-gray-600">Время:</div>
                  <div className="font-medium">{reservation.reservation_time.substring(0, 5)}</div>
                  
                  <div className="text-gray-600">Длительность:</div>
                  <div className="font-medium">{reservation.duration} 
                    {reservation.duration === 1 ? 'час' : 
                    reservation.duration < 5 ? ' часа' : ' часов'}</div>
                  
                  <div className="text-gray-600">Количество гостей:</div>
                  <div className="font-medium">{reservation.guests_count}</div>
                  
                  <div className="text-gray-600">Стол:</div>
                  <div className="font-medium">{tableName}</div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Контактная информация</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-gray-600">Имя:</div>
                  <div className="font-medium">{reservation.first_name}</div>
                  
                  <div className="text-gray-600">Фамилия:</div>
                  <div className="font-medium">{reservation.last_name}</div>
                  
                  <div className="text-gray-600">Телефон:</div>
                  <div className="font-medium">{reservation.phone}</div>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                  onClick={() => setShowModal(false)}
                >
                  Закрыть
                </button>
                
                {!isPastReservation && (
                  <div className="flex space-x-2">
                    {canEdit && (
                      <button
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        onClick={handleEdit}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span>Изменить</span>
                      </button>
                    )}
                    
                    {canCancel && (
                      <button
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <span>Отмена...</span>
                        ) : (
                          <>
                            <Image 
                              src="/images/cancel-reservation-svgrepo-com.svg" 
                              alt="Cancel" 
                              width={20} 
                              height={20} 
                              className="mr-2"
                            />
                            <span>Отменить</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReservationCard; 
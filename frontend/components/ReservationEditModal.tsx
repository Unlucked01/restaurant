import React, { useState, useEffect } from 'react';
import { reservationsAPI } from '../lib/api';
import { formatPhoneNumber, normalizePhoneNumber, isValidPhoneNumber } from '../lib/formatters';
import { isValidName, VALIDATION_ERRORS } from '../lib/validation';

interface ReservationEditModalProps {
  reservationId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ReservationEditModal: React.FC<ReservationEditModalProps> = ({
  reservationId,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    table_id: '',
    guests_count: 1,
    first_name: '',
    last_name: '',
    phone: '',
    reservation_date: new Date().toISOString().split('T')[0],
    reservation_time: '12:00',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [maxGuests, setMaxGuests] = useState(4);

  useEffect(() => {
    fetchReservationDetails();
    fetchTables();
  }, [reservationId]);

  const fetchReservationDetails = async () => {
    try {
      setLoading(true);
      const response = await reservationsAPI.getReservationById(reservationId);
      const reservation = response.data;
      
      // Format phone number consistently
      const normalizedPhone = reservation.phone.startsWith('+') 
        ? formatPhoneNumber(reservation.phone) 
        : formatPhoneNumber('+7' + reservation.phone.replace(/^8/, ''));
      
      // Get table details to check max guests
      const tableResponse = await reservationsAPI.getAvailability(reservation.reservation_date);
      const tables = tableResponse.data;
      
      // Find the selected table
      const selectedTable = tables.find(table => table.table_id === reservation.table_id);
      let minGuests = 1;
      
      if (selectedTable && selectedTable.table_type) {
        setMaxGuests(selectedTable.table_type.default_max_guests);
        minGuests = Math.ceil(selectedTable.table_type.default_max_guests / 2);
      }
      
      setFormData({
        table_id: reservation.table_id,
        guests_count: Math.max(Number(reservation.guests_count), minGuests),
        first_name: reservation.first_name,
        last_name: reservation.last_name,
        phone: normalizedPhone,
        reservation_date: reservation.reservation_date,
        reservation_time: reservation.reservation_time.substring(0, 5),
      });
    } catch (err) {
      console.error('Failed to fetch reservation details:', err);
      setError('Не удалось загрузить данные о бронировании');
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const date = formData.reservation_date;
      const response = await reservationsAPI.getAvailability(date);
      
      const filteredTables = response.data.map(table => {
        // Если это текущий стол бронирования, пометим его как доступный
        if (formData.table_id && table.table_id === formData.table_id) {
          return { ...table, available: true };
        }
        return table;
      });
      
      setTables(filteredTables);
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      // Format the phone number
      const formattedPhone = formatPhoneNumber(value);
      setFormData((prev) => ({
        ...prev,
        [name]: formattedPhone,
      }));
      
      // Clear phone error if the phone is valid
      if (isValidPhoneNumber(formattedPhone) || formattedPhone === '') {
        setPhoneError(null);
      } else if (formattedPhone.length >= 18) {
        // Only show error when user has entered a complete number
        setPhoneError('Введите номер в формате +7 (XXX) XXX-XX-XX');
      }
    } else if (name === 'first_name') {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      
      // Validate first name
      if (value && !isValidName(value)) {
        setFirstNameError(VALIDATION_ERRORS.INVALID_NAME);
      } else {
        setFirstNameError(null);
      }
    } else if (name === 'last_name') {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      
      // Validate last name
      if (value && !isValidName(value)) {
        setLastNameError(VALIDATION_ERRORS.INVALID_NAME);
      } else {
        setLastNameError(null);
      }
    } else if (name === 'table_id') {
      // Find the selected table to get max guests
      const selectedTable = tables.find(table => table.table_id === value);
      let newMaxGuests = maxGuests;
      
      if (selectedTable && selectedTable.table_type) {
        newMaxGuests = selectedTable.table_type.default_max_guests;
        setMaxGuests(newMaxGuests);
      }
      
      // Calculate minimum guests for this table
      const minGuests = Math.ceil(newMaxGuests / 2);
      
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        // If current guests count is less than minimum, update it
        guests_count: prev.guests_count < minGuests ? minGuests : prev.guests_count,
      }));
    } else if (name === 'reservation_date') {
      // Обновляем дату
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      
      // Загружаем доступные столы для новой даты
      try {
        const response = await reservationsAPI.getAvailability(value);
        
        // Фильтруем столы, чтобы включить текущий забронированный стол
        const filteredTables = response.data.map(table => {
          if (formData.table_id && table.table_id === formData.table_id) {
            return { ...table, available: true };
          }
          return table;
        });
        
        setTables(filteredTables);
      } catch (err) {
        console.error('Failed to fetch tables for new date:', err);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number before submission
    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      setPhoneError('Введите корректный номер телефона');
      return;
    }
    
    // Validate names before submission
    if (!isValidName(formData.first_name)) {
      setFirstNameError(VALIDATION_ERRORS.INVALID_NAME);
      return;
    }
    
    if (!isValidName(formData.last_name)) {
      setLastNameError(VALIDATION_ERRORS.INVALID_NAME);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Normalize phone number before sending to API
      const dataToSubmit = {
        ...formData,
        phone: normalizePhoneNumber(formData.phone),
      };
    
      // Update existing reservation
      await reservationsAPI.updateReservation(reservationId, dataToSubmit);
      
      // Close and notify parent
      onSuccess();
    } catch (err: any) {
      console.error('Reservation update failed:', err);
      
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || '';
      console.log('Error message:', errorMsg);
      
      setError(errorMsg || 'Не удалось обновить бронирование. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  // Generate time slots from 12:00 to 23:00 with appropriate filtering for same-day reservations
  const timeSlots = (() => {
    // Get basic time slots
    let slots = Array.from({ length: 12 }, (_, i) => {
      const hour = i + 12;
      return hour < 24 ? `${hour}:00` : null;
    }).filter(Boolean) as string[];
    
    // If today's date is selected, filter out times up to and including current hour
    if (formData.reservation_date === new Date().toISOString().split('T')[0]) {
      const now = new Date();
      const currentHour = now.getHours();
      
      slots = slots.filter(timeSlot => {
        const [hour] = timeSlot.split(':').map(Number);
        return hour > currentHour;
      });
    }
    
    return slots;
  })();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Изменить бронирование</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Столик
              <select
                name="table_id"
                value={formData.table_id}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 mt-1"
                required
              >
                <option value="">Выберите столик</option>
                {tables.map((table) => (
                  <option key={table.table_id} value={table.table_id}>
                    Столик №{table.table_number}
                  </option>
                ))}
              </select>
            </label>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Количество гостей
              <select
                name="guests_count"
                value={formData.guests_count}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 mt-1"
                required
              >
                {Array.from(
                  { length: maxGuests - Math.ceil(maxGuests / 2) + 1 }, 
                  (_, i) => i + Math.ceil(maxGuests / 2)
                ).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </label>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Дата
              <input
                type="date"
                name="reservation_date"
                value={formData.reservation_date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                max={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className="w-full border rounded px-3 py-2 mt-1"
                required
              />
            </label>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Время
              <select
                name="reservation_time"
                value={formData.reservation_time}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 mt-1"
                required
              >
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </label>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Имя
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 mt-1 ${
                  firstNameError ? 'border-red-500' : ''
                }`}
                required
              />
              {firstNameError && (
                <p className="text-red-500 text-xs mt-1">{firstNameError}</p>
              )}
            </label>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Фамилия
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 mt-1 ${
                  lastNameError ? 'border-red-500' : ''
                }`}
                required
              />
              {lastNameError && (
                <p className="text-red-500 text-xs mt-1">{lastNameError}</p>
              )}
            </label>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Телефон
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+7 (___) ___-__-__"
                className={`w-full border rounded px-3 py-2 mt-1 ${
                  phoneError ? 'border-red-500' : ''
                }`}
                required
              />
              {phoneError && (
                <p className="text-red-500 text-xs mt-1">{phoneError}</p>
              )}
            </label>
          </div>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? <span>Загрузка...</span> : <span>Сохранить изменения</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservationEditModal; 
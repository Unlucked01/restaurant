import React, { useState, useEffect } from 'react';
import { reservationsAPI, authAPI } from '../lib/api';
import MenuOrderModal from './MenuOrderModal';
import { useAuth } from '../context/AuthContext';
import { formatPhoneNumber, normalizePhoneNumber, isValidPhoneNumber } from '../lib/formatters';
import { isValidName, VALIDATION_ERRORS } from '../lib/validation';

interface ReservationModalProps {
  tableId: string;
  maxGuests: number;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: string;
  initialTime?: string;
  initialDuration?: number;
  editMode?: boolean;
  reservationId?: string;
}

const ReservationModal: React.FC<ReservationModalProps> = ({
  tableId,
  maxGuests,
  onClose,
  onSuccess,
  initialDate,
  initialTime,
  initialDuration = 1,
  editMode = false,
  reservationId = '',
}) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    table_id: tableId,
    guests_count: Math.ceil(maxGuests / 2),
    first_name: '',
    last_name: '',
    phone: '',
    reservation_date: initialDate || new Date().toISOString().split('T')[0],
    reservation_time: initialTime || '12:00',
    duration: initialDuration,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [reservationComplete, setReservationComplete] = useState(false);
  const [newReservationId, setNewReservationId] = useState<string | null>(null);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [suggestNextDay, setSuggestNextDay] = useState(false);
  const [nextDayDate, setNextDayDate] = useState<string>('');

  // Auto-fill user data when component mounts
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  // Update form data if initialDate or initialTime props change
  useEffect(() => {
    if (initialDate || initialTime || initialDuration) {
      setFormData(prev => ({
        ...prev,
        reservation_date: initialDate || prev.reservation_date,
        reservation_time: initialTime || prev.reservation_time,
        duration: initialDuration || prev.duration,
      }));
    }
  }, [initialDate, initialTime, initialDuration]);

  // Fetch existing reservation data if in edit mode
  useEffect(() => {
    if (editMode && reservationId) {
      fetchReservationDetails();
    }
  }, [editMode, reservationId]);

  // Generate time slots whenever date or duration changes
  useEffect(() => {
    // Get basic time slots
    let slots = Array.from({ length: 12 }, (_, i) => {
      const hour = i + 12;
      return hour < 24 ? `${hour}:00` : null;
    }).filter(Boolean) as string[];
    
    // Only filter past hours if it's actually today
    const currentDate = new Date();
    const today = currentDate.toISOString().split('T')[0];
    
    // Check if the selected date is today
    const isToday = formData.reservation_date === today;
    
    // Only filter times based on current hour if it's actually today
    if (isToday) {
      const currentHour = currentDate.getHours();
      slots = slots.filter(timeSlot => {
        const [hour] = timeSlot.split(':').map(Number);
        return hour > currentHour;
      });
    }
    
    // Filter out slots that don't have enough time before closing (23:00)
    // based on the selected duration
    const maxStartHour = 24 - formData.duration;
    slots = slots.filter(timeSlot => {
      const [hour] = timeSlot.split(':').map(Number);
      return hour <= maxStartHour;
    });
    
    // If no slots are available for the current date, automatically move to the next day
    if (slots.length === 0) {
      // Calculate next day date
      const currentDateObj = new Date(formData.reservation_date);
      currentDateObj.setDate(currentDateObj.getDate() + 1);
      const nextDay = currentDateObj.toISOString().split('T')[0];
      
      // Automatically update to next day
      setFormData(prev => ({
        ...prev,
        reservation_date: nextDay,
        reservation_time: '12:00', // Reset to earliest time
        duration: 1  // Reset to 1 hour to ensure time slots are available
      }));
      
      // Skip setting timeSlots as we're changing the date
      return;
    } else {
      // If current selected time is no longer valid, select the first available time
      if (!slots.includes(formData.reservation_time) && slots.length > 0) {
        setFormData(prev => ({
          ...prev,
          reservation_time: slots[0]
        }));
      }
    }
    
    setTimeSlots(slots);
  }, [formData.reservation_date, formData.duration]);

  const fetchReservationDetails = async () => {
    try {
      setLoading(true);
      const response = await reservationsAPI.getReservationById(reservationId);
      const reservation = response.data;
      
      // Format phone number consistently
      const normalizedPhone = reservation.phone.startsWith('+') 
        ? formatPhoneNumber(reservation.phone) 
        : formatPhoneNumber('+7' + reservation.phone.replace(/^8/, ''));
      
      setFormData({
        table_id: reservation.table_id,
        guests_count: Number(reservation.guests_count), // Ensure it's a number not a string
        first_name: reservation.first_name,
        last_name: reservation.last_name,
        phone: normalizedPhone,
        reservation_date: reservation.reservation_date,
        reservation_time: reservation.reservation_time.substring(0, 5),
        duration: reservation.duration || 1,
      });
    } catch (err) {
      console.error('Failed to fetch reservation details:', err);
      setError('Не удалось загрузить данные о бронировании');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    } else if (name === 'duration') {
      // Make sure duration is stored as a number
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value, 10),
      }));
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
    
    // Validate that there are available time slots and a time is selected
    if (timeSlots.length === 0 || !formData.reservation_time) {
      setError('Нет доступных временных слотов для выбранной даты и продолжительности. Пожалуйста, выберите другую дату или продолжительность.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Normalize phone number before sending to API
      const dataToSubmit = {
        ...formData,
        phone: normalizePhoneNumber(formData.phone),
        duration: Number(formData.duration) // Ensure duration is a number
      };
    
      let response;
      
      if (editMode && reservationId) {
        // Update existing reservation
        response = await reservationsAPI.updateReservation(reservationId, dataToSubmit);
        setNewReservationId(reservationId);
      } else {
        // Create new reservation
        response = await reservationsAPI.createReservation(dataToSubmit);
        setNewReservationId(response.data.id);
      }
      
      setReservationComplete(true);
      
      // Only show menu modal for new reservations, not edits
      if (!editMode) {
        setShowMenuModal(true);
      } else {
        // For edits, just close after success
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Reservation failed:', err);
      
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || '';
      
      // Используем сообщение об ошибке как есть, без дополнительной обработки
      setError(errorMsg || 'Не удалось забронировать столик. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderFromMenu = () => {
    setShowMenuModal(true);
  };

  const handleOrderComplete = () => {
    setShowMenuModal(false);
    onSuccess();
  };

  const handleCloseWithoutOrder = () => {
    onSuccess();
  };

  // Format end time properly
  const getFormattedEndTime = () => {
    if (!formData.reservation_time) return "";
    
    // Parse hour from reservation time, ensuring we get a valid number
    const timeParts = formData.reservation_time.split(':');
    if (timeParts.length < 1) return "";
    
    const startHour = parseInt(timeParts[0], 10);
    if (isNaN(startHour)) return "";
    
    const endHour = startHour + formData.duration;
    return `${endHour}:00`;
  };

  if (showMenuModal && newReservationId) {
    return (
      <MenuOrderModal
        reservationId={newReservationId}
        onClose={() => setShowMenuModal(false)}
        onOrderComplete={handleOrderComplete}
        onSkip={handleCloseWithoutOrder}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        {!reservationComplete ? (
          <>
            <h2 className="text-xl font-bold mb-4">
              {editMode ? 'Изменить бронирование' : 'Забронировать столик'}
            </h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
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
                    disabled={timeSlots.length === 0}
                  >
                    {timeSlots.length > 0 ? (
                      timeSlots.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))
                    ) : (
                      <option value="">Нет доступных слотов</option>
                    )}
                  </select>
                </label>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Продолжительность
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 mt-1"
                    required
                  >
                    {[1, 2, 3, 4, 5, 6].map((hours) => (
                      <option key={hours} value={hours}>
                        {hours} {hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}
                      </option>
                    ))}
                  </select>
                  {timeSlots.length > 0 && formData.reservation_time ? (
                    <div className="text-xs text-gray-500 mt-1">
                      Конец брони: {getFormattedEndTime()}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 mt-1">
                      Выберите доступное время для отображения времени окончания
                    </div>
                  )}
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
                  {loading ? (
                    <span>Загрузка...</span>
                  ) : (
                    <span>{editMode ? 'Сохранить изменения' : 'Забронировать'}</span>
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="text-green-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">
              {editMode ? 'Бронирование обновлено!' : 'Бронирование подтверждено!'}
            </h2>
            <p className="text-gray-600 mb-4">
              {editMode
                ? 'Ваше бронирование успешно обновлено.'
                : 'Столик успешно забронирован. Хотите заказать что-нибудь из меню?'}
            </p>
            
            {!editMode && (
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleOrderFromMenu}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Заказать из меню
                </button>
                <button
                  onClick={handleCloseWithoutOrder}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded"
                >
                  Позже
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservationModal; 
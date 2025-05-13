import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,  // Changed from true to false for CORS
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Error:', error);
    
    if (error.response && error.response.status === 401) {
      // Handle authentication errors
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        console.log('Ошибка аутентификации, перенаправление на страницу входа...');
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData: any) => api.post('/auth/register', userData),
  login: (credentials: any) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
};

// Layout API
export const layoutAPI = {
  getLayout: (roomId?: string) => api.get('/layout/', { params: { room_id: roomId } }),
  saveLayout: (layoutData: any, roomId?: string) => api.post('/layout/save', layoutData, { params: { room_id: roomId } }),
  getTableTypes: () => api.get('/layout/table-types'),
  addTable: (tableData: any, roomId?: string) => api.post('/layout/tables', tableData, { params: { room_id: roomId } }),
  addStaticItem: (itemData: any, roomId?: string) => api.post('/layout/static-items', itemData, { params: { room_id: roomId } }),
  addWall: async (wallData: any, roomId?: string) => {
    const response = await api.post('/layout/walls', wallData, { params: { room_id: roomId } });
    return response;
  },
  clearLayout: async (roomId?: string) => {
    const response = await api.post('/layout/clear', {}, { params: { room_id: roomId } });
    return response;
  },
  getRooms: () => api.get('/layout/rooms'),
  getRoom: (roomId: string) => api.get(`/layout/rooms/${roomId}`),
  createRoom: (roomData: any) => api.post('/layout/rooms', roomData),
  updateRoom: (roomId: string, roomData: any) => api.put(`/layout/rooms/${roomId}`, roomData),
  getOrCreateDefaultRoom: async () => {
    try {
      const { data: rooms } = await api.get('/layout/rooms');
      
      if (rooms && rooms.length > 0) {
        return rooms[0];
      }
      
      const { data: newRoom } = await api.post('/layout/rooms', {
        name: 'Основной зал',
        description: 'Дефолтный зал ресторана'
      });
      
      return newRoom;
    } catch (error) {
      console.error('Ошибка при получении или создании дефолтной комнаты:', error);
      throw error;
    }
  }
};

// Reservations API
export const reservationsAPI = {
  getAvailability: (date: string, time?: string, duration: number = 1) => 
    api.get('/reserve/availability', { params: { date, time, duration } }),
  createReservation: (reservationData: any) => api.post('/reserve', reservationData),
  getMyReservations: () => api.get('/reserve/my'),
  getAllReservations: (date: string) => api.get('/reserve', { params: { date } }),
  getReservationStats: (period?: string) => api.get('/reserve/stats', { params: { period } }),
  getOrderStats: () => api.get('/menu/stats'),
  getReservationById: (id: string) => api.get(`/reserve/${id}`),
  deleteReservation: (id: string) => api.delete(`/reserve/${id}`),
  updateReservation: (id: string, reservationData: any) => api.put(`/reserve/${id}`, reservationData),
  updateReservationStatus: (id: string, status: string) => 
    api.patch(`/reserve/${id}/status`, { status }),
};

// Menu API
export const menuAPI = {
  getMenu: () => api.get('/menu'),
  createCategory: (categoryData: any) => api.post('/menu/categories', categoryData),
  updateCategory: (categoryId: string, categoryData: any) => 
    api.put(`/menu/categories/${categoryId}`, categoryData),
  deleteCategory: (categoryId: string) => api.delete(`/menu/categories/${categoryId}`),
  createMenuItem: (itemData: any) => api.post('/menu/items', itemData),
  updateMenuItem: (itemId: string, itemData: any) => 
    api.put(`/menu/items/${itemId}`, itemData),
  deleteMenuItem: (itemId: string) => api.delete(`/menu/items/${itemId}`),
  addToOrder: (reservationId: string, orderItem: any) => 
    api.post(`/menu/reservations/${reservationId}/order`, orderItem),
};

export default api; 
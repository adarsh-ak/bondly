import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only clear localStorage on 401, but don't auto-redirect
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Let the component handle the redirect logic
      // Don't automatically redirect here
    }
    return Promise.reject(error);
  }
);

/* =====================
   AUTH API
===================== */
export const authAPI = {
  signUp: async (data) => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  signIn: async (data) => {
    const response = await api.post('/auth/signin', data);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

/* =====================
   PROFILE API
===================== */
export const profileAPI = {
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  getUserProfile: async (userId) => {
    const response = await api.get(`/profile/${userId}`);
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/profile', data);
    return response.data;
  },

  updateAvatar: async (avatar) => {
    const response = await api.put('/profile/avatar', { avatar });
    return response.data;
  },

  updateStats: async (stats) => {
    const response = await api.put('/profile/stats', stats);
    return response.data;
  },

  deactivateAccount: async () => {
    const response = await api.delete('/profile');
    return response.data;
  },

  reactivateAccount: async () => {
    const response = await api.post('/profile/reactivate');
    return response.data;
  },

  searchUsers: async (query) => {
    const response = await api.get('/profile/search/users', { params: { q: query } });
    return response.data;
  },
};

/* =====================
   DASHBOARD API
===================== */
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getUpcomingEvents: async () => {
    const response = await api.get('/dashboard/upcoming-events');
    return response.data;
  },

  getFriends: async () => {
    const response = await api.get('/dashboard/friends');
    return response.data;
  },
};

/* =====================
   GROUPS API
===================== */
export const groupsAPI = {
  getGroups: async (params) => {
    const response = await api.get('/groups', { params });
    return response.data;
  },

  getGroup: async (id) => {
    const response = await api.get(`/groups/${id}`);
    return response.data;
  },

  createGroup: async (data) => {
    const response = await api.post('/groups', data);
    return response.data;
  },

  joinGroup: async (id) => {
    const response = await api.post(`/groups/${id}/join`);
    return response.data;
  },

  leaveGroup: async (id) => {
    const response = await api.post(`/groups/${id}/leave`);
    return response.data;
  },

  getUserGroups: async () => {
    const response = await api.get('/groups/user/my-groups');
    return response.data;
  },
};

/* =====================
   EVENTS API
===================== */
export const eventsAPI = {
  getEvents: async (params) => {
    const response = await api.get('/events', { params });
    return response.data;
  },

  getEvent: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  createEvent: async (data) => {
    const response = await api.post('/events', data);
    return response.data;
  },

  updateEvent: async (id, data) => {
    const response = await api.put(`/events/${id}`, data);
    return response.data;
  },

  deleteEvent: async (id) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  joinEvent: async (id, status = 'going') => {
    const response = await api.post(`/events/${id}/join`, { status });
    return response.data;
  },

  leaveEvent: async (id) => {
    const response = await api.post(`/events/${id}/leave`);
    return response.data;
  },

  getGroupEvents: async (groupId, status) => {
    const response = await api.get(`/events/group/${groupId}`, { params: { status } });
    return response.data;
  },

  getUserUpcomingEvents: async () => {
    const response = await api.get('/events/user/upcoming');
    return response.data;
  },

  getCalendarEvents: async (year, month) => {
    const response = await api.get('/events/calendar/month', { params: { year, month } });
    return response.data;
  },
};

export default api;
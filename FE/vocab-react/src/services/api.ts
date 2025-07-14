import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchWords = (params?: any) => api.get('/words', { params });

export const addWord = (data: any) => api.post('/words', data);

export const updateWord = (id: number, data: any) =>
  api.put(`/words/${id}`, data);

export const getWordById = (id: number) =>
  api.get(`/words/${id}`);
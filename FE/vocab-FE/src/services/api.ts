import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://localhost:3000/api',
});

export const addWord = (data: any) => api.post('/words', data);
export const fetchWords = (params: any) => api.get('/words', { params });
export const updateWord = (id: number, data: any) => api.put(`/words/${id}`, data);
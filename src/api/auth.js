import client from './client'

export const signup = (data) => client.post('/api/auth/signup', data)
export const login = (data) => client.post('/api/auth/login', data)
export const getMe = () => client.get('/api/auth/me')
export const refreshSession = (expires_in_minutes) => client.post('/api/auth/refresh', { expires_in_minutes })

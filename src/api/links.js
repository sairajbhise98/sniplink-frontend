import client from './client'

export const createLink = (data) => client.post('/api/links', data)

export const getLinks = (params) => client.get('/api/links', { params })

export const updateLink = (id, data) => client.patch(`/api/links/${id}`, data)

export const deleteLink = (id) => client.delete(`/api/links/${id}`)

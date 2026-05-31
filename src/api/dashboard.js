import client from './client'

export const getTotalLinks  = () => client.get('/api/dashboard/stats/total-links')
export const getTotalClicks = () => client.get('/api/dashboard/stats/total-clicks')
export const getActiveLinks = () => client.get('/api/dashboard/stats/active-links')
export const getClickRate   = () => client.get('/api/dashboard/stats/click-rate')
export const getRecentLinks = () => client.get('/api/dashboard/recent-links')

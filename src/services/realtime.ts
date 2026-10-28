import type Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { api } from '@/services/api'

let echo: Echo<'reverb'> | null = null

export async function subscribeToNotifications(userId: string, onNotification: () => void): Promise<() => void> {
  const key = import.meta.env.VITE_REVERB_APP_KEY
  const host = import.meta.env.VITE_REVERB_HOST
  if (!key || !host || import.meta.env.VITE_REVERB_ENABLED !== 'true') return () => {}

  // Echo expects a global Pusher constructor for the Reverb protocol.
  window.Pusher = Pusher
  const { default: EchoClient } = await import('laravel-echo')
  if (!echo) {
    echo = new EchoClient({
      broadcaster: 'reverb',
      key,
      wsHost: host,
      wsPort: Number(import.meta.env.VITE_REVERB_PORT || 80),
      wssPort: Number(import.meta.env.VITE_REVERB_PORT || 443),
      forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
      enabledTransports: import.meta.env.VITE_REVERB_SCHEME === 'https' ? ['wss'] : ['ws'],
      // Use the same Axios instance as the Sanctum-authenticated REST API.
      authorizer: (channel: { name: string }) => ({
        authorize: (socketId: string, callback: (error: Error | null, data: unknown) => void) => {
          api.post('/broadcasting/auth', { socket_id: socketId, channel_name: channel.name }, {
            baseURL: api.defaults.baseURL?.replace(/\/api\/?$/, ''),
          }).then(response => callback(null, response.data))
            .catch(error => callback(error, null))
        },
      }),
    })
  }
  const channelName = `App.Models.User.${userId}`
  echo.private(channelName).notification(onNotification)
  return () => { echo?.leave(channelName) }
}

// TS declaration for Pusher's Echo global dependency.
declare global {
  interface Window { Pusher: typeof Pusher }
}

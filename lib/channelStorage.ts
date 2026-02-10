// Channel Storage Utilities for YouTube Channel Management

interface YouTubeChannel {
  id: string
  title: string
  thumbnail?: string
  subscriberCount?: string
  videoCount?: string
  viewCount?: string
  description?: string
  customUrl?: string
  publishedAt?: string
}

/**
 * Save primary (main) channel to localStorage
 */
export const savePrimaryChannelToLocalStorage = (channel: YouTubeChannel) => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('youtube_channel', JSON.stringify(channel))
    localStorage.setItem('youtube_channel_id', channel.id)
    console.log('✅ Primary channel saved:', channel.id)
  } catch (err) {
    console.error('❌ Error saving primary channel:', err)
  }
}

/**
 * Get primary (main) channel from localStorage
 */
export const getPrimaryChannelFromLocalStorage = (): YouTubeChannel | null => {
  if (typeof window === 'undefined') return null
  
  try {
    const channelData = localStorage.getItem('youtube_channel')
    return channelData ? JSON.parse(channelData) : null
  } catch (err) {
    console.error('❌ Error getting primary channel:', err)
    return null
  }
}

/**
 * Save all channels (including additional channels) to localStorage
 */
export const saveAllChannelsToLocalStorage = (channels: YouTubeChannel[]) => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('youtube_channels', JSON.stringify(channels))
    
    // Also save the first channel as primary if no primary exists
    if (channels.length > 0 && !localStorage.getItem('youtube_channel')) {
      savePrimaryChannelToLocalStorage(channels[0])
    }
    
    console.log('✅ All channels saved:', channels.length)
  } catch (err) {
    console.error('❌ Error saving all channels:', err)
  }
}

/**
 * Get all channels from localStorage
 */
export const getAllChannelsFromLocalStorage = (): YouTubeChannel[] => {
  if (typeof window === 'undefined') return []
  
  try {
    const channelsData = localStorage.getItem('youtube_channels')
    return channelsData ? JSON.parse(channelsData) : []
  } catch (err) {
    console.error('❌ Error getting all channels:', err)
    return []
  }
}

/**
 * Get channel with caching - tries localStorage first, then optionally fetches from API
 */
export const getChannelWithCache = async (channelId?: string): Promise<YouTubeChannel | null> => {
  if (typeof window === 'undefined') return null
  
  try {
    // Try to get primary channel from cache
    let channel = getPrimaryChannelFromLocalStorage()
    
    // If specific channel ID requested, search in all channels
    if (channelId && !channel) {
      const allChannels = getAllChannelsFromLocalStorage()
      channel = allChannels.find(ch => ch.id === channelId) || null
    }
    
    if (channel) {
      console.log('✅ Channel found in cache:', channel.id)
      return channel
    }
    
    // If no cache found and we have a channel ID, try to fetch from API
    if (channelId) {
      try {
        const response = await fetch(`/api/youtube/channels?channelId=${channelId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.channel) {
            savePrimaryChannelToLocalStorage(data.channel)
            return data.channel
          }
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch channel from API:', err)
      }
    }
    
    return null
  } catch (err) {
    console.error('❌ Error getting channel with cache:', err)
    return null
  }
}

/**
 * Clear all channel data from localStorage
 */
export const clearChannelStorage = () => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem('youtube_channel')
    localStorage.removeItem('youtube_channel_id')
    localStorage.removeItem('youtube_channels')
    console.log('✅ Channel storage cleared')
  } catch (err) {
    console.error('❌ Error clearing channel storage:', err)
  }
}

/**
 * Check if channels are cached
 */
export const isChannelsCached = (): boolean => {
  if (typeof window === 'undefined') return false
  
  return !!(localStorage.getItem('youtube_channel') || localStorage.getItem('youtube_channels'))
}

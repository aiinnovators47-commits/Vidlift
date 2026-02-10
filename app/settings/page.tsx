"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import SharedSidebar from '@/components/shared-sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import dynamic from 'next/dynamic'
import { Youtube, Plus, Check, X, Loader2, Settings, Bell, Mail, Lock, Zap, MoreVertical, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import { savePrimaryChannelToLocalStorage, saveAllChannelsToLocalStorage, getPrimaryChannelFromLocalStorage } from '@/lib/channelStorage'

const NotificationBell = dynamic(() => import('@/components/notification-bell'), { ssr: false })

interface YouTubeChannel {
  id: string
  title: string
  description?: string
  thumbnail: string
  subscriberCount: string
  videoCount: string
  viewCount: string
  customUrl?: string
}

interface ConnectedChannel {
  id: string
  title: string
  thumbnail: string
  subscriberCount: string
  isPrimary: boolean
  connectedAt: string
  isActive: boolean
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [activeTab, setActiveTab] = useState('channels')
  
  // Channel management states
  const [connectedChannels, setConnectedChannels] = useState<ConnectedChannel[]>([])
  const [primaryChannel, setPrimaryChannel] = useState<YouTubeChannel | null>(null)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectStep, setConnectStep] = useState<'start' | 'loading' | 'success'>('start')
  const [selectedChannelToRemove, setSelectedChannelToRemove] = useState<string | null>(null)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [channelMenuOpen, setChannelMenuOpen] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  
  // Settings states
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(true)
  const [autoRetry, setAutoRetry] = useState(true)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Load connected channels on mount
  useEffect(() => {
    const loadChannels = async () => {
      try {
        const primary = getPrimaryChannelFromLocalStorage()
        if (primary) {
          setPrimaryChannel(primary)
          
          // Create mock connected channels
          const channels: ConnectedChannel[] = [
            {
              id: primary.id,
              title: primary.title,
              thumbnail: primary.thumbnail,
              subscriberCount: primary.subscriberCount,
              isPrimary: true,
              connectedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 30 days ago
              isActive: true
            }
          ]
          
          setConnectedChannels(channels)
        }
      } catch (error) {
        console.error('Error loading channels:', error)
      }
    }

    loadChannels()
  }, [])

  // Click outside handler for menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setChannelMenuOpen(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleConnectChannel = async () => {
    setIsConnecting(true)
    setConnectStep('loading')

    try {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real app, this would open OAuth flow
      // For now, show success message
      setConnectStep('success')
      
      setTimeout(() => {
        setShowConnectModal(false)
        setConnectStep('start')
        setIsConnecting(false)
      }, 1500)
    } catch (error) {
      console.error('Connection error:', error)
      setIsConnecting(false)
    }
  }

  const handleRemoveChannel = async () => {
    if (!selectedChannelToRemove) return
    
    setIsRemoving(true)
    try {
      // Remove from connected channels
      setConnectedChannels(prev => 
        prev.filter(ch => ch.id !== selectedChannelToRemove)
      )
      
      setShowRemoveConfirm(false)
      setSelectedChannelToRemove(null)
    } catch (error) {
      console.error('Error removing channel:', error)
    } finally {
      setIsRemoving(false)
    }
  }

  const handleSetPrimary = async (channelId: string) => {
    try {
      setConnectedChannels(prev =>
        prev.map(ch => ({
          ...ch,
          isPrimary: ch.id === channelId
        }))
      )
      setChannelMenuOpen(null)
    } catch (error) {
      console.error('Error setting primary channel:', error)
    }
  }

  const formatNumber = (num: string | number | undefined): string => {
    if (!num && num !== 0) return "0"
    const n = typeof num === "string" ? parseInt(num) : num
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M"
    if (n >= 1000) return (n / 1000).toFixed(1) + "K"
    return n.toString()
  }

  const handleSaveSettings = () => {
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Sidebar */}
      <SharedSidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
        activePage="settings"
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen || !sidebarCollapsed ? 'md:ml-80' : 'md:ml-20'}`}>
        {/* Header */}
        <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between p-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your channels and preferences</p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-w-7xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2">
                <TabsTrigger value="channels" className="flex items-center gap-2">
                  <Youtube className="w-4 h-4" />
                  <span className="hidden sm:inline">Channels</span>
                </TabsTrigger>
                <TabsTrigger value="general" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">General</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">Notifications</span>
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Email</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span className="hidden sm:inline">Security</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Channels Tab */}
            <TabsContent value="channels" className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Connected Channels</h2>
                    <p className="text-sm text-gray-600 mt-1">Manage your YouTube channels and set your primary channel</p>
                  </div>
                  <Button 
                    onClick={() => setShowConnectModal(true)}
                    className="bg-linear-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-lg flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Channel
                  </Button>
                </div>

                {/* Connected Channels Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {connectedChannels.map(channel => (
                    <Card key={channel.id} className={`border-2 transition-all hover:shadow-lg ${channel.isPrimary ? 'border-sky-500 bg-sky-50/30' : 'border-gray-200 hover:border-sky-300'}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <Avatar className="w-12 h-12 border-2 border-sky-200">
                              <AvatarImage src={channel.thumbnail} alt={channel.title} />
                              <AvatarFallback>{channel.title[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-lg truncate">{channel.title}</CardTitle>
                                {channel.isPrimary && (
                                  <Badge className="bg-sky-500 text-white shrink-0">Primary</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">Connected {channel.connectedAt}</p>
                            </div>
                          </div>
                          
                          {/* Menu */}
                          <div className="relative" ref={menuRef}>
                            <button
                              onClick={() => setChannelMenuOpen(channelMenuOpen === channel.id ? null : channel.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-600" />
                            </button>
                            
                            {channelMenuOpen === channel.id && (
                              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-max">
                                {!channel.isPrimary && (
                                  <button
                                    onClick={() => handleSetPrimary(channel.id)}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
                                  >
                                    <Check className="w-4 h-4" />
                                    Set as Primary
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedChannelToRemove(channel.id)
                                    setShowRemoveConfirm(true)
                                    setChannelMenuOpen(null)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-blue-50 rounded-lg p-2">
                            <p className="text-xs text-gray-600">Subscribers</p>
                            <p className="text-sm font-bold text-blue-600">{formatNumber(channel.subscriberCount)}</p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-2">
                            <p className="text-xs text-gray-600">Videos</p>
                            <p className="text-sm font-bold text-purple-600">-</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2">
                            <p className="text-xs text-gray-600">Status</p>
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <span className="text-xs font-semibold text-green-600">Active</span>
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          className="w-full border-gray-300 hover:bg-gray-50"
                        >
                          View Channel
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Configure basic application preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-blue-900">Auto-Retry Uploads</p>
                      <p className="text-sm text-blue-800 mt-1">Automatically retry failed uploads after 5 minutes</p>
                    </div>
                    <div className="ml-auto">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={autoRetry} onChange={(e) => setAutoRetry(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Choose how you want to be notified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="font-semibold text-gray-900">Push Notifications</p>
                      <p className="text-sm text-gray-600 mt-1">Get notified about important updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={pushNotifications} onChange={(e) => setPushNotifications(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="font-semibold text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-600 mt-1">Receive email updates and alerts</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="font-semibold text-gray-900">Weekly Digest</p>
                      <p className="text-sm text-gray-600 mt-1">Get a weekly summary of your analytics</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={weeklyDigest} onChange={(e) => setWeeklyDigest(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>

                  <Button onClick={handleSaveSettings} className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-lg">
                    {saveSuccess ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Saved successfully
                      </span>
                    ) : (
                      'Save Preferences'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Email Tab */}
            <TabsContent value="email" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Email Settings</CardTitle>
                  <CardDescription>Manage your email preferences and subscriptions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="font-semibold text-amber-900">Email Status</p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <p className="text-sm text-amber-800">Verified: {session?.user?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="email-address" className="text-gray-900">Primary Email Address</Label>
                    <Input 
                      id="email-address"
                      type="email" 
                      value={session?.user?.email || ''} 
                      disabled
                      className="bg-gray-50 border-gray-300"
                    />
                    <p className="text-xs text-gray-500">This is your primary email address</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Keep your account secure and protected</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="font-semibold text-green-900">Account Status</p>
                    </div>
                    <p className="text-sm text-green-800 mt-2">Your account is secure and connected via OAuth 2.0</p>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Connected Applications</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Youtube className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="font-semibold text-gray-900">YouTube</p>
                          <p className="text-sm text-gray-600">Connected via OAuth 2.0</p>
                        </div>
                      </div>
                      <Badge className="bg-green-500">Connected</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Connect Channel Modal */}
      <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-600" />
              Connect YouTube Channel
            </DialogTitle>
            <DialogDescription>
              {connectStep === 'start' && 'Authorize access to your YouTube channel'}
              {connectStep === 'loading' && 'Connecting your channel...'}
              {connectStep === 'success' && 'Channel connected successfully'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {connectStep === 'start' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    You'll be redirected to authorize access to your YouTube channel. We'll never share your information with third parties.
                  </p>
                </div>
              </div>
            )}

            {connectStep === 'loading' && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-sky-500 animate-spin mb-3" />
                <p className="text-sm text-gray-600">Connecting your channel...</p>
              </div>
            )}

            {connectStep === 'success' && (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="w-8 h-8 text-green-500 mb-3" />
                <p className="text-sm text-gray-900 font-semibold">Channel connected successfully!</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowConnectModal(false)}
              className="flex-1"
              disabled={isConnecting}
            >
              Cancel
            </Button>
            {connectStep === 'start' && (
              <Button 
                onClick={handleConnectChannel}
                className="flex-1 bg-sky-500 hover:bg-sky-600 text-white"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Authorize Channel'
                )}
              </Button>
            )}
            {connectStep === 'success' && (
              <Button 
                onClick={() => setShowConnectModal(false)}
                className="flex-1 bg-sky-500 hover:bg-sky-600 text-white"
              >
                Done
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Channel Confirmation */}
      <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <DialogContent className="sm:max-w-sm rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Remove Channel
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this channel? You can add it back later.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowRemoveConfirm(false)}
              className="flex-1"
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRemoveChannel}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={isRemoving}
            >
              {isRemoving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Remove'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

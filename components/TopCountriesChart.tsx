'use client'

import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface CountryData {
  country: string
  views: number
}

const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe']

export function TopCountriesChart({ channelId }: { channelId: string }) {
  const [countries, setCountries] = useState<CountryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTopCountries = async () => {
      try {
        setLoading(true)
        setError(null)
        
        if (typeof window === 'undefined') return
        
        // Server resolves and refreshes token securely
        const response = await fetch(`/api/youtube/analytics/topCountries?channelId=${channelId}`)
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch analytics data')
        }
        
        setCountries(data.countries || [])
      } catch (err) {
        console.error('Error fetching top countries:', err)
        setError(err instanceof Error ? err.message : 'Failed to load country data')
      } finally {
        setLoading(false)
      }
    }
    
    if (channelId) {
      fetchTopCountries()
    }
  }, [channelId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Countries (Last 365 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Countries (Last 365 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-2">Error loading data</p>
            <p className="text-sm text-gray-500">{error}</p>
            <p className="text-xs text-gray-400 mt-2">Connect owner access token to fetch analytics.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (countries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Countries (Last 365 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">No country data available</p>
            <p className="text-sm text-gray-400 mt-2">Connect owner access token to fetch analytics.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate total views and average
  const totalViews = countries.reduce((sum, country) => sum + country.views, 0)
  const avgViews = Math.round(totalViews / countries.length)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Countries (Last 365 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={countries}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="country" 
                width={50}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value) => [`${value} views`, '']}
                labelFormatter={(label) => `Country: ${label}`}
              />
              <Bar dataKey="views" name="Views">
                {countries.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <p className="text-sm text-blue-800 font-medium">Total Views</p>
            <p className="text-2xl font-bold text-blue-900">{totalViews.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <p className="text-sm text-green-800 font-medium">Average Views per Country</p>
            <p className="text-2xl font-bold text-green-900">{avgViews.toLocaleString()}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <p className="text-sm text-purple-800 font-medium">Top Country</p>
            <p className="text-2xl font-bold text-purple-900">{countries[0]?.country || 'N/A'}</p>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="font-medium text-gray-900 mb-2">Country Rankings</h3>
          <div className="space-y-2">
            {countries.map((country, index) => (
              <div key={country.country} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
                  <span className="text-sm font-medium text-gray-900 ml-2">{country.country}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {country.views.toLocaleString()} views ({((country.views / totalViews) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
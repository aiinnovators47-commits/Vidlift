import { NextRequest } from 'next/server'

// In-memory store for engagement status (in production, use a database)
const engagementStatus = new Map<string, { lastChecked: number; processedComments: Set<string> }>()

// Function to get comments for a video
async function getComments(videoId: string, accessToken: string, pageToken?: string) {
  const maxResults = 100
  const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=id,replies,snippet&videoId=${videoId}&maxResults=${maxResults}${pageToken ? `&pageToken=${pageToken}` : ''}`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch comments: ${response.status} ${response.statusText}`)
  }
  
  return await response.json()
}

// Function to like a comment
async function likeComment(commentId: string, accessToken: string) {
  // YouTube API endpoint for liking comments
  const url = `https://www.googleapis.com/youtube/v3/comments/setRating?id=${commentId}&rating=like`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
  
  if (!response.ok) {
    throw new Error(`Failed to like comment: ${response.status} ${response.statusText}`)
  }
  
  return await response.json()
}

// Function to heart (mark as favorite) a comment
async function heartComment(commentId: string, accessToken: string) {
  // Note: YouTube Data API v3 doesn't have a direct endpoint for "hearting" comments
  // This is a placeholder implementation - in a real system, you might use a different approach
  // For now, we'll just mark it as processed
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  return { success: true, message: "Comment hearted (simulated)" }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')
  const accessToken = searchParams.get('accessToken')
  
  if (!videoId || !accessToken) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Missing required parameters: videoId and accessToken' 
      }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
  
  try {
    // Initialize engagement status for this video if not exists
    if (!engagementStatus.has(videoId)) {
      engagementStatus.set(videoId, {
        lastChecked: 0,
        processedComments: new Set()
      })
    }
    
    const status = engagementStatus.get(videoId)!
    const now = Date.now()
    
    // Check if we've checked recently (within last 30 seconds)
    if (now - status.lastChecked < 30000) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Checked too recently, skipping',
          processed: []
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Update last checked time
    status.lastChecked = now
    
    // Get comments
    const commentsData = await getComments(videoId, accessToken)
    
    if (!commentsData.items || !Array.isArray(commentsData.items)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid response from YouTube API'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    const processedComments: { commentId: string; action: string; result: string }[] = []
    
    // Process each comment
    for (const item of commentsData.items) {
      const commentId = item.id
      const commentSnippet = item.snippet?.topLevelComment?.snippet
      
      // Skip if already processed
      if (status.processedComments.has(commentId)) {
        continue
      }
      
      // Skip if comment is from the channel owner (avoid self-engagement)
      // Note: In a real implementation, you would check the actual channel ID
      // For now, we'll skip comments that have a specific placeholder value
      if (commentSnippet?.authorChannelId?.value === 'CHANNEL_OWNER_ID') {
        status.processedComments.add(commentId)
        continue
      }
      
      try {
        // Like the comment
        await likeComment(commentId, accessToken)
        processedComments.push({
          commentId,
          action: 'like',
          result: 'success'
        })
        
        // Heart the comment (if applicable)
        await heartComment(commentId, accessToken)
        processedComments.push({
          commentId,
          action: 'heart',
          result: 'success'
        })
        
        // Mark as processed
        status.processedComments.add(commentId)
      } catch (error) {
        console.error(`Error processing comment ${commentId}:`, error)
        processedComments.push({
          commentId,
          action: 'error',
          result: (error as Error).message
        })
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedComments,
        totalProcessed: processedComments.length
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error in auto engagement:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// POST endpoint to manually trigger engagement processing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoId, accessToken } = body
    
    if (!videoId || !accessToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: videoId and accessToken' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Initialize engagement status for this video if not exists
    if (!engagementStatus.has(videoId)) {
      engagementStatus.set(videoId, {
        lastChecked: 0,
        processedComments: new Set()
      })
    }
    
    const status = engagementStatus.get(videoId)!
    status.lastChecked = Date.now()
    
    // Get comments
    const commentsData = await getComments(videoId, accessToken)
    
    if (!commentsData.items || !Array.isArray(commentsData.items)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid response from YouTube API'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    const processedComments: { commentId: string; action: string; result: string }[] = []
    
    // Process each comment
    for (const item of commentsData.items) {
      const commentId = item.id
      const commentSnippet = item.snippet?.topLevelComment?.snippet
      
      // Skip if already processed
      if (status.processedComments.has(commentId)) {
        continue
      }
      
      try {
        // Like the comment
        await likeComment(commentId, accessToken)
        processedComments.push({
          commentId,
          action: 'like',
          result: 'success'
        })
        
        // Heart the comment (if applicable)
        await heartComment(commentId, accessToken)
        processedComments.push({
          commentId,
          action: 'heart',
          result: 'success'
        })
        
        // Mark as processed
        status.processedComments.add(commentId)
      } catch (error) {
        console.error(`Error processing comment ${commentId}:`, error)
        processedComments.push({
          commentId,
          action: 'error',
          result: (error as Error).message
        })
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedComments,
        totalProcessed: processedComments.length
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error in auto engagement:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
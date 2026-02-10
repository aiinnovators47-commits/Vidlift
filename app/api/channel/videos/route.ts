import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const channelId = searchParams.get('channelId');

    if (!channelId) {
      return NextResponse.json(
        { error: 'channelId is required' },
        { status: 400 }
      );
    }

    // Get the user's access token for authenticated requests
    const accessToken = (session as any).accessToken;
    const apiKey = process.env.YOUTUBE_API_KEY;

    const maxResults = searchParams.get('maxResults') || '50';
    const pageToken = searchParams.get('pageToken') || '';

    // Step 1: Fetch videos
    let videosListData;
    
    if (accessToken) {
      // Use OAuth token (can fetch private and unlisted videos)
      const videosListResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status,statistics&forMine=true&maxResults=${maxResults}&pageToken=${pageToken}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!videosListResponse.ok) {
        const errorData = await videosListResponse.json().catch(() => ({}));
        console.error('YouTube API error with token:', videosListResponse.status, errorData);
        // Fall back to API key if token fails
        if (!apiKey) {
          throw new Error(`Failed to fetch videos and no API key available`);
        }
      } else {
        videosListData = await videosListResponse.json();
      }
    }

    // Fall back to API key if no token or token failed
    if (!videosListData && apiKey) {
      console.log('Using API key fallback for channel:', channelId);
      
      // Get the channel's uploads playlist
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
      );

      if (!channelResponse.ok) {
        throw new Error('Failed to fetch channel details');
      }

      const channelData = await channelResponse.json();
      
      if (!channelData.items || channelData.items.length === 0) {
        return NextResponse.json(
          { error: 'Channel not found' },
          { status: 404 }
        );
      }

      const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

      // Get videos from uploads playlist
      const playlistResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&pageToken=${pageToken}&key=${apiKey}`
      );

      if (!playlistResponse.ok) {
        throw new Error('Failed to fetch playlist items');
      }

      const playlistData = await playlistResponse.json();

      // Get video statistics and full details
      const videoIds = playlistData.items.map((item: any) => item.contentDetails.videoId).join(',');
      
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,status,snippet&id=${videoIds}&key=${apiKey}`
      );

      if (!videosResponse.ok) {
        throw new Error('Failed to fetch video statistics');
      }

      const videosData = await videosResponse.json();

      // Combine data
      const videos = playlistData.items.map((item: any) => {
        const videoStats = videosData.items.find((v: any) => v.id === item.contentDetails.videoId);
        
        return {
          id: item.contentDetails.videoId,
          title: item.snippet.title,
          description: item.snippet.description || '',
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
          publishedAt: item.snippet.publishedAt,
          views: videoStats?.statistics?.viewCount || '0',
          likes: videoStats?.statistics?.likeCount || '0',
          comments: videoStats?.statistics?.commentCount || '0',
          duration: videoStats?.contentDetails?.duration || 'PT0S',
          privacyStatus: videoStats?.status?.privacyStatus || 'public',
        };
      });

      return NextResponse.json({
        videos,
        nextPageToken: playlistData.nextPageToken || null,
        totalResults: playlistData.pageInfo?.totalResults || 0,
      });
    }

    if (!videosListData) {
      throw new Error('No YouTube access token or API key available');
    }

    // Step 2: Process videos from OAuth response
    const videos = videosListData.items?.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description || '',
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      publishedAt: item.snippet.publishedAt,
      views: item.statistics?.viewCount || '0',
      likes: item.statistics?.likeCount || '0',
      comments: item.statistics?.commentCount || '0',
      duration: item.contentDetails?.duration || 'PT0S',
      privacyStatus: item.status?.privacyStatus || 'public',
    })) || [];

    return NextResponse.json({
      videos,
      nextPageToken: videosListData.nextPageToken || null,
      totalResults: videosListData.pageInfo?.totalResults || 0,
    });

  } catch (error: any) {
    console.error('Error fetching channel videos:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

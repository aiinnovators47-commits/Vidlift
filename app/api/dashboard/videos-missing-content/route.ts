import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/videos-missing-content
// Fetch videos from connected channels that are missing tags or descriptions
export async function GET(req: Request) {
  try {
    const supabase = createServerSupabaseClient();
    
    // First, get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's connected channels
    const { data: channels, error: channelError } = await supabase
      .from('channels')
      .select('id, channel_id, channel_title, channel_data')
      .eq('user_id', user.id);

    if (channelError) {
      console.error('Error fetching channels:', channelError);
      return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
    }

    if (!channels || channels.length === 0) {
      return NextResponse.json({ videos: [] });
    }

    // For each channel, we need to fetch videos that are missing tags or descriptions
    // This would typically involve calling the YouTube API to get video details
    // Since we don't have direct access to YouTube API here, we'll simulate this
    // by checking our database for videos that have empty tags or descriptions
    
    let allMissingContentVideos = [];
    
    // In a real implementation, you would fetch videos from YouTube API for each channel
    // and compare with your database to find missing tags/descriptions
    for (const channel of channels) {
      // This is a simplified version - in reality, you'd need to:
      // 1. Fetch videos from the YouTube channel via API
      // 2. Check which ones are missing tags/descriptions in your DB
      // 3. Return those videos
      
      const { data: videos, error: videosError } = await supabase
        .from('channel_videos')
        .select(`
          id,
          video_id,
          title,
          description,
          tags,
          thumbnail_url,
          published_at,
          channel_id,
          tags_suggestions,
          description_suggestions
        `)
        .eq('channel_id', channel.id)
        .or('tags.is.null,array_length(tags, 1).is.null,tags.eq.{}')
        .or('description.is.null,description.eq.')
        .order('published_at', { ascending: false });

      if (videosError) {
        console.error(`Error fetching videos for channel ${channel.channel_id}:`, videosError);
        continue;
      }

      if (videos && videos.length > 0) {
        allMissingContentVideos.push(...videos);
      }
    }

    // Return videos that are missing either tags or descriptions
    return NextResponse.json({ 
      success: true,
      videos: allMissingContentVideos,
      count: allMissingContentVideos.length
    });

  } catch (error) {
    console.error('Error in videos-missing-content API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
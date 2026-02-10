'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Tag, 
  ExternalLink, 
  Loader2, 
  Sparkles,
  PlayIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface MissingTagsVideo {
  id: string;
  video_id: string;
  title: string;
  tags: string[] | null;
  thumbnail_url: string;
  published_at: string;
  channel_id: string;
  tags_suggestions?: string[];
}

export default function AddMissingTagsCard() {
  const [videos, setVideos] = useState<MissingTagsVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestionsLoading, setSuggestionsLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchMissingTagsVideos();
  }, []);

  const fetchMissingTagsVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/videos-missing-content?contentType=tags');
      
      if (!response.ok) {
        throw new Error('Failed to fetch videos with missing tags');
      }
      
      const data = await response.json();
      // Filter to only include videos with missing tags
      const videosWithMissingTags = data.videos.filter(
        (video: MissingTagsVideo) => !video.tags || video.tags.length === 0
      );
      setVideos(videosWithMissingTags);
    } catch (error) {
      console.error('Error fetching videos with missing tags:', error);
      toast.error('Failed to load videos with missing tags');
    } finally {
      setLoading(false);
    }
  };

  const generateTagSuggestions = async (videoId: string) => {
    try {
      setSuggestionsLoading(prev => ({ ...prev, [videoId]: true }));
      
      // In a real implementation, this would call an AI service to generate tag suggestions
      // For now, we'll simulate this with a mock response
      const response = await fetch(`/api/ai/tags?videoId=${videoId}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate tag suggestions');
      }
      
      const data = await response.json();
      
      // Update the video with the new suggestions
      setVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { ...video, tags_suggestions: data.tags }
          : video
      ));
      
      toast.success('Tag suggestions generated successfully!');
    } catch (error) {
      console.error('Error generating tag suggestions:', error);
      toast.error('Failed to generate tag suggestions');
    } finally {
      setSuggestionsLoading(prev => ({ ...prev, [videoId]: false }));
    }
  };

  const handleApplyTags = (video: MissingTagsVideo) => {
    // This would open a modal or navigate to the video editing page
    // where the user can apply the suggested tags
    toast.info('Opening video for tag editing...');
    console.log('Applying tags for video:', video);
  };

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-500" />
            Missing Tags
          </CardTitle>
          <CardDescription>
            Videos from your connected channels that need tags
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-2 border rounded-md">
                <Skeleton className="h-16 w-24 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (videos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-500" />
            Missing Tags
          </CardTitle>
          <CardDescription>
            All your videos have tags!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Great job! All videos from your connected channels have tags applied.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-blue-500" />
          Missing Tags
        </CardTitle>
        <CardDescription>
          {videos.length} video{videos.length !== 1 ? 's' : ''} from your connected channels need tags
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {videos.slice(0, 5).map((video) => (
            <div key={video.id} className="flex items-start space-x-4 p-3 border rounded-md hover:bg-muted/50 transition-colors">
              <div className="relative flex-shrink-0">
                <img
                  src={video.thumbnail_url || '/placeholder-video.jpg'}
                  alt={video.title}
                  className="w-24 h-16 object-cover rounded-md"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-md">
                  <PlayIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{video.title || 'Untitled Video'}</h3>
                <p className="text-xs text-muted-foreground">
                  {new Date(video.published_at).toLocaleDateString()}
                </p>
                
                <div className="mt-2">
                  <Badge variant="outline" className="border-destructive/50 text-destructive">
                    <Tag className="h-3 w-3 mr-1" />
                    Missing Tags
                  </Badge>
                </div>
                
                <div className="mt-3 flex items-center gap-2">
                  {video.tags_suggestions ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApplyTags(video)}
                        className="h-8"
                      >
                        Apply Tags
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`https://youtu.be/${video.video_id}`, '_blank')}
                        className="h-8"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={() => generateTagSuggestions(video.id)}
                        disabled={suggestionsLoading[video.id]}
                        className="h-8"
                      >
                        {suggestionsLoading[video.id] ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3 mr-1" />
                            Generate AI Tags
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`https://youtu.be/${video.video_id}`, '_blank')}
                        className="h-8"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {videos.length > 5 && (
            <p className="text-sm text-muted-foreground mt-2">
              Showing 5 of {videos.length} videos with missing tags
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
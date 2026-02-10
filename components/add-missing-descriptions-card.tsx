'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Tag, 
  FileText, 
  ExternalLink, 
  Loader2, 
  Sparkles,
  PlayIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface MissingContentVideo {
  id: string;
  video_id: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  thumbnail_url: string;
  published_at: string;
  channel_id: string;
  tags_suggestions?: string[];
  description_suggestions?: string[];
}

export default function AddMissingDescriptionsCard() {
  const [videos, setVideos] = useState<MissingContentVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestionsLoading, setSuggestionsLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchMissingContentVideos();
  }, []);

  const fetchMissingContentVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/videos-missing-content');
      
      if (!response.ok) {
        throw new Error('Failed to fetch videos with missing content');
      }
      
      const data = await response.json();
      setVideos(data.videos || []);
    } catch (error) {
      console.error('Error fetching missing content videos:', error);
      toast.error('Failed to load videos with missing content');
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async (videoId: string) => {
    try {
      setSuggestionsLoading(prev => ({ ...prev, [videoId]: true }));
      
      // In a real implementation, this would call an AI service to generate suggestions
      // For now, we'll simulate this with a mock response
      const response = await fetch(`/api/ai/suggestions?videoId=${videoId}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }
      
      const data = await response.json();
      
      // Update the video with the new suggestions
      setVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { ...video, tags_suggestions: data.tags, description_suggestions: data.description }
          : video
      ));
      
      toast.success('Suggestions generated successfully!');
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast.error('Failed to generate suggestions');
    } finally {
      setSuggestionsLoading(prev => ({ ...prev, [videoId]: false }));
    }
  };

  const handleApplySuggestions = (video: MissingContentVideo) => {
    // This would open a modal or navigate to the video editing page
    // where the user can apply the suggested tags/description
    toast.info('Opening video for tag/description editing...');
    console.log('Applying suggestions for video:', video);
  };

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Missing Tags & Descriptions
          </CardTitle>
          <CardDescription>
            Videos from your connected channels that need tags or descriptions
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
            <Sparkles className="h-5 w-5 text-blue-500" />
            Missing Tags & Descriptions
          </CardTitle>
          <CardDescription>
            All your videos have tags and descriptions!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Great job! All videos from your connected channels have tags and descriptions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          Missing Tags & Descriptions
        </CardTitle>
        <CardDescription>
          {videos.length} video{videos.length !== 1 ? 's' : ''} from your connected channels need tags or descriptions
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
                
                <div className="mt-2 flex flex-wrap gap-2">
                  {!video.tags || video.tags.length === 0 ? (
                    <Badge variant="outline" className="border-destructive/50 text-destructive">
                      <Tag className="h-3 w-3 mr-1" />
                      Missing Tags
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Tag className="h-3 w-3 mr-1" />
                      Has Tags
                    </Badge>
                  )}
                  
                  {!video.description ? (
                    <Badge variant="outline" className="border-destructive/50 text-destructive">
                      <FileText className="h-3 w-3 mr-1" />
                      Missing Description
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <FileText className="h-3 w-3 mr-1" />
                      Has Description
                    </Badge>
                  )}
                </div>
                
                <div className="mt-3 flex items-center gap-2">
                  {video.tags_suggestions || video.description_suggestions ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApplySuggestions(video)}
                        className="h-8"
                      >
                        Apply Suggestions
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
                        onClick={() => generateSuggestions(video.id)}
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
                            Generate AI Suggestions
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
              Showing 5 of {videos.length} videos with missing content
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
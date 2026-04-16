/*import { useEffect, useState } from 'react';
import { 
  Search, Plus, Heart, MessageCircle, Share2, MoreHorizontal,
  ArrowLeft, Camera, MapPin, Clock
} from 'lucide-react';
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Input } from "../components/ui/input";
import Navigation from '../components/Navigation';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Feed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const samplePosts = [
    {
      _id: '1',
      title: 'Morning Yoga',
      user: { name: "Sarah Chen", initials: "SC", email: "sarah@example.com" },
      activity: "Morning Yoga",
      timeAgo: "2 hours ago",
      images: ["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500"],
      content: "What an amazing start to the day! Today's yoga session focused on mindfulness and flexibility. 🧘‍♀️✨ The sunrise made it even more magical!",
      likes: [],
      likeCount: 24,
      comments: [],
      commentCount: 8,
      isLiked: false,
      location: "Riverside Park",
      createdAt: new Date().toISOString(),
      author: { _id: '1', username: 'Sarah Chen', email: 'sarah@example.com' }
    },
    {
      _id: '2',
      title: 'Guitar Lessons',
      user: { name: "Mike Rodriguez", initials: "MR", email: "mike@example.com" },
      activity: "Guitar Lessons",
      timeAgo: "4 hours ago",
      images: ["https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500"],
      content: "Finally nailed that chord progression I've been struggling with! 🎸 Thanks to everyone in the music group for the encouragement.",
      likes: [],
      likeCount: 31,
      comments: [],
      commentCount: 12,
      isLiked: false,
      location: "Community Center",
      createdAt: new Date().toISOString(),
      author: { _id: '2', username: 'Mike Rodriguez', email: 'mike@example.com' }
    },
    {
      _id: '3',
      title: 'Book Club',
      user: { name: "Emma Thompson", initials: "ET", email: "emma@example.com" },
      activity: "Book Club",
      timeAgo: "6 hours ago",
      images: ["https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500"],
      content: "Great discussion today about 'The Seven Husbands of Evelyn Hugo'! 📚 Love how this book brings different perspectives together.",
      likes: [],
      likeCount: 18,
      comments: [],
      commentCount: 15,
      isLiked: false,
      location: "Downtown Library",
      createdAt: new Date().toISOString(),
      author: { _id: '3', username: 'Emma Thompson', email: 'emma@example.com' }
    }
  ];

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/posts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (response.data.success) {
        setPosts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load posts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to like posts',
        variant: 'destructive'
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPosts(posts.map(post => {
        if (post._id === postId) {
          const isLiked = post.likes.includes(user.id);
          return {
            ...post,
            likes: isLiked 
              ? post.likes.filter(id => id !== user.id)
              : [...post.likes, user.id]
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error liking post:', error);
      toast({
        title: 'Error',
        description: 'Failed to like post',
        variant: 'destructive'
      });
    }
  };

  const displayPosts = user ? posts : samplePosts;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Community Feed</h1>
              <p className="text-muted-foreground">
                See what your neighbors are up to and share your own experiences
              </p>
            </div>
            
            <Button 
              onClick={() => user ? navigate('/create-post') : navigate('/auth')}
              className="bg-gradient-primary hover:bg-primary-hover shadow-soft"
            >
              <Plus className="h-4 w-4 mr-2" />
              {user ? 'Create Post' : 'Sign in to Post'}
            </Button>
          </div>

          {user && (
            <Card className="mb-8 border-none shadow-card bg-card/70 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div 
                    className="flex-1 bg-accent rounded-full px-4 py-3 cursor-pointer hover:bg-accent/80 transition-colors"
                    onClick={() => navigate('/create-post')}
                  >
                    <p className="text-muted-foreground">Share your community experience...</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/create-post')}
                    className="text-primary hover:bg-primary-light"
                  >
                    <Camera className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!user && (
            <Card className="mb-8 border-none shadow-card bg-card/70 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">Join the Conversation</h3>
                <p className="text-muted-foreground mb-4">
                  Sign in to share your own community experiences and connect with neighbors
                </p>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={() => navigate('/auth')}
                    className="bg-gradient-primary hover:bg-primary-hover"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => navigate('/auth')}
                    variant="outline"
                    className="border-border"
                  >
                    Create Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="space-y-6">
              {Array(3).fill(0).map((_, i) => (
                <Card key={i} className="border-none shadow-card bg-card/70 backdrop-blur-sm animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-48 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {displayPosts.map((post) => (
                <PostCard 
                  key={post._id} 
                  post={post} 
                  user={user}
                  onLike={handleLike}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PostCard = ({ post, user, onLike }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (user && post.likes) {
      setLiked(post.likes.includes(user.id));
      setLikeCount(post.likes.length);
    } else {
      setLiked(false);
      setLikeCount(post.likeCount || post.likes?.length || 0);
    }
  }, [post, user]);

  const handleLike = () => {
    if (user) {
      onLike(post._id);
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now.getTime() - postDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const authorName = post.author?.username || post.author?.fullName || post.user?.name || 'User';
  const authorInitials = authorName.split(' ').map((n) => n[0]).join('').toUpperCase();
  const activity = post.title || post.activity || 'Posted';
  const timeAgo = post.timeAgo || getTimeAgo(post.createdAt);
  const image = post.images?.[0] || post.image;
  const location = post.location;
  const commentCount = post.commentCount || post.comments?.length || 0;

  return (
    <Card className="border-none shadow-card bg-card/70 backdrop-blur-sm overflow-hidden hover:shadow-soft transition-all duration-300">
      <CardContent className="p-0">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                  {authorInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-card-foreground">{authorName}</h3>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Joined {activity}</span>
                  <span>•</span>
                  <span>{timeAgo}</span>
                  {location && (
                    <>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{location}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {image && (
          <div className="relative overflow-hidden">
            <img 
              src={image} 
              alt={`${activity} session`}
              className="w-full h-80 object-cover"
            />
          </div>
        )}

        <div className="p-6">
          <p className="text-card-foreground leading-relaxed mb-4">{post.content}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button 
                onClick={handleLike}
                className={`flex items-center space-x-2 transition-colors ${
                  liked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
                <span className="font-medium">{likeCount}</span>
              </button>
              <button className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors">
                <MessageCircle className="h-5 w-5" />
                <span className="font-medium">{commentCount}</span>
              </button>
            </div>
            <button className="text-muted-foreground hover:text-primary transition-colors">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Feed; oggggggggggggggggggggggggggggggggggggggg
import { useEffect, useState } from 'react';
import { 
  Plus, Heart, MessageCircle, Share2, MoreHorizontal, Camera, MapPin
} from 'lucide-react';
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import Navigation from '../components/Navigation';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';

const Feed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const samplePosts = [
    {
      _id: '1',
      title: 'Morning Yoga',
      user: { name: "Sarah Chen", initials: "SC", email: "sarah@example.com" },
      activity: "Morning Yoga",
      timeAgo: "2 hours ago",
      images: ["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80"],
      content: "What an amazing start to the day! Today's yoga session focused on mindfulness and flexibility. 🧘‍♀️✨ The sunrise made it even more magical!",
      likes: [],
      likeCount: 24,
      comments: [],
      commentCount: 8,
      isLiked: false,
      location: "Riverside Park",
      createdAt: new Date().toISOString(),
      author: { _id: '1', username: 'Sarah Chen', email: 'sarah@example.com' }
    },
    {
      _id: '2',
      title: 'Guitar Lessons',
      user: { name: "Mike Rodriguez", initials: "MR", email: "mike@example.com" },
      activity: "Guitar Lessons",
      timeAgo: "4 hours ago",
      images: ["https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80"],
      content: "Finally nailed that chord progression I've been struggling with! 🎸 Thanks to everyone in the music group for the encouragement.",
      likes: [],
      likeCount: 31,
      comments: [],
      commentCount: 12,
      isLiked: false,
      location: "Community Center",
      createdAt: new Date().toISOString(),
      author: { _id: '2', username: 'Mike Rodriguez', email: 'mike@example.com' }
    },
    {
      _id: '3',
      title: 'Book Club',
      user: { name: "Emma Thompson", initials: "ET", email: "emma@example.com" },
      activity: "Book Club",
      timeAgo: "6 hours ago",
      images: ["https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80"],
      content: "Great discussion today about 'The Seven Husbands of Evelyn Hugo'! 📚 Love how this book brings different perspectives together.",
      likes: [],
      likeCount: 18,
      comments: [],
      commentCount: 15,
      isLiked: false,
      location: "Downtown Library",
      createdAt: new Date().toISOString(),
      author: { _id: '3', username: 'Emma Thompson', email: 'emma@example.com' }
    }
  ];

  const handleLike = (postId) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to like posts',
        variant: 'destructive'
      });
      return;
    }

    setPosts(posts.map(post => {
      if (post._id === postId) {
        const isLiked = post.likes.includes(user.id);
        return {
          ...post,
          likes: isLiked 
            ? post.likes.filter((id) => id !== user.id)
            : [...post.likes, user.id]
        };
      }
      return post;
    }));
  };

  const displayPosts = user && posts.length > 0 ? posts : samplePosts;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Community Feed</h1>
              <p className="text-muted-foreground">
                See what your neighbors are up to and share your own experiences
              </p>
            </div>
            
            <Button 
              onClick={() => user ? navigate('/create-post') : navigate('/auth')}
              className="bg-gradient-primary hover:opacity-90 shadow-soft"
            >
              <Plus className="h-4 w-4 mr-2" />
              {user ? 'Create Post' : 'Sign in to Post'}
            </Button>
          </div>

          {user && (
            <Card className="mb-8 border-none shadow-card bg-card backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div 
                    className="flex-1 bg-accent rounded-full px-4 py-3 cursor-pointer hover:bg-accent/80 transition-colors"
                    onClick={() => navigate('/create-post')}
                  >
                    <p className="text-muted-foreground">Share your community experience...</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/create-post')}
                    className="text-primary hover:bg-primary-light"
                  >
                    <Camera className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!user && (
            <Card className="mb-8 border-none shadow-card bg-card backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">Join the Conversation</h3>
                <p className="text-muted-foreground mb-4">
                  Sign in to share your own community experiences and connect with neighbors
                </p>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={() => navigate('/auth')}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => navigate('/auth')}
                    variant="outline"
                    className="border-border"
                  >
                    Create Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="space-y-6">
              {Array(3).fill(0).map((_, i) => (
                <Card key={i} className="border-none shadow-card bg-card backdrop-blur-sm animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-48 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {displayPosts.map((post) => (
                <PostCard 
                  key={post._id} 
                  post={post} 
                  user={user}
                  onLike={handleLike}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PostCard = ({ post, user, onLike }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (user && post.likes) {
      setLiked(post.likes.includes(user.id));
      setLikeCount(post.likes.length);
    } else {
      setLiked(false);
      setLikeCount(post.likeCount || post.likes?.length || 0);
    }
  }, [post, user]);

  const handleLike = () => {
    if (user) {
      onLike(post._id);
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now.getTime() - postDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const authorName = post.author?.username || post.author?.fullName || post.user?.name || 'User';
  const authorInitials = authorName.split(' ').map((n) => n[0]).join('').toUpperCase();
  const activity = post.title || post.activity || 'Posted';
  const timeAgo = post.timeAgo || getTimeAgo(post.createdAt);
  const image = post.images?.[0] || post.image;
  const location = post.location;
  const commentCount = post.commentCount || post.comments?.length || 0;

  return (
    <Card className="border-none shadow-card bg-card backdrop-blur-sm overflow-hidden hover:shadow-soft transition-all duration-300">
      <CardContent className="p-0">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                  {authorInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-card-foreground">{authorName}</h3>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Joined {activity}</span>
                  <span>•</span>
                  <span>{timeAgo}</span>
                  {location && (
                    <>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{location}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {image && (
          <div className="relative overflow-hidden bg-muted">
            <img 
              src={image} 
              alt={`${activity} session`}
              className="w-full h-80 object-cover"
              loading="lazy"
              onError={(e) => {
                console.error('Image failed to load:', image);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="p-6">
          <p className="text-card-foreground leading-relaxed mb-4">{post.content}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button 
                onClick={handleLike}
                className={`flex items-center space-x-2 transition-colors ${
                  liked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
                <span className="font-medium">{likeCount}</span>
              </button>
              <button className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors">
                <MessageCircle className="h-5 w-5" />
                <span className="font-medium">{commentCount}</span>
              </button>
            </div>
            <button className="text-muted-foreground hover:text-primary transition-colors">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Feed; */


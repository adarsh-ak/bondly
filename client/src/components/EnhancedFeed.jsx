
import { useEffect, useState, useRef } from "react";
import {
  Plus,
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Trash2,
  Send,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import Navigation from "../components/Navigation";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/use-toast";
import axios from "axios";


const API_URL = "http://localhost:5000/api/posts";

const Feed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();

        if (data.success) {
          const fixed = data.data.map((p) => {
            if (p.images?.length > 0) {
              p.images = p.images.map((img) =>
                img.startsWith("http")
                  ? img
                  : `http://localhost:5000/uploads/${img}`
              );
            } else if (p.media) {
              p.media = p.media.startsWith("http")
                ? p.media
                : `http://localhost:5000/uploads/${p.media}`;
            }
            return p;
          });

          setPosts(fixed);
        } else {
          toast({ title: "Failed to load posts", variant: "destructive" });
        }
      } catch {
        toast({
          title: "Server error while loading posts",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // ✅ Add new post from localStorage
  useEffect(() => {
    const savedPost = localStorage.getItem("newPost");
    if (savedPost) {
      const post = JSON.parse(savedPost);
      if (post.images?.length > 0) {
        post.images = post.images.map((img) =>
          img.startsWith("http")
            ? img
            : `http://localhost:5000/uploads/${img}`
        );
      } else if (post.media) {
        post.media = post.media.startsWith("http")
          ? post.media
          : `http://localhost:5000/uploads/${post.media}`;
      }
      setPosts((prev) => [post, ...prev]);
      localStorage.removeItem("newPost");
    }
  }, []);

  // ✅ Delete post
  const handleDelete = async (id) => {
    if (!user) {
      toast({ title: "Please sign in first", variant: "destructive" });
      return;
    }

    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => prev.filter((p) => p._id !== id));
        toast({ title: "🗑 Post deleted successfully" });
      } else {
        toast({
          title: data.message || "Failed to delete post",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Server error", variant: "destructive" });
    }
  };

  // ✅ Like post
  const handleLike = async (postId) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please log in to like posts",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/${postId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` },
      });

      const data = await res.json();

      if (data.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId
              ? { ...p, likes: data.data.likes }
              : p
          )
        );
      } else {
        toast({
          title: data.message || "Failed to like post",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error liking post:", error);
      toast({ title: "Error liking post", variant: "destructive" });
    }
  };

  // ✅ Add comment
  const handleComment = async (postId, text) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please log in to comment",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/${postId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (data.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId ? { ...p, comments: data.data.comments } : p
          )
        );
      } else {
        toast({
          title: data.message || "Failed to add comment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({ title: "Error adding comment", variant: "destructive" });
    }
  };

  
const handleDeleteComment = async (postId, commentId) => {
  if (!user) {
    toast({
      title: "Sign in required",
      description: "Please log in to delete comments",
      variant: "destructive",
    });
    return;
  }

  if (!window.confirm("Are you sure you want to delete this comment?")) return;

  try {
    await axios.delete(`${API_URL}/${postId}/comments/${commentId}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });

    // ✅ Update comments inside posts array
    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p._id === postId
          ? { ...p, comments: p.comments.filter((c) => c._id !== commentId) }
          : p
      )
    );

    // ✅ Toast success message
    toast({
      title: "Comment deleted",
      description: "Your comment was deleted successfully.",
      duration: 3000,
    });
  } catch (error) {
    console.error("Error deleting comment:", error);

    toast({
      title: "Error",
      description:
        error.response?.data?.message || "Failed to delete the comment.",
      variant: "destructive",
      duration: 3000,
    });
  }
};




  return (
    <div className="min-h-screen bg-background">
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Community Feed
              </h1>
              <p className="text-muted-foreground">
                See what’s happening in your neighborhood
              </p>
            </div>

            <Button
              onClick={() =>
                user ? navigate("/create-post") : navigate("/auth")
              }
              className="bg-gradient-primary hover:opacity-90 shadow-soft"
            >
              <Plus className="h-4 w-4 mr-2" />
              {user ? "Create Post" : "Sign in to Post"}
            </Button>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground">
              Loading posts...
            </p>
          ) : posts.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No posts yet. Be the first to share something!
            </p>
          ) : (
            <div className="space-y-6">
              {posts.map((p) => (
                <PostCard
                  key={p._id}
                  post={p}
                  user={user}
                  onLike={handleLike}
                  onDelete={handleDelete}
                  onComment={handleComment}
                  onDeleteComment={handleDeleteComment}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ✅ PostCard Component
const PostCard = ({ post, user, onLike, onDelete, onComment, onDeleteComment }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [comment, setComment] = useState("");
  const [shared, setShared] = useState(false);
  const commentInputRef = useRef(null);

  useEffect(() => {
    if (user && post.likes) {
      setLiked(post.likes.includes(user.id));
    }
  }, [post.likes, user]);

  const handleLikeClick = () => {
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    onLike(post._id);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    onComment(post._id, comment);
    setComment("");
  };

  const handleCommentIconClick = () => {
    if (commentInputRef.current) {
      commentInputRef.current.scrollIntoView({ behavior: "smooth" });
      commentInputRef.current.focus({ preventScroll: true });
    }
  };

  const handleShare = async () => {
    const shareLink = `${window.location.origin}/post/${post._id}`;
    try {
      await navigator.clipboard.writeText(shareLink);
      setShared(true);
      alert("✅ Post link copied!");
      setTimeout(() => setShared(false), 1500);
    } catch {
      alert("❌ Could not copy link!");
    }
  };

  const getTimeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / (1000 * 60 * 60));
    if (diff < 1) return "Just now";
    if (diff < 24) return `${diff} hours ago`;
    return `${Math.floor(diff / 24)} days ago`;
  };

  const authorName =
    post.author?.username || post.author?.fullName || post.user?.name || "User";
  const initials = authorName[0]?.toUpperCase() || "U";
  const media = post.images?.[0] || post.media || null;

  return (
    <Card className="border-none shadow-card bg-card overflow-hidden">
      <CardContent className="p-0">
        <div className="p-6 pb-4 flex justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-card-foreground">{authorName}</h3>
              <span className="text-sm text-muted-foreground">
                {getTimeAgo(post.createdAt)}
              </span>
            </div>
          </div>

          {user && (post.author?._id === user.id || post.author?.username === "testuser") && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-red-500"
              onClick={() => onDelete(post._id)}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
        </div>

        {media &&
          (media.endsWith(".mp4") ? (
            <video controls className="w-full h-80 object-cover">
              <source src={media} type="video/mp4" />
            </video>
          ) : (
            <img
              src={media}
              alt="post"
              className="w-full h-80 object-cover"
              loading="lazy"
            />
          ))}

        <div className="p-6">
          <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
          <p className="text-card-foreground mb-4">{post.content}</p>

          {/* Like / Comment / Share */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={handleLikeClick}
                className={`flex items-center space-x-2 ${
                  liked ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
              >
                <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
                <span>{likeCount}</span>
              </button>

              <button
                onClick={handleCommentIconClick}
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary"
              >
                <MessageCircle className="h-5 w-5" />
                <span>{post.comments?.length || 0}</span>
              </button>
            </div>

            <button
              onClick={handleShare}
              className="text-muted-foreground hover:text-primary transition-colors flex items-center space-x-1"
            >
              {shared ? (
                <span className="text-green-500 font-semibold text-sm">✔</span>
              ) : (
                <Share2 className="h-5 w-5" />
              )}
            </button>
          </div>

          
          {/* Comments */}
           
          <div className="mt-4 space-y-3">
            {post.comments?.length > 0 &&
              post.comments.map((c) => (
                <div key={c._id} className="flex items-start justify-between">
                  <div className="flex items-start space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {c.user?.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted p-2 rounded-lg text-sm">
                      <strong>{c.user?.username || "User"}:</strong> {c.text}
                    </div>
                  </div>

                  {user && c.user?._id === user.id && (
                    <button
                      onClick={() => onDeleteComment(post._id, c._id)}
                      className="text-red-500 hover:text-red-700 text-xs ml-2"
                      title="Delete comment"
                    >
                      🗑
                    </button>
                  )}
                </div>
              ))}

            {/* Add Comment */}
            <form onSubmit={handleCommentSubmit} className="flex space-x-2 mt-3">
              <input
                ref={commentInputRef}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
              />
              <button type="submit" className="p-2 rounded-lg bg-primary text-white">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div> 

        </div>
      </CardContent>
    </Card>
  );
};

export default Feed;

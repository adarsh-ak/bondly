import { useEffect, useState, useRef } from "react";
import {
  Plus,
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Trash2,
  Send,
  Lock,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
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

      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p._id === postId
            ? { ...p, comments: p.comments.filter((c) => c._id !== commentId) }
            : p
        )
      );

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
    <div className="min-h-screen bg-slate-50/60 dark:bg-background py-6">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header Title Bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Community Feed
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              Discover local experiences, updates & stories
            </p>
          </div>

          <Button
            onClick={() => (user ? navigate("/create-post") : navigate("/auth"))}
            className="bg-[#e11d48] text-white hover:bg-[#be123c] font-semibold px-4 py-2 rounded-full shadow-md transition-all flex items-center space-x-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>{user ? "Create Post" : "Sign in"}</span>
          </Button>
        </div>

        {/* Quick Post Box Trigger */}
        {user && (
          <Card className="mb-6 border-2 border-[#e11d48]/25 hover:border-[#e11d48]/50 shadow-md hover:shadow-lg transition-all rounded-2xl bg-card overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10 border border-[#fda4af]/60 shadow-xs">
                  <AvatarFallback className="bg-rose-50 text-[#f43f5e] font-semibold text-xs border border-rose-100">
                    You
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => navigate("/create-post")}
                  className="flex-1 text-left px-4 py-2.5 rounded-full bg-[#fff1f2] text-[#9f1239] text-xs md:text-sm font-medium transition-all hover:bg-[#ffe4e6] border border-[#fecdd3] hover:border-[#e11d48]"
                >
                  Share your experience, story or thoughts...
                </button>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-around">
                <button
                  onClick={() => navigate("/create-post")}
                  className="flex items-center space-x-2 text-xs md:text-sm font-semibold text-[#fda4af] hover:text-[#e11d48] px-3 py-1.5 rounded-xl hover:bg-[#ffe4e6]/60 transition-all"
                >
                  <span className="text-base">📸</span>
                  <span>Photo / Image</span>
                </button>

                <button
                  onClick={() => navigate("/create-post")}
                  className="flex items-center space-x-2 text-xs md:text-sm font-semibold text-[#fda4af] hover:text-[#e11d48] px-3 py-1.5 rounded-lg hover:bg-[#ffe4e6]/60 transition-all"
                >
                  <span className="text-base">🎥</span>
                  <span>Video Clip</span>
                </button>

                <button
                  onClick={() => navigate("/create-post")}
                  className="flex items-center space-x-2 text-xs md:text-sm font-semibold text-[#fda4af] hover:text-[#e11d48] px-3 py-1.5 rounded-lg hover:bg-[#ffe4e6]/60 transition-all"
                >
                  <span className="text-base">✍️</span>
                  <span>Experience</span>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feed Posts List */}
        {!user ? (
          <Card className="p-8 md:p-12 text-center border-2 border-[#e11d48]/25 shadow-lg rounded-2xl bg-card my-6">
            <div className="max-w-md mx-auto space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#e11d48]/10 text-[#e11d48] shadow-xs">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                Sign In to View Feed
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The Community Feed is exclusive to registered members. Please sign in or create an account to discover stories, view photos & videos, and interact with your community.
              </p>
              <div className="pt-3 flex items-center justify-center space-x-3">
                <Button
                  onClick={() => navigate("/auth")}
                  className="bg-[#e11d48] text-white hover:bg-[#be123c] font-semibold px-6 py-2.5 rounded-full shadow-md transition-all"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate("/auth")}
                  variant="outline"
                  className="border-2 border-[#e11d48] text-[#e11d48] hover:bg-[#e11d48]/10 font-semibold px-6 py-2.5 rounded-full transition-all"
                >
                  Sign Up
                </Button>
              </div>
            </div>
          </Card>
        ) : loading ? (
          <div className="space-y-4 py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#e11d48] border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Loading feed posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-8 text-center border border-border shadow-sm rounded-2xl bg-card">
            <p className="text-muted-foreground font-medium">No posts yet. Be the first to share something with your community!</p>
            <Button
              onClick={() => navigate("/create-post")}
              className="mt-4 bg-[#e11d48] text-white hover:bg-[#be123c] rounded-full px-6"
            >
              Post Now
            </Button>
          </Card>
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
  );
};

// ✅ Modern PostCard Component
const PostCard = ({ post, user, onLike, onDelete, onComment, onDeleteComment }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [comment, setComment] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);
  const [shared, setShared] = useState(false);
  const commentInputRef = useRef(null);

  useEffect(() => {
    if (user && post.likes) {
      const userId = user.id || user._id;
      setLiked(post.likes.some((id) => id === userId || id?._id === userId));
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
    onComment(post._id, comment.trim());
    setComment("");
    setShowAllComments(true);
  };

  const handleCommentIconClick = () => {
    setShowAllComments((prev) => !prev);
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  const handleShare = async () => {
    const shareLink = `${window.location.origin}/post/${post._id}`;
    try {
      await navigator.clipboard.writeText(shareLink);
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    } catch {
      alert("❌ Could not copy link!");
    }
  };

  const getTimeAgo = (date) => {
    if (!date) return "Just now";
    const diff = Math.floor((Date.now() - new Date(date)) / (1000 * 60));
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Author details
  const authorObj = post.author && typeof post.author === "object" ? post.author : null;
  const currentUserId = user?.id || user?._id;
  const isPostAuthor = user && (authorObj?._id === currentUserId || authorObj?.username === user.username || authorObj?.fullName === user.fullName);
  
  const rawAuthorName = authorObj?.fullName || authorObj?.username || post.user?.name || "Community Member";
  const authorName = isPostAuthor ? "You" : rawAuthorName;
  const avatarUrl = authorObj?.avatar || null;
  const initials = isPostAuthor ? "You" : (rawAuthorName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U");
  const media = post.images?.[0] || post.media || null;

  const isVideo = (url) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return (
      lower.endsWith(".mp4") ||
      lower.endsWith(".webm") ||
      lower.endsWith(".mov") ||
      lower.endsWith(".ogg")
    );
  };

  const allComments = post.comments || [];
  const visibleComments = showAllComments ? allComments : allComments.slice(0, 2);

  // Clean title display (don't repeat if title matches content)
  const shouldShowTitle =
    post.title &&
    post.title !== "Untitled Post" &&
    post.title !== "Community Post" &&
    !post.content?.startsWith(post.title);

  return (
    <Card className="border-2 border-[#e11d48]/25 shadow-md hover:shadow-lg hover:border-[#e11d48]/50 transition-all bg-card overflow-hidden rounded-2xl">
      <CardContent className="p-0">
        {/* Author Header */}
        <div className="p-4 md:p-5 pb-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Avatar className="h-11 w-11 border-2 border-[#e11d48]/20 shadow-xs">
              {avatarUrl ? (
                <img src={avatarUrl} alt={authorName} className="h-full w-full object-cover" />
              ) : (
                <AvatarFallback className="bg-rose-50 text-[#f43f5e] font-semibold text-xs border border-rose-100">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h3 className="font-bold text-foreground text-sm md:text-base leading-tight">
                {authorName}
              </h3>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-0.5">
                <span>{getTimeAgo(post.createdAt)}</span>
                {post.location && (
                  <span className="flex items-center text-xs font-medium text-[#e11d48]">
                    <MapPin className="h-3 w-3 mr-0.5 inline" /> {post.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {isPostAuthor && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full h-8 w-8 transition-colors"
              onClick={() => onDelete(post._id)}
              title="Delete Post"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Post Text / Description */}
        <div className="px-4 md:px-5 pb-3 text-left">
          {shouldShowTitle && (
            <h4 className="font-bold text-base md:text-lg text-foreground mb-1.5 leading-snug text-left">
              {post.title}
            </h4>
          )}
          {post.content && (
            <p className="text-foreground text-sm md:text-base leading-relaxed whitespace-pre-line text-left">
              {post.content.trim()}
            </p>
          )}
        </div>

        {/* Media (Photo or Video) - Beautiful Frame without Clipping */}
        {media && (
          <div className="bg-slate-950/5 dark:bg-slate-900/50 flex items-center justify-center overflow-hidden border-y border-border/40 max-h-[460px]">
            {isVideo(media) ? (
              <video controls className="w-full max-h-[460px] object-contain">
                <source src={media} />
                Your browser does not support video playback.
              </video>
            ) : (
              <img
                src={media}
                alt="Post attachment"
                className="w-full max-h-[460px] object-contain bg-slate-900/10"
                loading="lazy"
              />
            )}
          </div>
        )}

        {/* Post Actions & Comments Area */}
        <div className="p-4 md:p-5 pt-3">
          {/* Action Bar (Like / Comment / Share) */}
          <div className="flex items-center justify-between py-2 border-b border-border/60">
            <div className="flex items-center space-x-3">
              {/* Like Button */}
              <button
                onClick={handleLikeClick}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all ${
                  liked
                    ? "bg-[#e11d48]/10 text-[#e11d48]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Heart className={`h-4 w-4 md:h-5 md:w-5 transition-transform active:scale-125 ${liked ? "fill-[#e11d48] text-[#e11d48]" : ""}`} />
                <span>{likeCount}</span>
              </button>

              {/* Comment Button */}
              <button
                onClick={handleCommentIconClick}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
                <span>{allComments.length}</span>
              </button>
            </div>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              title="Share post"
            >
              {shared ? (
                <span className="text-emerald-600 font-bold text-xs">Link Copied! ✔</span>
              ) : (
                <>
                  <Share2 className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>
          </div>

          {/* Comments Section */}
          <div className="mt-3 space-y-2.5">
            {/* Display at most 2 comments initially */}
            {visibleComments.length > 0 &&
              visibleComments.map((c) => {
                const commentUser = c.user && typeof c.user === "object" ? c.user : null;
                const commentUserId = commentUser?._id || c.user;
                const isCommentAuthor = user && (commentUserId === currentUserId || commentUser?.username === user.username || commentUser?.fullName === user.fullName);
                const commentRawUsername = commentUser?.fullName || commentUser?.username || "Member";
                const commentUsername = isCommentAuthor ? "You" : commentRawUsername;
                const commentInitials = isCommentAuthor ? "You" : (commentRawUsername.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U");
                const canDelete = isCommentAuthor || isPostAuthor;

                return (
                  <div key={c._id} className="flex items-start justify-between space-x-2 group">
                    <div className="flex items-start space-x-2.5 flex-1">
                      <Avatar className="h-7 w-7 mt-1 border border-border">
                        <AvatarFallback className="text-[9px] bg-rose-50 text-[#f43f5e] font-semibold border border-rose-100">
                          {commentInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-slate-100 dark:bg-muted/70 px-3.5 py-2 rounded-2xl text-xs md:text-sm flex-1 text-left">
                        <div className="flex items-center justify-between mb-0.5 text-left">
                          <span className="font-bold text-foreground text-xs text-left">
                            {commentUsername}
                          </span>
                          {c.createdAt && (
                            <span className="text-[10px] text-muted-foreground">
                              {getTimeAgo(c.createdAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-foreground leading-snug text-left mt-0.5 whitespace-pre-line">{c.text?.trim()}</p>
                      </div>
                    </div>

                    {canDelete && (
                      <button
                        onClick={() => onDeleteComment(post._id, c._id)}
                        className="text-muted-foreground hover:text-red-600 p-1 transition-opacity opacity-70 hover:opacity-100"
                        title="Delete comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}

            {/* Toggle view all remaining comments button */}
            {allComments.length > 2 && (
              <button
                onClick={() => setShowAllComments(!showAllComments)}
                className="text-xs text-[#e11d48] font-bold hover:underline pt-1 block"
              >
                {showAllComments
                  ? "Show fewer comments"
                  : `View all ${allComments.length} comments`}
              </button>
            )}

            {/* Add Comment Input Bar */}
            <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2 pt-2">
              <input
                ref={commentInputRef}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 border border-border/80 rounded-full px-4 py-2 text-xs md:text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#e11d48]/50 shadow-xs"
              />
              <button
                type="submit"
                disabled={!comment.trim()}
                className="p-2.5 rounded-full bg-[#e11d48] text-white hover:bg-[#be123c] disabled:opacity-40 transition-all shadow-xs flex items-center justify-center"
              >
                <Send className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Feed;

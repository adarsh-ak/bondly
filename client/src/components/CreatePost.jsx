
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

const CreatePost = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [location, setLocation] = useState("");
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMedia(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const clearMedia = () => {
    setMedia(null);
    setMediaPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && !media) {
      toast({ title: "Please write a caption or select a photo/video", variant: "destructive" });
      return;
    }

    setLoading(true);

    // ✅ Create FormData
    const formData = new FormData();
    formData.append("title", title || content.substring(0, 30) || "Community Post");
    formData.append("content", content);
    formData.append("category", category);
    formData.append("location", location);
    if (media) formData.append("media", media);

    try {
      const token = user?.token || localStorage.getItem("token");
      if (!token) {
        toast({ title: "Please log in to create a post", variant: "destructive" });
        setLoading(false);
        return;
      }

      const res = await fetch("http://localhost:5000/api/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("newPost", JSON.stringify(data.data));
        toast({ title: "✅ Post published successfully!" });
        navigate("/feed");
      } else {
        toast({
          title: data.message || "Failed to create post",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("❌ Error creating post:", err);
      toast({ title: "Server error while publishing post", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex justify-center items-center p-4">
      <Card className="w-full max-w-lg shadow-card bg-card border-2 border-[#e11d48]">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-card-foreground">
              Create a Post
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
            <input
              type="text"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#e11d48]/50"
            />
            <textarea
              placeholder="Share your experience with the community... (optional if photo/video is attached)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-28 p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#e11d48]/50"
            />
            <input
              type="text"
              placeholder="Location (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#e11d48]/50"
            />

            <div>
              <label className="block mb-2 text-sm font-medium text-foreground">
                Upload Photo or Video
              </label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="block w-full border border-border rounded-lg bg-background text-foreground cursor-pointer 
                  file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 
                  file:bg-[#e11d48] file:text-white hover:file:bg-[#be123c]"
              />
            </div>

            {mediaPreview && (
              <div className="relative mt-3 rounded-lg overflow-hidden border border-border bg-black/5 p-2">
                {media?.type?.startsWith("video/") ? (
                  <video src={mediaPreview} controls className="max-h-56 w-full object-contain rounded-md" />
                ) : (
                  <img src={mediaPreview} alt="Preview" className="max-h-56 w-full object-contain rounded-md" />
                )}
                <button
                  type="button"
                  onClick={clearMedia}
                  className="absolute top-4 right-4 bg-red-600 text-white rounded-full p-1 text-xs hover:bg-red-700 shadow"
                >
                  ✕ Remove
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e11d48] text-white hover:bg-[#be123c] font-semibold py-3 rounded-lg shadow-md mt-2"
            >
              {loading ? "Publishing..." : "Post to Community Feed"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePost;





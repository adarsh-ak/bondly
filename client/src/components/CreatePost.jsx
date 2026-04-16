
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
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setMedia(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      toast({ title: "Post content cannot be empty", variant: "destructive" });
      return;
    }

    // ✅ Create FormData
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("category", category);
    formData.append("location", location);
    if (media) formData.append("media", media); // ✅ keep as "media" (matches backend)

    try {
      // ✅ Get token properly
      const token = user?.token || localStorage.getItem("token");
      if (!token) {
        toast({ title: "Please log in to create a post", variant: "destructive" });
        return;
      }

      const res = await fetch("http://localhost:5000/api/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // ✅ token is passed correctly
        },
        body: formData,
      });

      const data = await res.json();
      console.log("🟢 Post response:", data);

      if (data.success) {
        // ✅ Save new post in localStorage so Feed.jsx shows it instantly
        localStorage.setItem("newPost", JSON.stringify(data.data));

        toast({ title: "✅ Post created successfully!" });
        navigate("/"); // go to Feed
      } else {
        toast({
          title: data.message || "Failed to create post",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("❌ Error creating post:", err);
      toast({ title: "Server error", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex justify-center items-center">
      <Card className="w-full max-w-lg shadow-card bg-card">
        <CardContent className="p-8 border border-gray-300">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Create a New Post
          </h2>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            encType="multipart/form-data"
          >
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border rounded-md focus:outline-none"
            />
            <textarea
              placeholder="What's happening in your community?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-32 p-3 border rounded-md focus:outline-none"
            />
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-3 border rounded-md focus:outline-none"
            />
            <div className="mt-4">
  <label className="block mb-2 text-sm font-medium text-foreground">
    Add Photo/Video
  </label>
  <input
    type="file"
    accept="image/*,video/*"
    onChange={(e) => setMedia(e.target.files[0])}
    className="block w-full border border-border rounded-lg bg-background text-foreground cursor-pointer 
      file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 
      file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
  />
</div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              Post
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePost;





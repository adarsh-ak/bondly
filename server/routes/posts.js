
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { protect } from "../middleware/auth.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js"; 

const router = express.Router();

/* ---------------------------------------------------------------
   🔧 Multer Configuration — Save uploads in /uploads folder
---------------------------------------------------------------- */
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });


router.get("/", async (req, res) => {
  try {
    const { limit = 20, page = 1, category, groupId } = req.query;

    const query = { isActive: true };
    if (category && category !== "all") query.category = category;
    if (groupId) query.group = groupId;

    const posts = await Post.find(query)
      .populate("author", "username fullName avatar")
      .populate("group", "name")
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "username fullName avatar",
        },
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/posts:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});



/* ---------------------------------------------------------------
   @route   GET /api/posts/highlights
   @desc    Get highlighted posts
   @access  Public
---------------------------------------------------------------- */
router.get("/highlights", async (req, res) => {
  try {
    const posts = await Post.find({
      isActive: true,
      category: "event",
    })
      .populate("author", "username avatar")
      .populate("group", "name")
      .sort({ createdAt: -1 })
      .limit(3);

    res.json({ success: true, data: posts });
  } catch (error) {
    console.error("Error in GET /api/posts/highlights:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ---------------------------------------------------------------
   @route   POST /api/posts
   @desc    Create a new post (with optional image)
   @access  Private
---------------------------------------------------------------- */
router.post("/", protect, upload.single("media"), async (req, res) => {
  try {
    console.log("📩 Incoming POST /api/posts");
    console.log("User from protect middleware:", req.user);
    console.log("Body:", req.body);
    console.log("File:", req.file ? req.file.filename : "No file uploaded");

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, user missing in token" });
    }

    const { content, location, category, groupId, eventDate } = req.body;

    if (!content) {
      return res
        .status(400)
        .json({ success: false, message: "Content is required" });
    }

    const validCategories = ["general", "event", "announcement", "activity"];
    const finalCategory = validCategories.includes(category)
      ? category
      : "general";

    const imageUrl = req.file ? req.file.filename : null;

    const post = await Post.create({
      title: content.substring(0, 50) || "Untitled Post",
      content,
      location,
      category: finalCategory,
      eventDate: eventDate || null,
      group: groupId || null,
      images: imageUrl ? [imageUrl] : [],
      author: req.user._id,
    });

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { "stats.activitiesCount": 1 },
    });

    const populatedPost = await Post.findById(post._id)
      .populate("author", "username avatar fullName")
      .populate("group", "name")
      .lean();

    populatedPost.images = post.images;

    res.status(201).json({ success: true, data: populatedPost });
  } catch (error) {
    console.error("❌ Error in POST /api/posts:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ---------------------------------------------------------------
   @route   POST /api/posts/:id/like
   @desc    Like or unlike a post
   @access  Private
---------------------------------------------------------------- */
router.post("/:id/like", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res.status(404).json({ success: false, message: "Post not found" });

    const userId = req.user._id.toString();
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    const updated = await Post.findById(post._id)
      .populate("author", "username avatar")
      .populate("comments.user", "username avatar");

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error in POST /api/posts/:id/like:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});



    
  router.post("/:id/comment", protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text)
      return res.status(400).json({ success: false, message: "Comment text required" });

    const post = await Post.findById(req.params.id);
    if (!post)
      return res.status(404).json({ success: false, message: "Post not found" });

    // 🔹 Create and save comment
    const comment = await Comment.create({
      text,
      user: req.user._id,
    });

    // 🔹 Add to post
   post.comments.push(comment._id);
    

    await post.save();

    // 🔹 Populate full data
    const populatedPost = await Post.findById(post._id)
      .populate("author", "username avatar")
      .populate({
        path: "comments",
        populate: { path: "user", select: "username avatar" },
      });

    res.json({ success: true, data: populatedPost });
  } catch (error) {
    console.error("Error in comment route:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});




/* ---------------------------------------------------------------
   @route   DELETE /api/posts/:id
   @desc    Delete a post (only by author)
   @access  Private
---------------------------------------------------------------- */
router.delete("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res.status(404).json({ success: false, message: "Post not found" });

    if (post.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized to delete this post" });
    }

    // Optionally delete image file from uploads/
    if (post.images && post.images.length > 0) {
      for (const img of post.images) {
        const filePath = path.join(uploadDir, img);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }

    await post.deleteOne();
    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/posts/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/:postId/comments/:commentId", async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    // ✅ Import your models at the top if not already imported
    // import Post from "../models/Post.js";
    // import Comment from "../models/Comment.js";

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // ✅ Remove the comment reference from Post.comments array
    post.comments = post.comments.filter(
      (id) => id.toString() !== commentId.toString()
    );
    await post.save();

    // ✅ Delete comment document
    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});


export default router;



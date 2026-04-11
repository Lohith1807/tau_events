const Post = require('../models/Post');

exports.createPost = async (req, res) => {
  try {
    const { title, description } = req.body;
    let images = [];

    // Prioritize direct MongoDB storage from base64 strings
    if (req.body.images) {
      if (Array.isArray(req.body.images)) {
        images = req.body.images;
      } else {
        try {
          images = JSON.parse(req.body.images);
        } catch (e) { images = [req.body.images]; }
      }
    } else if (req.files && req.files.length > 0) {
      images = req.files.map(f => f.path);
    }


    const post = new Post({
      title,
      description,
      images,
      author: req.user._id
    });

    await post.save();
    await post.populate('author', 'name email role avatar');

    res.status(201).json({ message: 'Post created.', post });
  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const [posts, total] = await Promise.all([
      Post.find({ isActive: true })
        .populate('author', 'name email role avatar')
        .populate('comments.user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      Post.countDocuments({ isActive: true })
    ]);

    res.json({
      posts,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name email role avatar')
      .populate('comments.user', 'name avatar');

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.upvotePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    const userId = req.user._id;
    const index = post.upvotes.indexOf(userId);

    if (index > -1) {
      post.upvotes.splice(index, 1);
    } else {
      post.upvotes.push(userId);
    }

    await post.save();
    await post.populate('author', 'name email role avatar');

    res.json({ post, upvoted: index === -1 });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    post.comments.push({
      user: req.user._id,
      text
    });

    await post.save();
    await post.populate('author', 'name email role avatar');
    await post.populate('comments.user', 'name avatar');

    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.sharePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    post.shares += 1;
    await post.save();

    res.json({ shares: post.shares });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    // Cloudinary images are managed via the Cloudinary dashboard.
    // Local deletion is removed for Vercel compatibility.
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

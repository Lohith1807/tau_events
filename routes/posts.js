const router = require('express').Router();
const postController = require('../controllers/postController');
const { auth } = require('../middleware/auth');
router.post('/', auth, postController.createPost);

router.get('/', auth, postController.getAllPosts);
router.get('/:id', auth, postController.getPostById);
router.put('/:id/upvote', auth, postController.upvotePost);
router.post('/:id/comment', auth, postController.addComment);
router.put('/:id/share', auth, postController.sharePost);
router.delete('/:id', auth, postController.deletePost);

module.exports = router;

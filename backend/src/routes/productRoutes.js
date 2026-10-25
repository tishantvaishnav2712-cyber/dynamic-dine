const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  resetProductPrice,
  deleteProduct,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', protect, authorize('admin'), createProduct);
router.put('/:id', updateProduct);
router.post('/:id/reset', resetProductPrice);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;

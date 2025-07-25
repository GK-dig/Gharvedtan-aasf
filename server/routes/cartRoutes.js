const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.post('/add', cartController.addToCart);
router.get('/:userId', cartController.getCart);
router.delete('/remove', cartController.removeFromCart);
router.put('/update', cartController.updateQuantity);
router.post('/clear', cartController.clearCart);

module.exports = router;

const express = require('express');
const router = express.Router();

const qr = require('../controllers/verify')
const checkQR = require('../middlewares/qr')

// router.get('/qr', checkAuth, qr.getQR);
router.post('/qr', checkQR, qr.verifyQR);
router.post('/pin', checkQR, qr.verifyPIN);

module.exports = router
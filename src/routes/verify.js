const express = require('express');
const router = express.Router();

const qr = require('../controllers/verify')
const checkQR = require('../middlewares/qr')

const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();

// router.get('/qr', checkAuth, qr.getQR);
router.post('/qr', checkQR, qr.verifyQR);
router.post('/pin', checkQR, qr.verifyPIN);
router.post('/face', multipartMiddleware, qr.verifyFace);

module.exports = router
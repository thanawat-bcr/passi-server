const express = require('express');
const router = express.Router();

const qr = require('../controllers/qr')
const checkAuth = require('../middlewares/auth')

router.get('/', checkAuth, qr.getQR);
router.post('/verify',checkAuth , qr.verifyQR);

module.exports = router
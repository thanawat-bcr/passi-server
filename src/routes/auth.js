const express = require('express');
const router = express.Router();

const auth = require('../controllers/auth')

const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();

router.post('/login', auth.login);
router.post('/verify', multipartMiddleware, auth.verify);
router.post('/enroll', multipartMiddleware, auth.enroll);
router.post('/register', auth.register);

module.exports = router
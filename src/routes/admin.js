const express = require('express');
const router = express.Router();

const admin = require('../controllers/admin')

const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();

router.get('/passports', admin.getPassports);
router.get('/users', admin.getUsers);
router.post('/reset', multipartMiddleware, admin.resetAll);
router.post('/revoke', admin.revokePassport);
router.post('/confusion', admin.getConfusion);

module.exports = router
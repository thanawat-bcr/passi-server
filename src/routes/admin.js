const express = require('express');
const router = express.Router();

const admin = require('../controllers/admin')

router.get('/passports', admin.getPassports);
router.get('/users', admin.getUsers);
router.post('/reset', admin.resetAll);
router.post('/revoke', admin.revokePassport);

module.exports = router
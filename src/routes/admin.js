const express = require('express');
const router = express.Router();

const admin = require('../controllers/admin')

router.post('/reset', admin.resetAll);

module.exports = router
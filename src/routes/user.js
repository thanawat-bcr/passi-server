const express = require('express');
const router = express.Router();

const user = require('../controllers/user')
const checkAuth = require('../middlewares/auth')

router.get('/', user.getUsers);
router.get('/pin', checkAuth, user.getPin);
router.post('/pin', checkAuth, user.updatePin);

module.exports = router
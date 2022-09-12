const express = require('express');
const router = express.Router();

const kairos = require('../controllers/kairos')

const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();

router.get('/subject', kairos.getSubjects);
router.post('/remove', kairos.removeSubject);
router.post('/verify', multipartMiddleware, kairos.verify);
router.post('/enroll', multipartMiddleware, kairos.enroll);

module.exports = router
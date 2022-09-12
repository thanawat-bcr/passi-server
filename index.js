const fs = require('fs');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const multipart = require('connect-multiparty');
var bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
var http = require('http');
var https = require('https');
var privateKey  = fs.readFileSync('./cert/privkey1.pem', 'utf8');
var certificate = fs.readFileSync('./cert/cert1.pem', 'utf8');
var credentials = {key: privateKey, cert: certificate};

const auth = require("./src/middlewares/auth");

require('dotenv').config() 

const axios = require('axios');
const kairosAxios = require('axios');

kairosAxios.defaults.headers.common['app_id'] = process.env.KAIROS_APP_ID
kairosAxios.defaults.headers.common['app_key'] = process.env.KAIROS_APP_KEY
kairosAxios.defaults.headers.common['Content-Type'] = 'application/json'

const conn = require("./src/services/db");

const authRouter = require('./src/routes/auth')
const userRouter = require('./src/routes/user')

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/auth', authRouter);
app.use('/user', userRouter);

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

// Multiparty middleware
const multipartMiddleware = multipart();

// TEST API
app.get('/test', (req, res) =>  res.status(200).json({ status: 'success' }))
app.post('/test', (req, res) =>  res.status(200).json({ status: 'success' }))

// GET ALL GALLERIES ✅
app.get('/kairos/galleries', async (req, res) => {
    console.log('[GET] /kairos/galleries');
    try {
        const result = await kairosAxios.post('https://api.kairos.com/gallery/list_all')
        console.log('SUCCESS 😀');
        return res.status(200).json({ status: 'SUCCESS', galleries: result.data.gallery_ids })
    } catch(err) {
        console.log('SOMETHING_WENT_WRONG 😢', err); return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' });
    }
});

// GET ALL SUBJECTS IN GALLERY ✅
app.get('/kairos/gallery', async (req, res) => {
    console.log('[GET] /kairos/gallery');
    try {
        const result = await kairosAxios.post('https://api.kairos.com/gallery/view', {
            gallery_name: process.env.KAIROS_GALLERY_NAME
        })
        console.log('SUCCESS 😀');
        return res.status(200).json({ status: 'SUCCESS', passports: result.data.subject_ids })
    } catch(err) {
        console.log('SOMETHING_WENT_WRONG 😢', err); return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' });
    }
});

// GET ALL SUBJECTS IN GALLERY ✅
app.post('/kairos/remove', async (req, res) => {
    console.log('[POST] /kairos/remove');
    try {
        const result = await kairosAxios.post('https://api.kairos.com/gallery/remove_subject', {
            gallery_name: process.env.KAIROS_GALLERY_NAME,
            subject_id: req.body.passport
        })
        console.log('SUCCESS 😀');
        return res.status(200).json({ status: 'SUCCESS' })
    } catch(err) {
        console.log('SOMETHING_WENT_WRONG 😢', err); return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' });
    }
});

// ENROLL FACE BY SUBJECT_ID ✅
app.post('/kairos/enroll',multipartMiddleware , async (req, res) => {
    console.log('[POST] /kairos/enroll');
    if(!req.files.image?.path) {
        console.log('IMAGE_NOT_FOUND 😉');
        return res.status(400).json({status: "IMAGE_NOT_FOUND"});
    }
    let base64image = fs.readFileSync(req.files.image.path, 'base64');
    var params = {
        image: base64image,
        gallery_name: process.env.KAIROS_GALLERY_NAME,
        subject_id: req.body.subject_id,
    };
    try {
        const result = await kairosAxios.post('https://api.kairos.com/enroll', params)
        console.log('FACE_ENROLLED 😀');
        return res.status(200).json({ status: 'SUCCESS' })
    } catch(err) {
        console.log('SOMETHING_WENT_WRONG 😢', err); return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' });
    }
});

// VERIFY FACE BY SUBJECT_ID ✅
app.post('/kairos/verify',multipartMiddleware , async (req, res) => {
    console.log('[POST] /kairos/verify');
    if(!req.files.image?.path) {
        console.log('IMAGE_NOT_FOUND 😉');
        return res.status(400).json({status: "IMAGE_NOT_FOUND"});
    }
    let base64image = fs.readFileSync(req.files.image.path, 'base64');
    var params = {
        image: base64image,
        gallery_name: process.env.KAIROS_GALLERY_NAME,
        subject_id: req.body.subject_id,
    };
    try {
        const result = await kairosAxios.post('https://api.kairos.com/verify', params)
        // CHECK AT CONFIDENCE MUST BE GREATER THAN 60%
        const status = result.data.images[0].transaction.confidence > 0.6
        if(status) {
            console.log('FACE_VERIFIED 😀');
            return res.status(200).json({ status: 'SUCCESS' })
        } else {
            console.log('FACE_VERIFICATION_FAILED 🥲');
            return res.status(400).json({ status: "FACE_VERIFICATION_FAILED" })
        }
    } catch(err) {
        console.log('SOMETHING_WENT_WRONG 😢', err); return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' });
    }
});


httpServer.listen(8080);
httpsServer.listen(8443);
console.log('Listening on');
console.log(':: http://localhost:8080');
console.log(':: https://passi-api.tutorism.me:8443');
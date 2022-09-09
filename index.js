const fs = require('fs');
const cors = require('cors');
const express = require('express');
const JSONStream = require('JSONStream');
const bodyParser = require('body-parser');
const multipart = require('connect-multiparty');
var bcrypt = require('bcryptjs');
var http = require('http');
var https = require('https');
var privateKey  = fs.readFileSync('./cert/privkey1.pem', 'utf8');
var certificate = fs.readFileSync('./cert/cert1.pem', 'utf8');
var credentials = {key: privateKey, cert: certificate};

require('dotenv').config() 

const axios = require('axios');
const kairosAxios = require('axios');

kairosAxios.defaults.headers.common['app_id'] = process.env.KAIROS_APP_ID
kairosAxios.defaults.headers.common['app_key'] = process.env.KAIROS_APP_KEY
kairosAxios.defaults.headers.common['Content-Type'] = 'application/json'

const conn = require("./services/db");


const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

// Multiparty middleware
const multipartMiddleware = multipart();

// TEST API
app.get('/test', (req, res) => {
    console.log("TEST API: GET!");
    return res.status(200).json({ status: 'success' })
})
app.post('/test', (req, res) => {
    console.log("TEST API: POST!");
    return res.status(200).json({ status: 'success' })
})
app.get('/cat', async (req, res) => {
    console.log("TEST API: CAT 😾");
    try {
        const response = await axios.get("https://catfact.ninja/fact")
        return res.status(200).json({ status: 'success', data: response.data })
    }
    catch (err) {
        return res.status(400).json({ status: err })
    }
})
app.get('/mysql', async (req, res) => {
    console.log("TEST API: MYSQL 🦭");
    conn.query("SELECT passport_no FROM passport;", function (err, data, fields) {
        if(err) return res.json({'status' : err});
        return res.status(200).json({
            status: "success",
            length: data?.length,
            data: data,
        });
    });
})
app.post('/image/file', multipartMiddleware, async (req, res) => {
    console.log('TEST API: IMAGE FILE 🙂');
    if(!req.files.image?.path) {
        console.log('IMAGE_NOT_FOUND 😉');
        return res.status(400).json({status: "IMAGE_NOT_FOUND"});
    }
    let base64image = fs.readFileSync(req.files.image.path, 'base64');
    var params = {
        image: base64image,
        gallery_name: process.env.KAIROS_GALLERY_NAME,
        subject_id: 'AB1325944',
    };
    try {
        const result = await kairosAxios.post('https://api.kairos.com/verify', params)
        // CHECK AT CONFIDENCE MUST BE GREATER THAN 60%
        const status = result.data.images[0].transaction.confidence > 0.6
        if(status) {
            console.log('FACE VERIFIED SUCCESS 😉');
            return res.status(200).json({status: "SUCCESS"});
        } else {
            console.log('FACE VERIFIED FAILED 🥲');
            return res.status(200).json({ status: "FAILED" })
        }
    } catch(err) {
        console.log(err);
        return res.status(400).json({ status: err })
    }
});
app.post('/image/base64', async (req, res) => {
    console.log('TEST API: IMAGE BASE64 🙂');
    if(!req.body.image) {
        console.log('IMAGE_NOT_FOUND 😉');
        return res.status(400).json({status: "IMAGE_NOT_FOUND"});
    }
    var params = {
        image: req.body.image,
        gallery_name: process.env.KAIROS_GALLERY_NAME,
        subject_id: 'AB1325944',
    };
    try {
        const result = await kairosAxios.post('https://api.kairos.com/verify', params)
        // CHECK AT CONFIDENCE MUST BE GREATER THAN 60%
        const status = result.data.images[0].transaction.confidence > 0.6
        if(status) {
            console.log('FACE VERIFIED SUCCESS 😉');
            return res.status(200).json({status: "SUCCESS"});
        } else {
            console.log('FACE VERIFIED FAILED 🥲');
            return res.status(200).json({ status: "FAILED" })
        }
    } catch(err) {
        console.log(err);
        return res.status(400).json({ status: err })
    }
});

// REGISTER USER ✅
app.post('/user/register', (req, res) => {
    console.log('[POST] /user/register');
    const { email, password, pin, passport } = req.body;

    var saltPassword = bcrypt.genSaltSync(10);
    var hashedPassword = bcrypt.hashSync(password, saltPassword);
    var saltPin = bcrypt.genSaltSync(10);
    var hashedPin = bcrypt.hashSync(pin, saltPin);

    conn.query(`INSERT INTO user (email, password, pin, passport) VALUES ('${email}', '${hashedPassword}', '${hashedPin}', '${passport}');`, function (err, data, fields) {
        if(err) { console.log('SOMETHING_WENT_WRONG 😢', err); return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' }); }
        console.log('USER_CREATED 😀');
        return res.status(201).json({status: "SUCCESS"});
    });
})
// LOGIN USER ✅
app.post('/user/login', (req, res) => {
    console.log('[POST] /user/login');
    const { email, password } = req.body;

    conn.query(`SELECT password, passport FROM user WHERE email = '${email}';`, function (err, data, fields) {
        if(err) { console.log('SOMETHING_WENT_WRONG 😢', err); return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' }); }
        if(data.length === 0) {
            console.log('USER_NOT_FOUND 😢');
            return res.status(400).json({ status: 'USER_NOT_FOUND' })
        }
        bcrypt.compare(password, data[0].password).then((result) => {
            if (result) {
                console.log('USER_LOGIN 😀');
                return res.status(200).json({ status: 'SUCCESS', passport: data[0].passport })
            } else {
                console.log('WRONG_PASSWORD 😢');
                return res.status(401).json({ status: 'WRONG_PASSWORD' })
            }
        }).catch((err) => {
            console.log('SOMETHING_WENT_WRONG 😢', err);
            return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' })
        })
    });
})
// CHECK USER EMAIL ✅
app.post('/user/email', (req, res) => {
    console.log('[POST] /user/email');
    const { email } = req.body;
    conn.query(`SELECT email FROM user WHERE email = '${email}';`, function (err, data, fields) {
        if(err) { console.log('SOMETHING_WENT_WRONG 😢', err); return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' }); }
        if(data.length > 0) {
            console.log('EMAIL_ALREADY_EXISTS 😢');
            return res.status(400).json({ status: 'EMAIL_ALREADY_EXISTS' })
        }
        console.log('EMAIL_AVAILABLE 😀');
        return res.status(200).json({ status: 'SUCCESS' })
    });
})
// USER LIST ✅
app.get('/user', (req, res) => {
    console.log('[GET] /user/list');
    conn.query(`SELECT email, passport FROM user;`, function (err, data, fields) {
        if(err) { console.log('SOMETHING_WENT_WRONG 😢', err); return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' }); }
        console.log('SUCCESS 😀');
        return res.status(200).json({
            status: 'SUCCESS',
            user: data,
        });
    });
})

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
        return res.status(200).json({ status: 'SUCCESS', galleries: result.data.subject_ids })
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
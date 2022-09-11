const fs = require('fs');
const cors = require('cors');
const express = require('express');
const JSONStream = require('JSONStream');
const bodyParser = require('body-parser');
const multipart = require('connect-multiparty');
var bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
var http = require('http');
var https = require('https');
var privateKey  = fs.readFileSync('./cert/privkey1.pem', 'utf8');
var certificate = fs.readFileSync('./cert/cert1.pem', 'utf8');
var credentials = {key: privateKey, cert: certificate};

const auth = require("./middleware/auth");

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

// REGISTER USER ⚠️ SCAN QR CODE -> VERIFY FACE WITH SUBJECT_ID FROM QR -> REGISTER EMAIL + PASSWORD
app.post('/user/verify', multipartMiddleware, async (req, res) => {
    console.log('[POST] /user/verify');
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
            console.log('FACE VERIFIED SUCCESS 😉');
            return res.status(200).json({status: "SUCCESS"});
        } else {
            console.log('FACE VERIFIED FAILED 🥲');
            return res.status(400).json({ status: "FAILED" })
        }
    } catch(err) {
        console.log('SOMETHING_WENT_WRONG 😢', err); return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' });
    }
});

app.post('/user/register', (req, res) => {
    console.log('[POST] /user/register');
    const { email, password, passport } = req.body;

    if (!(email && password && passport)) {
        console.log('FIELDS_ARE_REQUIRED 😢'); return res.status(400).json({ status: 'FIELDS_ARE_REQUIRED' });
    }

    var saltPassword = bcrypt.genSaltSync(10);
    var hashedPassword = bcrypt.hashSync(password, saltPassword);

    conn.query(
        `INSERT INTO user (email, password, passport) VALUES ('${email}', '${hashedPassword}', '${passport}');`,
        function (err, data, fields) {
            // ER_DUP_ENTRY -> MAIL IN USED OR PASSPORT IN USED
            // ER_NO_REFERENCED_ROW_2 -> PASSPORT NOT FOUND [PASSPORT1234, AB1325944]
            if(err) { 
                console.log(err.code)
                if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ status: 'PASSPORT_NOT_FOUND' });
                if (err.code === 'ER_DUP_ENTRY' && err.sqlMessage.split('\'')[1] === email) return res.status(400).json({ status: 'EMAIL_ALREADY_USED' });
                if (err.code === 'ER_DUP_ENTRY' && err.sqlMessage.split('\'')[1] === passport) return res.status(400).json({ status: 'PASSPORT_ALREADY_USED' });
                return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' });
            }
            console.log('USER_CREATED 😀', data.insertId);
            const token = jwt.sign(
                { id: data.insertId, email }, process.env.TOKEN_KEY,
                { expiresIn: "1h" }
            );
            return res.status(201).json({ status: 'SUCCESS', token: token })
        });
})

app.post('/user/login', (req, res) => {
    console.log('[POST] /user/login');
    const { email, password } = req.body;

    if (!(email && password)) {
        console.log('FIELDS_ARE_REQUIRED 😢'); return res.status(400).json({ status: 'FIELDS_ARE_REQUIRED' });
    }

    conn.query(
        `SELECT id, password FROM user WHERE email = '${email}';`,
        function (err, data, fields) {
            if(err) { 
                console.log(err.code)
                return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' });
            }
            if (data.length === 0) return res.status(400).json({ status: 'USER_NOT_FOUND' });
            bcrypt.compare(password, data[0].password).then((result) => {
                if (result) {
                    console.log('USER_LOGIN 😀');
                    const token = jwt.sign(
                        { id: data[0].id, email }, process.env.TOKEN_KEY,
                        { expiresIn: '1h' }
                    );
                    return res.status(200).json({ status: 'SUCCESS', token: token })
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

app.get('/user/pin', auth, (req, res) => {
    console.log('[GET] /user/pin');

    const { id } = req.user;

    conn.query(
        `SELECT pin FROM user WHERE id = ${id};`,
        function (err, data, fields) {
            if(err) { 
                console.log(err)
                return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' });
            }
            if (!data[0].pin) return res.status(400).json({ status: 'PIN_NOT_CREATED' });
            return res.status(200).json({ status: 'SUCCESS' })
        });
})

app.post('/user/pin', auth, (req, res) => {
    console.log('[POST] /user/pin');

    const { id } = req.user;
    const { pin } = req.body;

    if (!(pin)) {
        console.log('FIELDS_ARE_REQUIRED 😢'); return res.status(400).json({ status: 'FIELDS_ARE_REQUIRED' });
    }

    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(pin, salt);
    console.log(hash)

    conn.query(
        `UPDATE user SET pin = '${hash}' WHERE id = '${id}';`,
        function (err, data, fields) {
            if(err) { 
                console.log(err)
                return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' });
            }
            console.log('PIN_CREATED 😀');
            return res.status(201).json({ status: 'SUCCESS' })
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
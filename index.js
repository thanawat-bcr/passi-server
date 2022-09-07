const fs = require('fs');
const cors = require('cors');
const express = require('express');
const JSONStream = require('JSONStream');
const bodyParser = require('body-parser');
const multipart = require('connect-multiparty');

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
app.post('/image', multipartMiddleware, (req, res) => {
    console.log('TEST API: IMAGE 🙂');
    // let base64image = fs.readFileSync(req.files.image.path, 'base64');
    console.log(req.files.image)
    return res.status(200).json({ status: 'success' })
})

// REGISTER USER ✅
app.post('/user/register', (req, res) => {
    const { user_id, passport_no } = req.body;
    // console.log(user_id, passport_no);
    // res.status(200).json({ status: "success" });

    conn.query(`INSERT INTO user (id, passport_id) VALUES ('${user_id}', '${passport_no}');`, function (err, data, fields) {
        if(err) return res.status(400).json({'status' : err});
        console.log('USER INSERTED 😀');
        return res.status(201).json({status: "success"});
    });
})
// LOGIN USER ✅
app.post('/user/login', (req, res) => {
    const { user_id } = req.body;

    conn.query(`SELECT face_verified, pin, passport_id FROM user WHERE id = '${user_id}';`, function (err, data, fields) {
        if(err) return res.status(400).json({'status' : err});
        if(data.length === 0) return res.status(404).json({ error: 'NO_USER'});
        if(data[0].face_verified === 0) return res.status(401).json({ error: 'NO_FACE_VERIFIED'});
        if(!data[0].pin) return res.status(401).json({ error: 'NO_PIN_CREATED'});
        console.log('USER LOGIN 😀');
        return res.status(200).json({
            status: "success",
            passport: data[0].passport_id,
        });
    });
})
// USER PASSPORT ✅
app.post('/user/passport', (req, res) => {
    const { user_id } = req.body;

    conn.query(`SELECT passport_id FROM user WHERE id = '${user_id}';`, function (err, data, fields) {
        if(err) return res.status(400).json({'status' : err});
        console.log('USER PASSPORT 😀');
        return res.status(200).json({
            status: "success",
            passport: data[0].passport_id,
        });
    });
})

// GET ALL GALLERIES ✅
app.get('/kairos/galleries', async (req, res) => {
    console.log('GET ALL GALLERIES 🎒');
    try {
        const result = await kairosAxios.post('https://api.kairos.com/gallery/list_all')
        return res.json(result.data);
    } catch(err) {
        console.log(err);
        return res.json({'status' : false});
    }
});

// GET ALL SUBJECTS IN GALLERY ✅
app.get('/kairos/gallery', async (req, res) => {
    console.log(`GET ALL SUBJECTS IN ${req.query.gallery_name} GALLERY 👨`);
    try {
        const result = await kairosAxios.post('https://api.kairos.com/gallery/view', {
            gallery_name: req.query.gallery_name
        })
        return res.json(result.data);
    } catch(err) {
        console.log(err);
        return res.json({'status' : false});
    }
});

// GET ALL SUBJECTS IN GALLERY ✅
app.get('/kairos/gallery/subject', async (req, res) => {
    console.log(`GET ALL FACES OF ${req.query.subject_id} 👨`);
    try {
        const result = await kairosAxios.post('https://api.kairos.com/gallery/view_subject', {
            gallery_name: req.query.gallery_name,
            subject_id: req.query.subject_id
        })
        return res.json(result.data);
    } catch(err) {
        console.log(err);
        return res.json({'status' : false});
    }
});

// ENROLL FACE BY SUBJECT_ID ✅
app.post('/kairos/enroll',multipartMiddleware , async (req, res) => {
    console.log(`ENROLL FACE BY SUBJECT_ID: ${req.body.subject_id} 👨`);
    let base64image = fs.readFileSync(req.files.image.path, 'base64');
    var params = {
        image: base64image,
        gallery_name: req.body.gallery_name,
        subject_id: req.body.subject_id,
    };
    try {
        const result = await kairosAxios.post('https://api.kairos.com/enroll', params)
        return res.json({'status': 'success', 'face_id': result.data.face_id});
    } catch(err) {
        console.log(err);
        return res.json({'status' : false});
    }
});

// VERIFY FACE BY SUBJECT_ID ✅
app.post('/kairos/verify',multipartMiddleware , async (req, res) => {
    console.log(`VERIFY FACE BY SUBJECT_ID: ${req.body.subject_id} 👨`);
    let base64image = fs.readFileSync(req.files.image.path, 'base64');
    var params = {
        image: base64image,
        gallery_name: req.body.gallery_name,
        subject_id: req.body.subject_id,
    };
    try {
        const result = await kairosAxios.post('https://api.kairos.com/verify', params)
        // CHECK AT CONFIDENCE MUST BE GREATER THAN 60%
        const status = result.data.images[0].transaction.confidence > 0.6
        if(status) {
            conn.query(`UPDATE user SET face_verified = ${status} WHERE passport_id = '${req.body.subject_id}';`, function (err, data, fields) {
                if(err) return res.status(400).json({'status' : err});
                console.log('FACE VERIFIED 😀');
                return res.status(200).json({
                    status: "success"
                });
            });
        } else {
            console.log('FACE VERIFIED FAILED 🥲');
            return res.status(400).json({ status: "FAILED" })
        }
    } catch(err) {
        console.log(err);
        return res.status(400).json({ status: err })
    }
});


app.listen(3128);
console.log('Listening on localhost:3128');
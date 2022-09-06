const fs = require('fs');
const cors = require('cors');
const express = require('express');
const JSONStream = require('JSONStream');
const bodyParser = require('body-parser');
const multipart = require('connect-multiparty');
const axios = require('axios');
const kairosAxios = require('axios');

kairosAxios.defaults.headers.common['app_id'] = '68b0c0ea'
kairosAxios.defaults.headers.common['app_key'] = '3e1615c6719a7b955cb417ba8045f4e1'
kairosAxios.defaults.headers.common['Content-Type'] = 'application/json'

var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'passi.sit.kmutt.ac.th',
    user     : 'tutor',
    password : 'Tutor1234*',
    database : 'passi'
});

connection.connect(function(err) {
    if (err) {
    console.error('error connecting: ' + err.stack);
    return;
}

    console.log('connected as id ' + connection.threadId);
});


const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Multiparty middleware
const multipartMiddleware = multipart();

// TEST API
app.get('/test', (req, res) => { console.log("TEST GET!"); return res.send('HELLO TEST'); })
app.post('/test', (req, res) => { console.log("TEST POST!"); return res.send('HELLO TEST'); })
app.get('/cat', async (req, res) => {
    try {
        const response = await axios.get("https://catfact.ninja/fact")
        res.json(response.data)
    }
    catch (err) {
        console.log(err)
    }
})
app.get('/mysql', async (req, res) => {
    // connection.query('SELECT * FROM passport', function (error, results, fields) {
    //     console.log('The results is: ', results);
    //     return res.json({ 'status': true })
    // });
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
        console.log(result.data.images[0].transaction.confidence)
        return res.json({'status': result.data.images[0].transaction.confidence > 0.6});
    } catch(err) {
        console.log(err);
        return res.json({'status' : false});
    }
});


app.listen(3128);
connection.end();
console.log('Listening on localhost:3128');
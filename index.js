const fs = require('fs');
const cors = require('cors');
const express = require('express');
const Kairos = require('kairos-api');
const JSONStream = require('JSONStream');
const bodyParser = require('body-parser');
const multipart = require('connect-multiparty');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Multiparty middleware
const multipartMiddleware = multipart();

// API Configurations for KAIROS - PASSI
let kairos_client = new Kairos('68b0c0ea', '3e1615c6719a7b955cb417ba8045f4e1');

// TEST API
app.get('/test', (req, res) => { console.log("TEST GET!"); return res.send('HELLO TEST'); })
app.post('/test', (req, res) => { console.log("TEST POST!"); return res.send('HELLO TEST'); })

// ENROLL FACE INTO GALLRY
app.post('/enroll', multipartMiddleware, function(req, res) {
    let base64image = fs.readFileSync(req.files.image.path, 'base64');
    var params = {
        image: base64image,
        subject_id: req.body.name,
        gallery_name: req.body.gallery_name,
    };
    console.log('POST: Enroll Face');
    kairos_client.enroll(params).then(function(result) {
        // console.log('Image Attributes : \n' + JSON.stringify(result.body));
        return res.json({'status' : true });
    }).catch(function(err) {
        console.log(err);
        return res.json({'status' : false});
    });
});

// VERIFY FACE FROM GALLRY
app.post('/verify', multipartMiddleware, function(req, res) {
    let base64image = fs.readFileSync(req.files.image.path, 'base64');
    var params = {
        image: base64image,
        subject_id: req.body.name,
        gallery_name: req.body.gallery_name,
    };
    console.log('POST: Verify Face', req.body.name);
    kairos_client.verify(params).then(function(result) {
        // console.log('Server responded with : \n' + JSON.stringify(result));
        return res.json(result.body);
    }).catch(function(err) { 
        console.log(err);
        return res.json({'status' : false});
    });  
});

// GET SUBJECT FROM GALLERY
app.get('/kairos/gallery', function(req, res) {
    var params = {
        gallery_name: req.query.gallery_name,
    };
    console.log('GET: All subjects from', req.query.gallery_name);
    kairos_client.galleryView(params).then(function(result) {
        // console.log('Server responded with : \n' + JSON.stringify(result));
        return res.json(result.body);
    }).catch(function(err) { 
        console.log(err);
        return res.json({'status' : false});
    });  
});

// GET ALL GALLERIES
app.get('/kairos/galleries', function(req, res) {
    console.log('GET: All galleries');
    kairos_client.galleryListAll().then(function(result) {
        // console.log('Server responded with : \n' + JSON.stringify(result));
        return res.json(result.body);
    }).catch(function(err) { 
        console.log(err);
        return res.json({'status' : false});
    });  
});


app.listen(3128);
console.log('Listening on localhost:3128');
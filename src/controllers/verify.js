require('dotenv').config() 
var bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const knex = require("../services/db");

const config = process.env;

const fs = require('fs');
const kairosAxios = require('axios');

// Verify QR
async function verifyQR(req, res, next) {
    console.log('[POST] /verify/qr');
    const { id } = req.user;

    try {
        const timer = Number(process.env.JWT_PIN_REQUEST);
        const token = jwt.sign(
            { id }, process.env.TOKEN_KEY,
            { expiresIn: timer }
        );
        return res.status(200).json({ status: 'SUCCESS', token, timer })
    } catch(err) {
        console.log('SOMETHING_WENT_WRONG 😢', err);
        return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' })
    }
}

// Verify PIN
async function verifyPIN(req, res, next) {
    console.log('[POST] /verify/pin');
    const { id } = req.user;
    const { pin } = req.body;

    if (!(pin)) {
        console.log('FIELDS_ARE_REQUIRED 😢'); return res.status(400).json({ status: 'FIELDS_ARE_REQUIRED' });
    }

    try {
        const user = await knex.first('users.id', 'users.passport', 'passports.id', 'passports.passport_no', 'date_of_birth', 'name', 'surname', 'nationality', 'pin', 'check_in_at')
                                .from('users')
                                .join('passports', { 'passports.id': 'users.passport' })
                                .where({ 'users.id': id })
        if (!user) return res.status(404).json({ status: 'USER_NOT_FOUND' })
        const result = await bcrypt.compare(pin, user.pin)
        if (result) {
            const { name, surname, date_of_birth, passport_no } = user
            const dob = `${date_of_birth}`.split(" ").slice(1, 4).join(" ");
            return res.status(200).json({ status: 'SUCCESS', user: {
                passport: passport_no,
                name: `${name} ${surname}`,
                dob: dob,
            } })
        } else {
            return res.status(400).json({ status: 'PIN_NOT_MATCHED' })
        }
    } catch(err) {
        console.log('SOMETHING_WENT_WRONG 😢', err);
        return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' })
    }
}

// Verify FACE
async function verifyFace(req, res, next) {
    console.log('[POST] /verify/face');

    if (!req.body.token) {
        return res.status(403).send("A token is required for authentication");
    }
    if(!req.files.image?.path) {
        console.log('IMAGE_NOT_FOUND 😉');
        return res.status(400).json({status: "IMAGE_NOT_FOUND"});
    }

    try {
        const decoded = jwt.verify(req.body.token, config.TOKEN_KEY);
        req.user = decoded;
    } catch (err) {
        return res.status(401).send("Invalid Token");
    }
    const { id } = req.user;

    try {
        const user = await knex.first('users.id', 'users.passport', 'passports.id', 'passports.passport_no', 'date_of_birth', 'name', 'surname', 'nationality', 'pin', 'check_in_at')
                                .from('users')
                                .join('passports', { 'passports.id': 'users.passport' })
                                .where({ 'users.id': id })
        if (!user) return res.status(404).json({ status: 'USER_NOT_FOUND' })
        let base64image = fs.readFileSync(req.files.image.path, 'base64');
        var params = {
            image: base64image,
            gallery_name: process.env.KAIROS_GALLERY_NAME,
            subject_id: `${user.passport}`,
        };

        const result = await kairosAxios.post('https://api.kairos.com/verify', params)
        // CHECK AT CONFIDENCE MUST BE GREATER THAN 70%
        const confidence = result.data.images[0].transaction.confidence
        const status = confidence > 0.7
        if (status) {
            const { name, surname, date_of_birth, passport_no } = user
            const dob = `${date_of_birth}`.split(" ").slice(1, 4).join(" ");
            return res.status(200).json({ status: 'SUCCESS', user: {
                passport: passport_no,
                name: `${name} ${surname}`,
                dob: dob,
                similarity: confidence,
            } })
        } else {
            return res.status(400).json({ status: 'FACE_NOT_MATCHED', similarity: confidence })
        }
    } catch(err) {
        console.log('SOMETHING_WENT_WRONG 😢', err);
        return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' })
    }
}

module.exports = {
    verifyQR,
    verifyPIN,
    verifyFace,
}
require('dotenv').config() 
var bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const knex = require("../services/db");

// GET QR
async function getQR(req, res, next) {
    // console.log('[GET] /qr');
    const { id } = req.user;

    try {
        const user = await knex.first('id', 'passport').from('user').where({ id })
        if (!user) return res.status(404).json({ status: 'USER_NOT_FOUND' })

        const token = jwt.sign(
            { id, passport: user.passport }, process.env.TOKEN_KEY,
            { expiresIn: '30s' }
        );
        return res.status(200).json({ status: 'SUCCESS', token })
    } catch(err) {
        console.log('SOMETHING_WENT_WRONG 😢', err);
        return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' })
    }
}

// VERIFY QR + PIN
// async function verifyQR(req, res, next) {
//     console.log('[POST] /qr/verify');
//     const { id } = req.user;
//     const { pin } = req.body;

//     if (!(pin)) {
//         console.log('FIELDS_ARE_REQUIRED 😢'); return res.status(400).json({ status: 'FIELDS_ARE_REQUIRED' });
//     }

//     try {
//         const user = await knex.first('id', 'passport', 'name', 'surname', 'nationality', 'pin').from('user').join('passport', { 'passport.passport_no': 'user.passport' }).where({ 'user.id': id })
//         if (!user) return res.status(404).json({ status: 'USER_NOT_FOUND' })
//         const result = await bcrypt.compare(pin, user.pin)
//         if (result) {
//             const { passport, name, surname, nationality } = user
//             return res.status(200).json({ status: 'SUCCESS', user: { passport, name, surname, nationality }})
//         } else {
//             return res.status(400).json({ status: 'PIN_NOT_MATCHED' })
//         }
//     } catch(err) {
//         console.log('SOMETHING_WENT_WRONG 😢', err);
//         return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' })
//     }
// }

// Verify QR Only
async function verifyQR(req, res, next) {
    console.log('[POST] /qr/verify');
    const { id } = req.user;

    try {
        const user = await knex.first('id', 'passport', 'name', 'surname', 'nationality').from('user').join('passport', { 'passport.passport_no': 'user.passport' }).where({ 'user.id': id })
        if (!user) return res.status(404).json({ status: 'USER_NOT_FOUND' })

        const { passport, name, surname, nationality } = user

        return res.status(200).json({ status: 'SUCCESS', user: { passport, name, surname, nationality }})
    } catch(err) {
        console.log('SOMETHING_WENT_WRONG 😢', err);
        return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' })
    }
}

module.exports = {
    getQR,
    verifyQR,
}
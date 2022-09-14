require('dotenv').config() 
var bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const knex = require("../services/db");

// LOGIN
async function login(req, res, next) {
    console.log('[POST] /auth/login');
    const { email, password } = req.body;

    if (!(email && password)) {
        console.log('FIELDS_ARE_REQUIRED 😢'); return res.status(400).json({ status: 'FIELDS_ARE_REQUIRED' });
    }

    try {
        const user = await knex.first('id', 'password').from('user').where({ email })
        if (!user) return res.status(404).json({ status: 'USER_NOT_FOUND' })

        const result = await bcrypt.compare(password, user.password)
        if (result) {
            const token = jwt.sign({ id: user.id }, process.env.TOKEN_KEY);
            return res.status(200).json({ status: 'SUCCESS', token })
        } else {
            return res.status(400).json({ status: 'PASSWORD_NOT_MATCHED' })
        }
    } catch(err) {
        console.log('SOMETHING_WENT_WRONG 😢', err);
        return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' })
    }
}

// CHECK QR
async function checkQR(req, res, next) {
    console.log('[POST] /auth/qr');
    const { passport } = req.body;

    if (!(passport)) {
        console.log('FIELDS_ARE_REQUIRED 😢'); return res.status(400).json({ status: 'FIELDS_ARE_REQUIRED' });
    }

    try {
        const isPassportUsed = await knex.first('passport').from('user').where({ passport })
        if (isPassportUsed) return res.status(400).json({ status: 'PASSPORT_ALREADY_USED' })

        const isPassportExist = await knex.first('passport_no').from('passport').where({ passport_no: passport })
        if (!isPassportExist) return res.status(400).json({ status: 'PASSPORT_NOT_EXIST' })

        return res.status(200).json({ status: 'SUCCESS' })
    } catch(err) {
        console.log('SOMETHING_WENT_WRONG 😢', err);
        return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' })
    }
}

// REGISTER
async function register(req, res, next) {
    console.log('[POST] /auth/register');
    const { email, password, passport } = req.body;

    if (!(email && password && passport)) {
        console.log('FIELDS_ARE_REQUIRED 😢'); return res.status(400).json({ status: 'FIELDS_ARE_REQUIRED' });
    }

    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(password, salt);

    try {
        const id = await knex('user').insert({ email, password: hash, passport })

        const token = jwt.sign({ id: id[0] }, process.env.TOKEN_KEY);

        return res.status(200).json({ status: 'SUCCESS', token })
    } catch(err) {
        console.log('SOMETHING_WENT_WRONG 😢', err);
        if (err.code === 'ER_NO_REFERENCED_ROW_2')
            return res.status(400).json({ status: 'PASSPORT_NOT_FOUND' });
        if (err.code === 'ER_DUP_ENTRY' && err.sqlMessage.split('\'')[1] === email)
            return res.status(400).json({ status: 'EMAIL_ALREADY_USED' });
        if (err.code === 'ER_DUP_ENTRY' && err.sqlMessage.split('\'')[1] === passport)
            return res.status(400).json({ status: 'PASSPORT_ALREADY_USED' });
        return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' })
    }
}

module.exports = {
    login,
    register,
    checkQR
}
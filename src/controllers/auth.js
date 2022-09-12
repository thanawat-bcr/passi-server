require('dotenv').config() 
const conn = require("../services/db");
var bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

// LOGIN
async function login(req, res, next) {
    console.log('[POST] /auth/login');
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
                        // { expiresIn: '1h' }
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
}

// EMAIL REGISTER
async function register(req, res, next) {
    console.log('[POST] /auth/register');
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
                // { expiresIn: "1h" }
            );
            return res.status(201).json({ status: 'SUCCESS', token: token })
        });
}

module.exports = {
    login,
    register
}
require('dotenv').config() 
const conn = require("../services/db");
var bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

// GET QR
async function getQR(req, res, next) {
  console.log('[GET] /qr');
  const { id } = req.user;

  conn.query(
      `SELECT id, passport FROM user WHERE id = ${id};`,
      function (err, data, fields) {
          if(err) { 
              console.log(err)
              return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' });
          }
          const token = jwt.sign(
            { id, passport: data[0].passport }, process.env.TOKEN_KEY,
            { expiresIn: '3m' }
        );
          return res.status(200).json({ status: 'SUCCESS', data: token })
      });
}

// VERIFY QR
async function verifyQR(req, res, next) {
  console.log('[POST] /qr/verify');
  const { id } = req.user;
  const { pin } = req.body;

  if (!(pin)) {
    console.log('FIELDS_ARE_REQUIRED 😢'); return res.status(400).json({ status: 'FIELDS_ARE_REQUIRED' });
}
  conn.query(
    `SELECT id, passport, pin, name, surname, nationality FROM user, passport WHERE user.passport = passport.passport_no AND id = ${id};`,
    function (err, data, fields) {
        if(err) { 
            console.log(err.code)
            return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' });
        }
        if (data.length === 0) return res.status(400).json({ status: 'USER_NOT_FOUND' });
        if (!data[0].pin) return res.status(400).json({ status: 'PIN_NOT_CREATED' });
        bcrypt.compare(pin, data[0].pin).then((result) => {
            if (result) {
                const {passport, name, surname, nationality} = data[0]
                return res.status(200).json({ status: 'SUCCESS', data: { passport, name, surname, nationality }})
            } else {
                return res.status(401).json({ status: 'WRONG_PIN' })
            }
        }).catch((err) => {
            console.log('SOMETHING_WENT_WRONG 😢', err);
            return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' })
        })
    });
}

module.exports = {
  getQR,
  verifyQR,
}
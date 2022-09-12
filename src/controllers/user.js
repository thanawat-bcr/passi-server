require('dotenv').config() 
const conn = require("../services/db");
var bcrypt = require('bcryptjs');

// GET ALL USERS
async function getUsers(req, res, next) {
  console.log('[GET] /user');

  conn.query(
      `SELECT email, passport FROM user;`,
      function (err, data, fields) {
        if(err) { console.log('SOMETHING_WENT_WRONG 😢', err); return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' }); }
        console.log('SUCCESS 😀');
        return res.status(200).json({
            status: 'SUCCESS',
            user: data,
        });
      });
}

// GET PIN
async function getPin(req, res, next) {
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
}

// Update PIN
async function updatePin(req, res, next) {
  console.log('[GET] /user/pin');
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
}

module.exports = {
  getUsers,
  getPin,
  updatePin,
}
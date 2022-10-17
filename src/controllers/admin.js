require('dotenv').config()
const fs = require('fs');
const knex = require("../services/db");

const kairosAxios = require('axios');

const PASSPORTS = require('../dummy/passports')

kairosAxios.defaults.headers.common['app_id'] = process.env.KAIROS_APP_ID
kairosAxios.defaults.headers.common['app_key'] = process.env.KAIROS_APP_KEY
kairosAxios.defaults.headers.common['Content-Type'] = 'application/json'

// Reset All
async function resetAll(req, res, next) {
  console.log('[POST] /admin/reset');
  // console.log('image', req.files.tutor.path)
  // console.log('image', req.files.james.path)
  // console.log('image', req.files.fluke.path)
  try {
    // Clear Kairos
    await kairosAxios.post('https://api.kairos.com/gallery/remove', { gallery_name: process.env.KAIROS_GALLERY_NAME })

    // Enroll Admin Face
    const admins = [
      {
        image: fs.readFileSync(req.files.tutor.path, 'base64'),
        gallery_name: process.env.KAIROS_GALLERY_NAME,
        subject_id: "AB1325944",
      },
      {
        image: fs.readFileSync(req.files.fluke.path, 'base64'),
        gallery_name: process.env.KAIROS_GALLERY_NAME,
        subject_id: "AA8298121",
      },
      {
        image: fs.readFileSync(req.files.james.path, 'base64'),
        gallery_name: process.env.KAIROS_GALLERY_NAME,
        subject_id: "AC2728432",
      },
    ];
    admins.forEach(async (admin) => {
      console.log(admin.subject_id)
      await kairosAxios.post('https://api.kairos.com/enroll', admin)
    })

    // Clear Database
    await knex('users').delete()
    await knex('passports').delete()

    // Enroll Admin Passport
    PASSPORTS.forEach(async (passport) => {
      await knex('passports').insert(passport)
    })
    return res.status(200).json({ status: 'SUCCESS' })
  } catch(err) {
    console.log('SOMETHING_WENT_WRONG 😢', err);
    return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' });
  }
}

// Revoke Passport
async function revokePassport(req, res, next) {
  console.log('[POST] /admin/revoke');
  const { passport } = req.body;

  if (!(passport)) {
      console.log('FIELDS_ARE_REQUIRED 😢'); return res.status(400).json({ status: 'FIELDS_ARE_REQUIRED' });
  }
  try {
    // PASSPORT_CHECK_OUT
    var date = new Date(); // Or the date you'd like converted.
    var isoDateTime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
    var now = isoDateTime.split('.')[0]
    await knex('passports').where({ id: passport }).update({ check_out_at: now })
    
    // DELETE_USER
    await knex('users').where({ passport }).delete();

    // REMOVE FROM KAIROS
    await kairosAxios.post('https://api.kairos.com/gallery/remove_subject', {
      gallery_name: process.env.KAIROS_GALLERY_NAME,
      subject_id: `${passport}`
    })

    return res.status(200).json({ status: 'SUCCESS' })
  } catch(err) {
    console.log('SOMETHING_WENT_WRONG 😢', err);
    return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' });
  }
}

// Get Passports
async function getPassports(req, res, next) {
  console.log('[GET] /admin/passports');
  try {
    const passports = await knex.select('passports.id', 'passport_no', 'name', 'surname', 'users.email', 'check_in_at', 'check_out_at')
                                  .from('passports')
                                  .leftJoin('users' ,function() {
                                    this.on('passports.id', '=', 'users.passport')
                                  })
    return res.status(200).json({ status: 'SUCCESS', passports })
  } catch(err) {
    console.log('SOMETHING_WENT_WRONG 😢', err);
    return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' });
  }
}

// GET ALL USERS
async function getUsers(req, res, next) {
  console.log('[GET] /admin/users');

  try {
      const users = await knex.select('passport', 'email').from('users')
      if (users.length === 0) return res.status(404).json({ status: 'USERS_NOT_FOUND' })

      return res.status(200).json({ status: 'SUCCESS', users })
  } catch(err) {
      console.log('SOMETHING_WENT_WRONG 😢', err);
      return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' })
  }
}

module.exports = {
  resetAll,
  revokePassport,
  getPassports,
  getUsers,
}
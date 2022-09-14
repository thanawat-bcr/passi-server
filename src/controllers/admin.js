require('dotenv').config()
const fs = require('fs');
const knex = require("../services/db");

const kairosAxios = require('axios');

kairosAxios.defaults.headers.common['app_id'] = process.env.KAIROS_APP_ID
kairosAxios.defaults.headers.common['app_key'] = process.env.KAIROS_APP_KEY
kairosAxios.defaults.headers.common['Content-Type'] = 'application/json'

// Reset All
async function resetAll(req, res, next) {
  console.log('[POST] /admin/reset');
  try {
    await kairosAxios.post('https://api.kairos.com/gallery/remove', {
      gallery_name: process.env.KAIROS_GALLERY_NAME,
    })
    await knex('user').delete()
    await knex('passport').delete()
    // await knex('user').whereILike('passport', 'PASSI%').delete()
    // await knex('passport').whereILike('passport_no', 'PASSI%').delete()
    return res.status(200).json({ status: 'SUCCESS' })
  } catch(err) {
    console.log('SOMETHING_WENT_WRONG 😢', err);
    return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' });
  }
}

module.exports = {
  resetAll,
}
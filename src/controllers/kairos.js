require('dotenv').config()
const fs = require('fs');
const knex = require("../services/db");

const kairosAxios = require('axios');

kairosAxios.defaults.headers.common['app_id'] = process.env.KAIROS_APP_ID
kairosAxios.defaults.headers.common['app_key'] = process.env.KAIROS_APP_KEY
kairosAxios.defaults.headers.common['Content-Type'] = 'application/json'

// Get Subjects
async function getSubjects(req, res, next) {
  console.log('[GET] /kairos/gallery');
  try {
      const result = await kairosAxios.post('https://api.kairos.com/gallery/view', {
          gallery_name: process.env.KAIROS_GALLERY_NAME
      })
      console.log('SUCCESS 😀');
      return res.status(200).json({ status: 'SUCCESS', passports: result.data.subject_ids })
  } catch(err) {
      console.log('SOMETHING_WENT_WRONG 😢', err); return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' });
  }
}

// FACE VERIFICATION
async function verify(req, res, next) {
  console.log('[POST] /kairos/verify');
    if(!req.files.image?.path) {
        console.log('IMAGE_NOT_FOUND 😉');
        return res.status(400).json({status: "IMAGE_NOT_FOUND"});
    }
    let base64image = fs.readFileSync(req.files.image.path, 'base64');
    var params = {
        image: base64image,
        gallery_name: process.env.KAIROS_GALLERY_NAME,
        subject_id: req.body.passport,
    };
    try {
        const result = await kairosAxios.post('https://api.kairos.com/verify', params)
        // CHECK AT CONFIDENCE MUST BE GREATER THAN 60%
        const status = result.data.images[0].transaction.confidence > 0.6
        if(status) {
            console.log('FACE VERIFIED SUCCESS 😉');
            return res.status(200).json({status: `SUCCESS`, data: result.data.images[0].transaction.confidence });
        } else {
            console.log('FACE VERIFIED FAILED 🥲');
            return res.status(200).json({ status: `FAILED`, data: result.data.images[0].transaction.confidence })
        }
    } catch(err) {
        console.log('SOMETHING_WENT_WRONG 😢', err);
        return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' });
    }
}

// FACE ENROLLMENT
async function enroll(req, res, next) {
  console.log('[POST] /kairos/enroll');
  if(!req.files.image?.path) {
      console.log('IMAGE_NOT_FOUND 😉');
      return res.status(400).json({status: "IMAGE_NOT_FOUND"});
  }

  const { name, surname } = req.body;

  if (!(name && surname)) {
    console.log('FIELDS_ARE_REQUIRED 😢'); return res.status(400).json({ status: 'FIELDS_ARE_REQUIRED' });
  }

  let base64image = fs.readFileSync(req.files.image.path, 'base64');
  var params = {
      image: base64image,
      gallery_name: process.env.KAIROS_GALLERY_NAME,
      // subject_id: req.body.passport,
  };
  try {
      const passports = await knex.select('passport_no').from('passport').whereILike('passport_no', 'PASSI%')
      const passport_id = `0000${passports.length}`
      const passport_no = 'PASSI' + passport_id.substring(passport_id.length - 4) 
      // console.log(passport_no)
      let today = new Date().toISOString().split('T')[0]
      await knex('passport').insert({
        passport_no,
        name,
        surname,
        type: 'P',
        country_code: 'THA',
        nationality: 'THAI',
        date_of_birth: today,
        place_of_birth: 'BANGKOK',
        identification_no: '1234567890123',
        sex: 'M',
        height: '1.75',
        date_of_issue: today,
        date_of_expiry: today,
      })
      params.subject_id = passport_no;
      
      await kairosAxios.post('https://api.kairos.com/enroll', params)
      return res.status(200).json({ status: 'SUCCESS', passport: passport_no })
  } catch(err) {
      console.log('SOMETHING_WENT_WRONG 😢', err); return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' });
  }
}

// Remove Subject
async function removeSubject(req, res, next) {
  console.log('[POST] /kairos/remove');
  try {
    const result = await kairosAxios.post('https://api.kairos.com/gallery/remove_subject', {
      gallery_name: process.env.KAIROS_GALLERY_NAME,
      subject_id: req.body.passport
    })
    return res.status(200).json({ status: 'SUCCESS' })
  } catch(err) {
    console.log('SOMETHING_WENT_WRONG 😢', err);
    return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' });
  }
}

module.exports = {
  verify,
  enroll,
  getSubjects,
  removeSubject,
}
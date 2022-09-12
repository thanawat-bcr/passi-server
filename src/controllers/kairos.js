require('dotenv').config()
const fs = require('fs');

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
            return res.status(200).json({status: `SUCCESS: ${result.data.images[0].transaction.confidence}`});
        } else {
            console.log('FACE VERIFIED FAILED 🥲');
            return res.status(400).json({ status: `FAILED: ${result.data.images[0].transaction.confidence}`})
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
  let base64image = fs.readFileSync(req.files.image.path, 'base64');
  var params = {
      image: base64image,
      gallery_name: process.env.KAIROS_GALLERY_NAME,
      subject_id: req.body.passport,
  };
  try {
      const result = await kairosAxios.post('https://api.kairos.com/enroll', params)
      console.log('FACE_ENROLLED 😀');
      return res.status(200).json({ status: 'SUCCESS' })
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
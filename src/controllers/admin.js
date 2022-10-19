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
  try {
    // Clear Kairos
    await kairosAxios.post('https://api.kairos.com/gallery/remove', { gallery_name: process.env.KAIROS_GALLERY_NAME })

    // Clear Database (Keep admin - [93, 94, 95])
    await knex('users').delete()
    await knex('passports').whereNotIn('id', [93, 94, 95]).delete()

      let params = {
        image: fs.readFileSync(req.files.tutor.path, 'base64'),
        gallery_name: process.env.KAIROS_GALLERY_NAME,
        subject_id: '93',
      }
      await kairosAxios.post('https://api.kairos.com/enroll', params)
      
      params = {
        image: fs.readFileSync(req.files.james.path, 'base64'),
        gallery_name: process.env.KAIROS_GALLERY_NAME,
        subject_id: '94',
      }
      await kairosAxios.post('https://api.kairos.com/enroll', params)
      
      params = {
        image: fs.readFileSync(req.files.fluke.path, 'base64'),
        gallery_name: process.env.KAIROS_GALLERY_NAME,
        subject_id: '95',
      }
      await kairosAxios.post('https://api.kairos.com/enroll', params)

    // // Enroll Admin Passport
    // PASSPORTS.forEach(async (passport) => {
    //   const id = await knex('passports').insert({
    //     passport_no: passport.passport_no,
    //     name: passport.name,
    //     surname: passport.surname,
    //     type: passport.type,
    //     country_code: passport.country_code,
    //     nationality: passport.nationality,
    //     date_of_birth: passport.date_of_birth,
    //     place_of_birth: passport.place_of_birth,
    //     identification_no: passport.identification_no,
    //     sex: passport.sex,
    //     height: passport.height,
    //     date_of_issue: passport.date_of_issue,
    //     date_of_expiry: passport.date_of_expiry,
    //   })
    //   const params = {
    //     image: fs.readFileSync(req.files[passport.image].path, 'base64'),
    //     gallery_name: process.env.KAIROS_GALLERY_NAME,
    //     subject_id: `${id[0]}`,
    //   }
    //   await kairosAxios.post('https://api.kairos.com/enroll', params)
    // })
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


// TESTING
// FACE VERIFICATION FOR CONFUSION
async function getConfusion(req, res, next) {
  console.log('[POST] /admin/confusion');

  const ADMINS = [
    { name: 'Tutor', id: '93' },
    { name: 'James', id: '94' },
    { name: 'Fluke', id: '95' },
  ]

  const CONFIDENCE = 0.6;

  for(let i = 0; i < 30; i++) {
    const id = `0000${i + 1}`
    const name = 'James'
    const image = name + id.substring(id.length - 5) + '.jpeg'
    setTimeout(async () => {
      // console.log(image)
      let base64image = fs.readFileSync(`src/faces/test/${name}/${image}`, 'base64');
      var params = {
          image: base64image,
          gallery_name: process.env.KAIROS_GALLERY_NAME,
          subject_id: `95`,
      };
        try {
            const result = await kairosAxios.post('https://api.kairos.com/verify', params)
            // CHECK AT CONFIDENCE MUST BE GREATER THAN 60%
            const status = result.data.images[0].transaction.confidence > CONFIDENCE
            console.log(image, status ? '1' : '0', result.data.images[0].transaction.confidence)
        } catch(err) {
          console.log('SOMETHING_WENT_WRONG 😢', err);
          return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' });
        }
    }, i * 5000)
  }
  return res.status(200).json({status: `SUCCESS` });
}

// TEST JAMES FACE 

// James00001.jpeg 1 0.80782
// James00002.jpeg 1 0.71896
// James00003.jpeg 1 0.7626
// James00004.jpeg 1 0.7845
// James00005.jpeg 1 0.86563
// James00006.jpeg 1 0.75675
// James00007.jpeg 1 0.72144
// James00008.jpeg 1 0.80138
// James00009.jpeg 1 0.77896
// James00010.jpeg 1 0.82689
// James00011.jpeg 1 0.65777
// James00012.jpeg 1 0.86142
// James00013.jpeg 1 0.74739
// James00014.jpeg 1 0.79894
// James00015.jpeg 1 0.70174
// James00016.jpeg 1 0.78692
// James00017.jpeg 1 0.82186
// James00018.jpeg 1 0.79302
// James00019.jpeg 1 0.78022
// James00020.jpeg 1 0.70889
// James00021.jpeg 1 0.78158
// James00022.jpeg 1 0.67448
// James00023.jpeg 1 0.78017
// James00024.jpeg 1 0.84716
// James00025.jpeg 1 0.70358
// James00026.jpeg 1 0.76609
// James00027.jpeg 1 0.75332
// James00028.jpeg 1 0.76596
// James00029.jpeg 1 0.88275
// James00030.jpeg 1 0.83425

// Tutor00001.jpeg 0 0.5389
// Tutor00002.jpeg 0 0.46529
// Tutor00003.jpeg 0 0.50726
// Tutor00004.jpeg 0 0.53788
// Tutor00005.jpeg 0 0.54207
// Tutor00006.jpeg 0 0.59322
// Tutor00007.jpeg 0 0.53612
// Tutor00008.jpeg 0 0.52945
// Tutor00009.jpeg 0 0.55678
// Tutor00010.jpeg 0 0.55672
// Tutor00011.jpeg 0 0.5919
// Tutor00012.jpeg 0 0.52509
// Tutor00013.jpeg 0 0.52212
// Tutor00014.jpeg 0 0.57345
// Tutor00015.jpeg 0 0.53553
// Tutor00016.jpeg 0 0.56647
// Tutor00017.jpeg 0 0.54024
// Tutor00018.jpeg 0 0.54785
// Tutor00019.jpeg 0 0.59862
// Tutor00020.jpeg 0 0.53756
// Tutor00021.jpeg 0 0.58139
// Tutor00022.jpeg 0 0.54436
// Tutor00023.jpeg 0 0.53055
// Tutor00024.jpeg 0 0.54198
// Tutor00025.jpeg 0 0.56176
// Tutor00026.jpeg 0 0.55056
// Tutor00027.jpeg 0 0.54105
// Tutor00028.jpeg 0 0.57616
// Tutor00029.jpeg 0 0.49126
// Tutor00030.jpeg 0 0.56758

// Fluke00001.jpeg 1 0.63649
// Fluke00002.jpeg 0 0.5597
// Fluke00003.jpeg 0 0.57364
// Fluke00004.jpeg 0 0.55354
// Fluke00005.jpeg 0 0.5251
// Fluke00006.jpeg 0 0.49565
// Fluke00007.jpeg 0 0.44623
// Fluke00008.jpeg 0 0.51814
// Fluke00009.jpeg 0 0.56835
// Fluke00010.jpeg 1 0.60722
// Fluke00011.jpeg 0 0.55266
// Fluke00012.jpeg 1 0.60766
// Fluke00013.jpeg 0 0.50272
// Fluke00014.jpeg 1 0.64338
// Fluke00015.jpeg 0 0.54668
// Fluke00016.jpeg 0 0.55365
// Fluke00017.jpeg 1 0.60805
// Fluke00018.jpeg 1 0.61225
// Fluke00019.jpeg 1 0.62772
// Fluke00020.jpeg 0 0.56374
// Fluke00021.jpeg 0 0.5805
// Fluke00022.jpeg 1 0.60711
// Fluke00023.jpeg 0 0.53398
// Fluke00024.jpeg 0 0.55961
// Fluke00025.jpeg 1 0.60493
// Fluke00026.jpeg 0 0.55924
// Fluke00027.jpeg 0 0.59806
// Fluke00028.jpeg 0 0.54148
// Fluke00029.jpeg 0 0.50752
// Fluke00030.jpeg 0 0.58377

// TEST TUTOR FACE

// Tutor00001.jpeg 1 0.86079
// Tutor00002.jpeg 1 0.91985
// Tutor00003.jpeg 1 0.87208
// Tutor00004.jpeg 1 0.9011
// Tutor00005.jpeg 1 0.9247
// Tutor00006.jpeg 1 0.87832
// Tutor00007.jpeg 1 0.88998
// Tutor00008.jpeg 1 0.88832
// Tutor00009.jpeg 1 0.87087
// Tutor00010.jpeg 1 0.86596
// Tutor00011.jpeg 1 0.76982
// Tutor00012.jpeg 1 0.88469
// Tutor00013.jpeg 1 0.90093
// Tutor00014.jpeg 1 0.86174
// Tutor00015.jpeg 1 0.87032
// Tutor00016.jpeg 1 0.72673
// Tutor00017.jpeg 1 0.80833
// Tutor00018.jpeg 1 0.83203
// Tutor00019.jpeg 1 0.84406
// Tutor00020.jpeg 1 0.79018
// Tutor00021.jpeg 1 0.88443
// Tutor00022.jpeg 1 0.88504
// Tutor00023.jpeg 1 0.88489
// Tutor00024.jpeg 1 0.83141
// Tutor00025.jpeg 1 0.80941
// Tutor00026.jpeg 1 0.85328
// Tutor00027.jpeg 1 0.86602
// Tutor00028.jpeg 1 0.85228
// Tutor00029.jpeg 1 0.84291
// Tutor00030.jpeg 1 0.84515

// James00001.jpeg 0 0.4223
// James00002.jpeg 0 0.4545
// James00003.jpeg 0 0.48694
// James00004.jpeg 0 0.498
// James00005.jpeg 0 0.38274
// James00006.jpeg 0 0.35319
// James00007.jpeg 0 0.44331
// James00008.jpeg 0 0.43686
// James00009.jpeg 0 0.38631
// James00010.jpeg 0 0.47893
// James00011.jpeg 0 0.44684
// James00012.jpeg 0 0.4663
// James00013.jpeg 0 0.51787
// James00014.jpeg 0 0.49375
// James00015.jpeg 0 0.45427
// James00016.jpeg 0 0.37647
// James00017.jpeg 0 0.42136
// James00018.jpeg 0 0.37632
// James00019.jpeg 0 0.4494
// James00020.jpeg 0 0.41925
// James00021.jpeg 0 0.47446
// James00022.jpeg 0 0.41713
// James00023.jpeg 0 0.37804
// James00024.jpeg 0 0.48866
// James00025.jpeg 0 0.45293
// James00026.jpeg 0 0.44734
// James00027.jpeg 0 0.36726
// James00028.jpeg 0 0.39492
// James00029.jpeg 0 0.42567
// James00030.jpeg 0 0.49609

// Fluke00001.jpeg 0 0.55473
// Fluke00002.jpeg 0 0.46579
// Fluke00003.jpeg 0 0.52582
// Fluke00004.jpeg 0 0.55345
// Fluke00005.jpeg 0 0.55984
// Fluke00006.jpeg 0 0.52159
// Fluke00007.jpeg 0 0.45859
// Fluke00008.jpeg 0 0.53178
// Fluke00009.jpeg 1 0.64567
// Fluke00010.jpeg 0 0.54483
// Fluke00011.jpeg 0 0.51777
// Fluke00012.jpeg 0 0.57611
// Fluke00013.jpeg 0 0.53715
// Fluke00014.jpeg 0 0.51874
// Fluke00015.jpeg 0 0.52307
// Fluke00016.jpeg 0 0.56391
// Fluke00017.jpeg 0 0.55699
// Fluke00018.jpeg 0 0.55315
// Fluke00019.jpeg 0 0.53348
// Fluke00020.jpeg 0 0.4988
// Fluke00021.jpeg 0 0.52338
// Fluke00022.jpeg 0 0.53849
// Fluke00023.jpeg 0 0.56929
// Fluke00024.jpeg 0 0.50929
// Fluke00025.jpeg 0 0.59452
// Fluke00026.jpeg 0 0.53048
// Fluke00027.jpeg 0 0.58046
// Fluke00028.jpeg 0 0.54548
// Fluke00029.jpeg 0 0.50131
// Fluke00030.jpeg 0 0.56024

// TEST FLUKE FACE

// Fluke00001.jpeg 1 0.87353
// Fluke00002.jpeg 1 0.83143
// Fluke00003.jpeg 1 0.91539
// Fluke00004.jpeg 1 0.78515
// Fluke00005.jpeg 1 0.71465
// Fluke00006.jpeg 1 0.88609
// Fluke00007.jpeg 1 0.80246
// Fluke00008.jpeg 1 0.90542
// Fluke00009.jpeg 1 0.87159
// Fluke00010.jpeg 1 0.83592
// Fluke00011.jpeg 1 0.85967
// Fluke00012.jpeg 1 0.83453
// Fluke00013.jpeg 1 0.69766
// Fluke00014.jpeg 1 0.72432
// Fluke00015.jpeg 1 0.87524
// Fluke00016.jpeg 1 0.74787
// Fluke00017.jpeg 1 0.79532
// Fluke00018.jpeg 1 0.88335
// Fluke00019.jpeg 1 0.83297
// Fluke00020.jpeg 1 0.87191
// Fluke00021.jpeg 1 0.87789
// Fluke00022.jpeg 1 0.90976
// Fluke00023.jpeg 1 0.86461
// Fluke00024.jpeg 1 0.88161
// Fluke00025.jpeg 1 0.89197
// Fluke00026.jpeg 1 0.89135
// Fluke00027.jpeg 1 0.89895
// Fluke00028.jpeg 1 0.88146
// Fluke00029.jpeg 1 0.8564
// Fluke00030.jpeg 1 0.85417

// Tutor00001.jpeg 0 0.54253
// Tutor00002.jpeg 0 0.59918
// Tutor00003.jpeg 0 0.5086
// Tutor00004.jpeg 0 0.55779
// Tutor00005.jpeg 0 0.52192
// Tutor00006.jpeg 1 0.60596
// Tutor00007.jpeg 0 0.54919
// Tutor00008.jpeg 0 0.55551
// Tutor00009.jpeg 1 0.62427
// Tutor00010.jpeg 0 0.53261
// Tutor00011.jpeg 1 0.63896
// Tutor00012.jpeg 0 0.53583
// Tutor00013.jpeg 0 0.53978
// Tutor00014.jpeg 0 0.57447
// Tutor00015.jpeg 0 0.56422
// Tutor00016.jpeg 1 0.6439
// Tutor00017.jpeg 0 0.51762
// Tutor00018.jpeg 0 0.59936
// Tutor00019.jpeg 1 0.65508
// Tutor00020.jpeg 0 0.53934
// Tutor00021.jpeg 0 0.59708
// Tutor00022.jpeg 0 0.5932
// Tutor00023.jpeg 1 0.61182
// Tutor00024.jpeg 0 0.56165
// Tutor00025.jpeg 1 0.6404
// Tutor00026.jpeg 1 0.60525
// Tutor00027.jpeg 1 0.61183
// Tutor00028.jpeg 0 0.5626
// Tutor00029.jpeg 0 0.57552
// Tutor00030.jpeg 0 0.57967

// James00001.jpeg 0 0.55447
// James00002.jpeg 0 0.51948
// James00003.jpeg 0 0.5731
// James00004.jpeg 0 0.55977
// James00005.jpeg 0 0.54678
// James00006.jpeg 0 0.48714
// James00007.jpeg 0 0.54508
// James00008.jpeg 1 0.60093
// James00009.jpeg 1 0.62058
// James00010.jpeg 1 0.64149
// James00011.jpeg 0 0.47471
// James00012.jpeg 1 0.62735
// James00013.jpeg 0 0.49387
// James00014.jpeg 0 0.52324
// James00015.jpeg 0 0.52439
// James00016.jpeg 0 0.51556
// James00017.jpeg 0 0.58433
// James00018.jpeg 0 0.54252
// James00019.jpeg 0 0.54601
// James00020.jpeg 0 0.48407
// James00021.jpeg 0 0.49931
// James00022.jpeg 0 0.54842
// James00023.jpeg 0 0.56682
// James00024.jpeg 0 0.5656
// James00025.jpeg 0 0.46783
// James00026.jpeg 0 0.50662
// James00027.jpeg 0 0.48944
// James00028.jpeg 0 0.51629
// James00029.jpeg 0 0.53741
// James00030.jpeg 0 0.58597
module.exports = {
  resetAll,
  revokePassport,
  getPassports,
  getUsers,
  getConfusion,
}
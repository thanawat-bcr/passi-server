require('dotenv').config() 
var bcrypt = require('bcryptjs');
const knex = require("../services/db");

// GET ALL USERS
async function getUsers(req, res, next) {
    console.log('[GET] /user');

    try {
        const users = await knex.select('passport', 'email').from('user')
        if (users.length === 0) return res.status(404).json({ status: 'USERS_NOT_FOUND' })

        return res.status(200).json({ status: 'SUCCESS', users })
    } catch(err) {
        console.log('SOMETHING_WENT_WRONG 😢', err);
        return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' })
    }
}

// GET PIN
async function getPin(req, res, next) {
    console.log('[GET] /user/pin');
    const { id } = req.user;

    try {
        const user = await knex.first('pin').from('user').where({ id })
        if (!user.pin) return res.status(404).json({ status: 'PIN_NOT_CREATED' })

        return res.status(200).json({ status: 'SUCCESS' })
    } catch(err) {
        console.log('SOMETHING_WENT_WRONG 😢', err);
        return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' })
    }
}

// Update PIN
async function updatePin(req, res, next) {
    console.log('[POST] /user/pin');
    const { id } = req.user;
    const { pin } = req.body;

    if (!(pin)) {
        console.log('FIELDS_ARE_REQUIRED 😢'); return res.status(400).json({ status: 'FIELDS_ARE_REQUIRED' });
    }

    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(pin, salt);

    
    try {
        await knex('user').where({ id }).update({ pin: hash })

        return res.status(200).json({ status: 'SUCCESS' })
    } catch(err) {
        console.log('SOMETHING_WENT_WRONG 😢', err);
        return res.status(400).json({ status: 'SOMETHING_WENT_WRONG' })
    }
}

module.exports = {
    getUsers,
    getPin,
    updatePin,
}
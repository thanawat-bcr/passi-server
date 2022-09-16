const fs = require('fs');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
var http = require('http');
var https = require('https');
var privateKey  = fs.readFileSync('./cert/privkey1.pem', 'utf8');
var certificate = fs.readFileSync('./cert/cert1.pem', 'utf8');
var credentials = {key: privateKey, cert: certificate};

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const authRouter = require('./src/routes/auth')
const userRouter = require('./src/routes/user')
const kairosRouter = require('./src/routes/kairos')
const verifyRouter = require('./src/routes/verify')
const adminRouter = require('./src/routes/admin')

app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/kairos', kairosRouter);
app.use('/verify', verifyRouter);
app.use('/admin', adminRouter);

// TEST API
app.get('/test', (req, res) =>  res.status(200).json({ status: 'success' }))
app.post('/test', (req, res) =>  res.status(200).json({ status: 'success' }))

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(8080);
httpsServer.listen(8443);
console.log('Listening on');
console.log(':: http://localhost:8080');
console.log(':: https://passi-api.tutorism.me:8443');
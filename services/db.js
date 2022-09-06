const mysql = require('mysql');
const conn = mysql.createConnection({
  host     : 'passi.sit.kmutt.ac.th',
  user     : 'tutor',
  password : 'Tutor1234*',
  database : 'passi'
});

conn.connect();

module.exports = conn;
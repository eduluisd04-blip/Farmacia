// db.js
const mysql = require('mysql2');

const conexion = mysql.createConnection({
  host: 'localhost',
  user: 'root',       // usuario de MySQL
  password: '',       //  contraseña
  database: 'farmacia_db' // nombre de base de datos
});

conexion.connect(err => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
  } else {
    console.log('✅ Conectado a la base de datos MySQL');
  }
});

module.exports = conexion;

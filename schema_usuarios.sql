CREATE DATABASE IF NOT EXISTS farmacia_db;
USE farmacia_db;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario VARCHAR(60) NOT NULL UNIQUE,
  password VARCHAR(120) NOT NULL,
  nombre VARCHAR(100) NULL,
  apellido VARCHAR(100) NULL,
  email VARCHAR(120) NULL,
  telefono VARCHAR(30) NULL,
  cargo VARCHAR(80) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO usuarios (usuario, password, nombre, apellido, email, cargo, activo)
VALUES ('admin', 'admin123', 'Mateo', 'Dominguez', 'admin@mifarmacia.com', 'Administrador', 1)
ON DUPLICATE KEY UPDATE usuario = usuario;

CREATE TABLE IF NOT EXISTS pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente VARCHAR(150) NOT NULL,
  fecha DATE NOT NULL,
  estado ENUM('pendiente','procesando','enviado','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  metodo ENUM('efectivo','tarjeta','transferencia') NOT NULL DEFAULT 'efectivo',
  notas VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

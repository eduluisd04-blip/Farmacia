// server.js
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

db.query(
  `CREATE TABLE IF NOT EXISTS pedido_detalles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    producto_nombre VARCHAR(180) NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    cantidad INT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pedido_id (pedido_id),
    INDEX idx_producto_id (producto_id)
  )`,
  err => {
    if (err) {
      console.error('No se pudo preparar tabla pedido_detalles:', err.message);
    }
  }
);

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function beginTransactionAsync() {
  return new Promise((resolve, reject) => {
    db.beginTransaction(err => (err ? reject(err) : resolve()));
  });
}

function commitAsync() {
  return new Promise((resolve, reject) => {
    db.commit(err => (err ? reject(err) : resolve()));
  });
}

function rollbackAsync() {
  return new Promise(resolve => {
    db.rollback(() => resolve());
  });
}

//  Crear producto
app.post('/productos', (req, res) => {
  const { nombre, descripcion, precio, cantidad, fecha_caducidad, categoria, proveedor, imagen_url } = req.body;
  const sql = `INSERT INTO productos (nombre, descripcion, precio, cantidad, fecha_caducidad, categoria, proveedor, imagen_url)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [nombre, descripcion, precio, cantidad, fecha_caducidad, categoria, proveedor, imagen_url || null], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Producto agregado con Ã©xito', id: result.insertId });
  });
});

//  Listar productos
app.get('/productos', (req, res) => {
  db.query('SELECT * FROM productos', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

//  Obtener un producto por id
app.get('/productos/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM productos WHERE id = ? LIMIT 1', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (!results.length) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(results[0]);
  });
});

//  Actualizar producto
app.put('/productos/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, cantidad, fecha_caducidad, categoria, proveedor, imagen_url } = req.body;
  const sql = `UPDATE productos 
               SET nombre=?, descripcion=?, precio=?, cantidad=?, fecha_caducidad=?, categoria=?, proveedor=?, imagen_url=?
               WHERE id=?`;
  db.query(sql, [nombre, descripcion, precio, cantidad, fecha_caducidad, categoria, proveedor, imagen_url || null, id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Producto actualizado correctamente' });
  });
});

//  Eliminar producto
app.delete('/productos/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM productos WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Producto eliminado' });
  });
});

// Servidor corriendo

// ------------------------------
// CLIENTES
// ------------------------------

// Crear cliente
app.post('/clientes', (req, res) => {
  const { nombre, apellido, telefono, email, direccion, ciudad, estado, codigo_postal, activo } = req.body;
  const sql = `INSERT INTO clientes (nombre, apellido, telefono, email, direccion, ciudad, estado, codigo_postal, activo)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(
    sql,
    [nombre, apellido, telefono || null, email || null, direccion || null, ciudad || null, estado || null, codigo_postal || null, activo ?? 1],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: 'Cliente agregado con éxito', id: result.insertId });
    }
  );
});

// Listar clientes
app.get('/clientes', (req, res) => {
  db.query('SELECT * FROM clientes ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// Actualizar cliente
app.put('/clientes/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, telefono, email, direccion, ciudad, estado, codigo_postal, activo } = req.body;
  const sql = `UPDATE clientes
               SET nombre=?, apellido=?, telefono=?, email=?, direccion=?, ciudad=?, estado=?, codigo_postal=?, activo=?
               WHERE id=?`;
  db.query(
    sql,
    [nombre, apellido, telefono || null, email || null, direccion || null, ciudad || null, estado || null, codigo_postal || null, activo ?? 1, id],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: 'Cliente actualizado correctamente' });
    }
  );
});

// Eliminar cliente
app.delete('/clientes/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM clientes WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Cliente eliminado' });
  });
});

// ------------------------------
// PEDIDOS
// ------------------------------

// Crear pedido
app.post('/pedidos', (req, res) => {
  const { cliente, fecha, estado, total, metodo, notas } = req.body;
  const sql = `INSERT INTO pedidos (cliente, fecha, estado, total, metodo, notas)
               VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(sql, [cliente, fecha, estado, total, metodo, notas || null], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Pedido agregado con éxito', id: result.insertId });
  });
});

// Listar pedidos
app.get('/pedidos', (req, res) => {
  db.query('SELECT * FROM pedidos ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// Actualizar pedido
app.put('/pedidos/:id', (req, res) => {
  const { id } = req.params;
  const { cliente, fecha, estado, total, metodo, notas } = req.body;
  const sql = `UPDATE pedidos
               SET cliente=?, fecha=?, estado=?, total=?, metodo=?, notas=?
               WHERE id=?`;
  db.query(sql, [cliente, fecha, estado, total, metodo, notas || null, id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Pedido actualizado correctamente' });
  });
});

// Eliminar pedido
app.delete('/pedidos/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM pedidos WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Pedido eliminado' });
  });
});

app.post('/tienda/checkout', async (req, res) => {
  const { cliente, metodo, notas, items } = req.body || {};
  const nombre = (cliente?.nombre || '').trim();
  const apellido = (cliente?.apellido || '').trim();
  const telefono = (cliente?.telefono || '').trim();
  const email = (cliente?.email || '').trim();
  const direccion = (cliente?.direccion || '').trim();
  const ciudad = (cliente?.ciudad || '').trim();
  const metodoPago = (metodo || '').trim().toLowerCase();

  if (!nombre || !apellido || !telefono || !direccion || !ciudad) {
    return res.status(400).json({ message: 'Completa todos los campos obligatorios de envío.' });
  }

  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: 'El carrito está vacío.' });
  }

  const metodosPermitidos = ['efectivo', 'tarjeta', 'transferencia'];
  if (!metodosPermitidos.includes(metodoPago)) {
    return res.status(400).json({ message: 'Método de pago no válido.' });
  }

  const ids = [...new Set(items.map(i => Number(i.id)).filter(Number.isInteger))];
  if (!ids.length) {
    return res.status(400).json({ message: 'Los productos enviados no son válidos.' });
  }

  try {
    const rows = await queryAsync(
      'SELECT id, nombre, precio, cantidad FROM productos WHERE id IN (?)',
      [ids]
    );
    const mapa = new Map(rows.map(r => [Number(r.id), r]));

    const detalle = [];
    let total = 0;

    for (const raw of items) {
      const id = Number(raw.id);
      const qty = Number(raw.qty);
      if (!Number.isInteger(id) || !Number.isInteger(qty) || qty <= 0) {
        return res.status(400).json({ message: 'Hay cantidades inválidas en el carrito.' });
      }

      const prod = mapa.get(id);
      if (!prod) {
        return res.status(400).json({ message: `Producto no encontrado (ID ${id}).` });
      }

      if (qty > Number(prod.cantidad)) {
        return res.status(400).json({ message: `Stock insuficiente para ${prod.nombre}.` });
      }

      const precio = Number(prod.precio);
      const subtotal = Number((precio * qty).toFixed(2));
      total += subtotal;

      detalle.push({
        id,
        nombre: prod.nombre,
        precio,
        qty,
        subtotal
      });
    }

    total = Number(total.toFixed(2));
    const nombreCliente = `${nombre} ${apellido}`.trim();
    const notasFinales = [
      notas,
      `Tel: ${telefono}`,
      email ? `Email: ${email}` : '',
      `Dirección: ${direccion}, ${ciudad}`
    ]
      .filter(Boolean)
      .join(' | ');
    const fecha = new Date().toISOString().slice(0, 10);

    await beginTransactionAsync();
    const pedidoResult = await queryAsync(
      `INSERT INTO pedidos (cliente, fecha, estado, total, metodo, notas)
       VALUES (?, ?, 'pendiente', ?, ?, ?)`,
      [nombreCliente, fecha, total, metodoPago, notasFinales || null]
    );
    const pedidoId = pedidoResult.insertId;

    for (const item of detalle) {
      await queryAsync(
        `INSERT INTO pedido_detalles (pedido_id, producto_id, producto_nombre, precio_unitario, cantidad, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [pedidoId, item.id, item.nombre, item.precio, item.qty, item.subtotal]
      );

      const stockResult = await queryAsync(
        `UPDATE productos
         SET cantidad = cantidad - ?
         WHERE id = ? AND cantidad >= ?`,
        [item.qty, item.id, item.qty]
      );
      if (!stockResult.affectedRows) {
        throw new Error(`Stock no disponible para ${item.nombre}`);
      }
    }

    await commitAsync();
    res.json({
      message: 'Pedido creado correctamente',
      pedido: {
        id: pedidoId,
        cliente: nombreCliente,
        total,
        metodo: metodoPago,
        items: detalle
      }
    });
  } catch (err) {
    await rollbackAsync();
    res.status(500).json({ message: 'No se pudo crear el pedido.', error: err.message });
  }
});

app.get('/tienda/pedidos', async (req, res) => {
  const telefono = (req.query.telefono || '').trim();
  const email = (req.query.email || '').trim();

  try {
    let sql = `
      SELECT id, cliente, fecha, estado, total, metodo, notas, created_at
      FROM pedidos
    `;
    const params = [];
    const filtros = [];

    if (telefono) {
      filtros.push('notas LIKE ?');
      params.push(`%Tel: ${telefono}%`);
    }
    if (email) {
      filtros.push('notas LIKE ?');
      params.push(`%Email: ${email}%`);
    }

    if (filtros.length) {
      sql += ` WHERE ${filtros.join(' OR ')}`;
    }
    sql += ' ORDER BY id DESC';

    const pedidos = await queryAsync(sql, params);
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ message: 'No se pudieron obtener los pedidos.', error: err.message });
  }
});

app.get('/tienda/pedidos/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'ID de pedido no válido.' });
  }

  try {
    const pedidos = await queryAsync(
      `SELECT id, cliente, fecha, estado, total, metodo, notas, created_at
       FROM pedidos
       WHERE id = ?
       LIMIT 1`,
      [id]
    );
    if (!pedidos.length) {
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }

    const detalles = await queryAsync(
      `SELECT id, producto_id, producto_nombre, precio_unitario, cantidad, subtotal
       FROM pedido_detalles
       WHERE pedido_id = ?
       ORDER BY id ASC`,
      [id]
    );

    res.json({ pedido: pedidos[0], detalles });
  } catch (err) {
    res.status(500).json({ message: 'No se pudo obtener el pedido.', error: err.message });
  }
});

// ------------------------------
// AUTH
// ------------------------------

app.post('/tienda/login', (req, res) => {
  const { usuario, password } = req.body || {};
  if (!usuario || !password) {
    return res.status(400).json({ message: 'Faltan credenciales' });
  }
  const sql = `
    SELECT id, usuario, nombre, apellido, email, telefono, cargo
    FROM usuarios
    WHERE usuario = ? AND password = ? AND activo = 1
    LIMIT 1
  `;
  db.query(sql, [usuario, password], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error interno', error: err.message });
    if (!results.length) return res.status(401).json({ message: 'Usuario o contraseña inválidos' });
    res.json({ user: results[0] });
  });
});

app.post('/login', (req, res) => {
  const { usuario, password } = req.body;
  console.log('Login intento:', { usuario, password: password ? '***' : undefined });
  if (!usuario || !password) {
    return res.status(400).json({ message: 'Faltan credenciales' });
  }
  const sql = 'SELECT id, usuario, nombre, apellido, email, telefono, cargo, activo FROM usuarios WHERE usuario = ? AND password = ? AND activo = 1 LIMIT 1';
  db.query(sql, [usuario, password], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (!results.length) return res.status(401).json({ message: 'Credenciales inválidas' });
    res.json({ user: results[0] });
  });
});

app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));

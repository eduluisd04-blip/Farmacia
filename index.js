const pool = require('./db');

// Crear un producto
async function crearProducto(nombre, descripcion, precio, cantidad, fecha_caducidad, categoria, proveedor) {
  try {
    const sql = `INSERT INTO productos
      (nombre, descripcion, precio, cantidad, fecha_caducidad, categoria, proveedor)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await pool.execute(sql, [nombre, descripcion, precio, cantidad, fecha_caducidad, categoria, proveedor]);
    console.log('Producto creado con ID:', result.insertId);
  } catch (err) {
    console.error('Error al crear producto:', err);
  }
}

// Leer todos los productos
async function obtenerProductos() {
  try {
    const [rows] = await pool.query('SELECT * FROM productos');
    console.log('Productos:', rows);
    return rows;
  } catch (err) {
    console.error('Error al obtener productos:', err);
  }
}

// Actualizar producto por ID
async function actualizarProducto(id, nombre, descripcion, precio, cantidad, fecha_caducidad, categoria, proveedor) {
  try {
    const sql = `UPDATE productos SET 
      nombre=?, descripcion=?, precio=?, cantidad=?, fecha_caducidad=?, categoria=?, proveedor=? 
      WHERE id=?`;
    const [result] = await pool.execute(sql, [nombre, descripcion, precio, cantidad, fecha_caducidad, categoria, proveedor, id]);
    console.log('Producto actualizado, filas afectadas:', result.affectedRows);
  } catch (err) {
    console.error('Error al actualizar producto:', err);
  }
}

// Eliminar producto por ID
async function eliminarProducto(id) {
  try {
    const sql = 'DELETE FROM productos WHERE id=?';
    const [result] = await pool.execute(sql, [id]);
    console.log('Producto eliminado, filas afectadas:', result.affectedRows);
  } catch (err) {
    console.error('Error al eliminar producto:', err);
  }
}

// Ejemplo de uso
async function main() {
  await crearProducto(
    'Paracetamol',
    'Caja de 20 tabletas',
    5.00,
    50,
    '2025-12-31',
    'Medicamento',
    'Farmacia Central'
  );

  await obtenerProductos();

  await actualizarProducto(
    1,
    'Paracetamol',
    'Caja de 20 tabletas - reformulado',
    6.00,
    40,
    '2025-12-31',
    'Medicamento',
    'Farmacia Central'
  );

  await eliminarProducto(1);
}

main();

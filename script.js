// --- SIDEBAR (colapsar) ---
document.getElementById('collapse-btn')?.addEventListener('click', () => {
  document.querySelector('.sidebar').classList.toggle('collapsed');
});

// --- MENÃš USUARIO (click en todo el bloque) ---
const userDropdown = document.querySelector('.user-dropdown');
if (userDropdown) {
  userDropdown.addEventListener('click', e => {
    e.stopPropagation();
    userDropdown.classList.toggle('active');
  });
  document.addEventListener('click', e => {
    if (!userDropdown.contains(e.target)) userDropdown.classList.remove('active');
  });
}

// -------------------------------------------------------------------
// --- DETECCIÃ“N DE PÃGINA (para ejecutar solo lo que corresponde) ---
// -------------------------------------------------------------------

const ES_INDEX = document.body.contains(document.getElementById("dashboard-section"));
const ES_PRODUCTOS = document.body.contains(document.getElementById("productos-table"));
const ES_PEDIDOS = document.body.contains(document.getElementById("pedidos-table"));
const ES_CLIENTES = document.body.contains(document.getElementById("clientes-table"));
const ES_REPORTES = document.body.contains(document.getElementById("reportes-section"));
const ES_PRODUCTO_FORM = document.body.contains(document.getElementById("productoForm"));
const ES_PEDIDO_FORM = document.body.contains(document.getElementById("pedidoForm"));
const ES_CLIENTE_FORM = document.body.contains(document.getElementById("clienteForm"));
const ES_LOGIN = document.body.contains(document.getElementById("login-form"));
const ES_PERFIL = document.body.contains(document.getElementById("perfilForm"));
const ES_AJUSTES = document.body.contains(document.getElementById("ajustesForm"));

// -------------------------------------------------------------------
// --- VARIABLES COMPARTIDAS ---
// -------------------------------------------------------------------

let productos = [];
let pedidos = [];
let clientes = [];
let tabla = document.querySelector('#productos-table tbody');
let btnCargar = document.getElementById('btn-cargar');
let filtroCategoria = document.getElementById('filtro-categoria');
let graficoReportesEstados;
let graficoReportesCategorias;

const searchForm = document.getElementById('search-form');
const searchInput = searchForm?.querySelector('input');

const API_BASE = 'http://localhost:3000';

function abrirVentanaFormulario(url, titulo = 'MiFarmacia') {
  const width = 980;
  const height = 760;
  const left = Math.max(0, Math.round((window.screen.width - width) / 2));
  const top = Math.max(0, Math.round((window.screen.height - height) / 2));
  const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
  window.open(url, titulo, features);
}

function cerrarVentanaYRefrescar(destino) {
  if (window.opener && !window.opener.closed) {
    try {
      window.opener.location.href = destino;
      window.opener.focus();
      window.close();
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

function abrirModal(modal) {
  if (!modal) return;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function cerrarModal(modal) {
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

// --- AUTH SIMPLE (LOCAL STORAGE) ---
function getUsuario() {
  try {
    return JSON.parse(localStorage.getItem('mf_user'));
  } catch {
    return null;
  }
}

function setUsuario(data) {
  localStorage.setItem('mf_user', JSON.stringify(data));
}

function limpiarSesion() {
  localStorage.removeItem('mf_user');
  localStorage.removeItem('mf_settings');
}

function requireAuth() {
  const user = getUsuario();
  if (!ES_LOGIN && !user) {
    window.location.href = 'login.html';
  }
}

requireAuth();

// --- CONTENEDOR DE SUGERENCIAS ---
let sugerenciasContainer = null;
if (searchInput) {
  sugerenciasContainer = document.createElement('div');
  sugerenciasContainer.classList.add('sugerencias-container');
  searchInput.parentNode.appendChild(sugerenciasContainer);
}

// -------------------------------------------------------------------
// --- CARGAR PRODUCTOS DESDE API ---
// -------------------------------------------------------------------

function cargarProductos() {
  return fetch(`${API_BASE}/productos`)
    .then(res => res.json())
    .then(data => {
      productos = data;

      if (ES_PRODUCTOS) {
        llenarCategorias(data);
        mostrarProductos(data);
      }
      if (ES_INDEX) {
        actualizarEstadisticas();
      }
    })
    .catch(err => console.error('Error al cargar productos:', err));
}

function formatearFecha(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toISOString().slice(0, 10);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });
}

function initProductoImagenInput() {
  if (!ES_PRODUCTO_FORM) return;
  const fileInput = document.getElementById('imagen_file');
  const urlInput = document.getElementById('imagen_url');
  const preview = document.getElementById('imagen_preview');
  if (!fileInput || !urlInput || !preview) return;

  const setPreview = src => {
    if (!src) {
      preview.removeAttribute('src');
      preview.style.visibility = 'hidden';
      return;
    }
    preview.src = src;
    preview.style.visibility = 'visible';
  };

  setPreview(urlInput.value.trim());

  urlInput.addEventListener('input', () => {
    setPreview(urlInput.value.trim());
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      urlInput.value = dataUrl;
      setPreview(dataUrl);
    } catch (err) {
      alert(err.message || 'Error al cargar imagen');
    }
  });
}

// AUTO CARGA SOLO EN LA PÃGINA QUE LO NECESITA
document.addEventListener('DOMContentLoaded', () => {
  const user = getUsuario();
  const userNameEl = document.querySelector('.user-name');
  if (user && userNameEl) {
    userNameEl.textContent = `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.usuario || 'Usuario';
  }

  document.querySelectorAll('.logout-link').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      limpiarSesion();
      window.location.href = 'login.html';
    });
  });

  document.querySelectorAll('.js-open-modal').forEach(button => {
    button.addEventListener('click', () => {
      const modalId = button.dataset.modalTarget;
      abrirModal(document.getElementById(modalId));
    });
  });

  document.querySelectorAll('.js-close-modal').forEach(button => {
    button.addEventListener('click', () => {
      cerrarModal(button.closest('.modal-overlay'));
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) cerrarModal(modal);
    });
  });

  if (ES_INDEX || ES_PRODUCTOS) {
    cargarProductos();
  }

  if (ES_REPORTES) {
    inicializarReportes();
  }

  if (ES_PRODUCTO_FORM) {
    initProductoImagenInput();
  }

  if (ES_PEDIDOS) {
    cargarPedidos();
    document.getElementById('btn-cargar-pedidos')?.addEventListener('click', cargarPedidos);
    document.getElementById('filtro-estado')?.addEventListener('change', filtrarPedidos);
    document.getElementById('filtro-fecha')?.addEventListener('change', filtrarPedidos);
  }

  if (ES_CLIENTES) {
    cargarClientes();
    document.getElementById('btn-cargar-clientes')?.addEventListener('click', cargarClientes);
    document.getElementById('filtro-activo')?.addEventListener('change', filtrarClientes);
  }

  if (ES_PEDIDO_FORM) {
    const pedidoFecha = document.getElementById('pedido_fecha');
    if (pedidoFecha && !pedidoFecha.value) {
      pedidoFecha.value = new Date().toISOString().slice(0, 10);
    }

    document.getElementById('pedidoForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const nuevo = {
        cliente: document.getElementById('pedido_cliente').value,
        fecha: document.getElementById('pedido_fecha').value,
        estado: document.getElementById('pedido_estado').value,
        total: parseFloat(document.getElementById('pedido_total').value || '0'),
        metodo: document.getElementById('pedido_metodo').value,
        notas: document.getElementById('pedido_notas')?.value || ''
      };

      fetch(`${API_BASE}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevo)
      })
        .then(res => res.json())
        .then(() => {
          alert('Pedido creado');
          const modal = document.getElementById('modal-pedido');
          if (modal) {
            e.target.reset();
            cerrarModal(modal);
            cargarPedidos();
          } else if (!cerrarVentanaYRefrescar('pedidos.html')) {
            window.location.href = 'pedidos.html';
          }
        });
    });
  }

  if (ES_CLIENTE_FORM) {
    document.getElementById('clienteForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const nuevo = {
        nombre: document.getElementById('cliente_nombre').value,
        apellido: document.getElementById('cliente_apellido').value,
        telefono: document.getElementById('cliente_telefono').value,
        email: document.getElementById('cliente_email').value,
        direccion: document.getElementById('cliente_direccion').value,
        ciudad: document.getElementById('cliente_ciudad').value,
        estado: document.getElementById('cliente_estado').value,
        codigo_postal: document.getElementById('cliente_cp').value,
        activo: 1
      };

      fetch(`${API_BASE}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevo)
      })
        .then(res => res.json())
        .then(() => {
          alert('Cliente agregado');
          const modal = document.getElementById('modal-cliente');
          if (modal) {
            e.target.reset();
            cerrarModal(modal);
            cargarClientes();
          } else if (!cerrarVentanaYRefrescar('clientes.html')) {
            window.location.href = 'clientes.html';
          }
        });
    });
  }

  if (ES_LOGIN) {
    const loginForm = document.getElementById('login-form');
    const hint = document.querySelector('.login-hint');
    loginForm?.addEventListener('submit', e => {
      e.preventDefault();
      const usuario = document.getElementById('login-usuario').value.trim();
      const password = document.getElementById('login-password').value.trim();
      if (!usuario || !password) return;

      fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
      })
        .then(res => {
          if (!res.ok) throw new Error('Credenciales inválidas');
          return res.json();
        })
        .then(data => {
          setUsuario(data.user);
          window.location.href = 'index.html';
        })
        .catch(err => {
          if (hint) hint.textContent = err.message;
        });
    });
  }

  if (ES_PERFIL) {
    const perfil = getUsuario() || {};
    document.getElementById('perfil_nombre').value = perfil.nombre || '';
    document.getElementById('perfil_apellido').value = perfil.apellido || '';
    document.getElementById('perfil_email').value = perfil.email || '';
    document.getElementById('perfil_telefono').value = perfil.telefono || '';
    document.getElementById('perfil_cargo').value = perfil.cargo || '';

    document.getElementById('perfilForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const actualizado = {
        usuario: perfil.usuario || '',
        nombre: document.getElementById('perfil_nombre').value,
        apellido: document.getElementById('perfil_apellido').value,
        email: document.getElementById('perfil_email').value,
        telefono: document.getElementById('perfil_telefono').value,
        cargo: document.getElementById('perfil_cargo').value
      };
      setUsuario(actualizado);
      const userName = document.querySelector('.user-name');
      if (userName) userName.textContent = `${actualizado.nombre} ${actualizado.apellido}`.trim();
      alert('Perfil actualizado');
    });
  }

  if (ES_AJUSTES) {
    const settings = JSON.parse(localStorage.getItem('mf_settings') || '{}');
    document.getElementById('ajuste_notificaciones').checked = Boolean(settings.notificaciones);
    document.getElementById('ajuste_resumen').checked = Boolean(settings.resumen);
    document.getElementById('ajuste_idioma').value = settings.idioma || 'es';
    document.getElementById('ajuste_timezone').value = settings.timezone || 'America/Mexico_City';

    document.getElementById('ajustesForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const nuevo = {
        notificaciones: document.getElementById('ajuste_notificaciones').checked,
        resumen: document.getElementById('ajuste_resumen').checked,
        idioma: document.getElementById('ajuste_idioma').value,
        timezone: document.getElementById('ajuste_timezone').value
      };
      localStorage.setItem('mf_settings', JSON.stringify(nuevo));
      alert('Ajustes guardados');
    });
  }
});

// -------------------------------------------------------------------
// --- MOSTRAR PRODUCTOS (SOLO EN productos.html) ---
// -------------------------------------------------------------------

function mostrarProductos(lista) {
  if (!tabla) return;

  tabla.innerHTML = '';
  lista.forEach(prod => {
    const img = prod.imagen_url || 'tienda/assets/productos/analgesicos.svg';
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${prod.id}</td>
      <td><img src="${img}" alt="${prod.nombre}" class="thumb-prod"></td>
      <td>${prod.nombre}</td>
      <td>${prod.descripcion || ''}</td>
      <td>$${prod.precio}</td>
      <td>${prod.cantidad}</td>
      <td>${prod.fecha_caducidad || '-'}</td>
      <td>${prod.categoria || ''}</td>
      <td>${prod.proveedor || ''}</td>
      <td>
        <button onclick="editarProducto(${prod.id})" class="btn btn-icon" aria-label="Editar">✏️</button>
        <button onclick="eliminarProducto(${prod.id})" class="btn btn-icon btn-danger" aria-label="Eliminar">🗑️</button>
      </td>`;
    tabla.appendChild(fila);
  });
}

// -------------------------------------------------------------------
// --- LLENAR SELECT DE CATEGORÃAS ---
// -------------------------------------------------------------------

function llenarCategorias(lista) {
  if (!filtroCategoria) return;

  const categoriasUnicas = [...new Set(lista.map(p => p.categoria).filter(Boolean))];

  filtroCategoria.innerHTML = `<option value="todas">Todas las categorías</option>`;
  categoriasUnicas.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    filtroCategoria.appendChild(opt);
  });
}

// -------------------------------------------------------------------
// --- BUSCADOR + SUGERENCIAS ---
// -------------------------------------------------------------------

if (searchForm) {
  searchForm.addEventListener('submit', e => {
    e.preventDefault();

    if (ES_PRODUCTOS) {
      filtrarProductos();
      sugerenciasContainer.innerHTML = '';
      searchInput.value = '';
    } else if (ES_CLIENTES) {
      filtrarClientes();
    } else if (ES_PEDIDOS) {
      filtrarPedidos();
    } else {
      // si estÃ¡ en index.html â†’ redirige a productos con query
      const param = searchInput.value.trim();
      if (param !== "") window.location.href = `productos.html?buscar=${param}`;
    }
  });
}

let typingTimer;
searchInput?.addEventListener('input', () => {
  if (!sugerenciasContainer) return;

  const texto = searchInput.value.toLowerCase().trim();
  clearTimeout(typingTimer);

  if (texto === '') {
    sugerenciasContainer.innerHTML = '';
    return;
  }

  // Mostrar cargando mientras escribe
  sugerenciasContainer.innerHTML = `<div class="loading">Cargando...</div>`;

  typingTimer = setTimeout(() => {
    if (ES_PRODUCTOS || ES_INDEX) {
      const filtrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(texto)
      );

      sugerenciasContainer.innerHTML = '';

      filtrados.slice(0, 5).forEach(p => {
        const item = document.createElement('div');
        item.classList.add('sugerencia-item');
        item.innerHTML = `
          <img src="${p.imagen_url || 'tienda/assets/productos/analgesicos.svg'}" class="mini-img">
          <span>${p.nombre}</span>
        `;
        item.addEventListener('click', () => {
          if (ES_PRODUCTOS) {
            searchInput.value = p.nombre;
            sugerenciasContainer.innerHTML = '';
            filtrarProductos();
          } else {
            window.location.href = `productos.html?buscar=${p.nombre}`;
          }
        });
        sugerenciasContainer.appendChild(item);
      });

      if (!filtrados.length) {
        sugerenciasContainer.innerHTML = `<div class="loading">Sin resultados</div>`;
      }
    } else if (ES_CLIENTES) {
      filtrarClientes();
      sugerenciasContainer.innerHTML = '';
    } else if (ES_PEDIDOS) {
      filtrarPedidos();
      sugerenciasContainer.innerHTML = '';
    }
  }, 250);
});

// -------------------------------------------------------------------
// --- FILTRO (SOLO PRODUCTOS.HTML) ---
// -------------------------------------------------------------------

function filtrarProductos() {
  if (!ES_PRODUCTOS) return;

  const texto = searchInput.value.toLowerCase();
  const categoriaSeleccionada = filtroCategoria.value;

  const filtrados = productos.filter(p => {
    const coincideTexto =
      p.nombre.toLowerCase().includes(texto) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(texto));

    const coincideCategoria =
      categoriaSeleccionada === 'todas' || p.categoria === categoriaSeleccionada;

    return coincideTexto && coincideCategoria;
  });

  mostrarProductos(filtrados);
}

filtroCategoria?.addEventListener('change', filtrarProductos);

// -------------------------------------------------------------------
// --- PEDIDOS (SOLO pedidos.html) ---
// -------------------------------------------------------------------

function cargarPedidos() {
  return fetch(`${API_BASE}/pedidos`)
    .then(res => res.json())
    .then(data => {
      pedidos = data;
      mostrarPedidos(data);
    })
    .catch(err => console.error('Error al cargar pedidos:', err));
}

function mostrarPedidos(lista) {
  const tbody = document.querySelector('#pedidos-table tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  lista.forEach(p => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${p.id}</td>
      <td>${p.cliente}</td>
      <td>${formatearFecha(p.fecha)}</td>
      <td><span class="badge ${p.estado}">${p.estado}</span></td>
      <td>$${Number(p.total).toFixed(2)}</td>
      <td>${p.metodo}</td>
      <td>
        <button class="btn btn-icon" aria-label="Editar" onclick="editarPedido(${p.id})">✏️</button>
        <button class="btn btn-icon btn-danger" aria-label="Eliminar" onclick="eliminarPedido(${p.id})">🗑️</button>
      </td>
    `;
    tbody.appendChild(fila);
  });
}

function filtrarPedidos() {
  const estado = document.getElementById('filtro-estado')?.value || 'todos';
  const fecha = document.getElementById('filtro-fecha')?.value || '';

  let filtrados = pedidos;
  if (estado !== 'todos') {
    filtrados = filtrados.filter(p => p.estado === estado);
  }
  if (fecha) {
    filtrados = filtrados.filter(p => formatearFecha(p.fecha) === fecha);
  }
  mostrarPedidos(filtrados);
}

function eliminarPedido(id) {
  if (!ES_PEDIDOS) return;
  if (confirm('¿Eliminar este pedido?')) {
    fetch(`${API_BASE}/pedidos/${id}`, { method: 'DELETE' })
      .then(() => cargarPedidos());
  }
}

function editarPedido(id) {
  if (!ES_PEDIDOS) return;
  const pedido = pedidos.find(p => p.id === id);
  if (!pedido) return;

  const cliente = prompt('Cliente', pedido.cliente);
  if (cliente === null) return;
  const fecha = prompt('Fecha (YYYY-MM-DD)', formatearFecha(pedido.fecha));
  if (fecha === null) return;
  const estado = prompt('Estado (pendiente/procesando/enviado/entregado/cancelado)', pedido.estado);
  if (estado === null) return;
  const total = prompt('Total', pedido.total);
  if (total === null) return;
  const metodo = prompt('Método (efectivo/tarjeta/transferencia)', pedido.metodo);
  if (metodo === null) return;

  fetch(`${API_BASE}/pedidos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cliente,
      fecha,
      estado,
      total: parseFloat(total || '0'),
      metodo,
      notas: pedido.notas || ''
    })
  }).then(() => cargarPedidos());
}

// -------------------------------------------------------------------
// --- CLIENTES (SOLO clientes.html) ---
// -------------------------------------------------------------------

function cargarClientes() {
  return fetch(`${API_BASE}/clientes`)
    .then(res => res.json())
    .then(data => {
      clientes = data;
      mostrarClientes(data);
    })
    .catch(err => console.error('Error al cargar clientes:', err));
}

function mostrarClientes(lista) {
  const tbody = document.querySelector('#clientes-table tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  lista.forEach(c => {
    const estadoTexto = c.activo ? 'activo' : 'inactivo';
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${c.id}</td>
      <td>${c.nombre}</td>
      <td>${c.apellido}</td>
      <td>${c.telefono || '-'}</td>
      <td>${c.email || '-'}</td>
      <td>${c.direccion || '-'}</td>
      <td>${formatearFecha(c.fecha_registro)}</td>
      <td><span class="badge ${estadoTexto}">${estadoTexto}</span></td>
      <td>
        <button class="btn btn-icon" aria-label="Editar" onclick="editarCliente(${c.id})">✏️</button>
        <button class="btn btn-icon btn-danger" aria-label="Eliminar" onclick="eliminarCliente(${c.id})">🗑️</button>
      </td>
    `;
    tbody.appendChild(fila);
  });
}

function filtrarClientes() {
  const texto = searchInput?.value?.toLowerCase() || '';
  const activo = document.getElementById('filtro-activo')?.value || 'todos';

  let filtrados = clientes;
  if (texto) {
    filtrados = filtrados.filter(c =>
      `${c.nombre} ${c.apellido}`.toLowerCase().includes(texto) ||
      (c.email || '').toLowerCase().includes(texto) ||
      (c.telefono || '').toLowerCase().includes(texto)
    );
  }
  if (activo !== 'todos') {
    const flag = activo === '1';
    filtrados = filtrados.filter(c => Boolean(c.activo) === flag);
  }

  mostrarClientes(filtrados);
}

function eliminarCliente(id) {
  if (!ES_CLIENTES) return;
  if (confirm('¿Eliminar este cliente?')) {
    fetch(`${API_BASE}/clientes/${id}`, { method: 'DELETE' })
      .then(() => cargarClientes());
  }
}

function editarCliente(id) {
  if (!ES_CLIENTES) return;
  const cliente = clientes.find(c => c.id === id);
  if (!cliente) return;

  const nombre = prompt('Nombre', cliente.nombre);
  if (nombre === null) return;
  const apellido = prompt('Apellido', cliente.apellido);
  if (apellido === null) return;

  fetch(`${API_BASE}/clientes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre,
      apellido,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion,
      ciudad: cliente.ciudad,
      estado: cliente.estado,
      codigo_postal: cliente.codigo_postal,
      activo: cliente.activo
    })
  }).then(() => cargarClientes());
}

// -------------------------------------------------------------------
// --- CRUD SOLO EN productos.html ---
// -------------------------------------------------------------------

if (ES_PRODUCTO_FORM) {
  document.getElementById('productoForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const fileInput = document.getElementById('imagen_file');
    const urlInput = document.getElementById('imagen_url');
    let imagenFinal = (urlInput?.value || '').trim();

    // Si eligió archivo, lo convertimos aquí también para asegurar que sí se envíe.
    if (fileInput?.files?.[0]) {
      try {
        imagenFinal = await fileToDataUrl(fileInput.files[0]);
        if (urlInput) urlInput.value = imagenFinal;
      } catch (err) {
        alert(err.message || 'No se pudo procesar la imagen.');
        return;
      }
    }

    const producto = {
      nombre: nombre.value,
      descripcion: descripcion.value,
      precio: precio.value,
      cantidad: cantidad.value,
      fecha_caducidad: fecha_caducidad.value,
      categoria: categoria.value,
      proveedor: proveedor.value,
      imagen_url: imagenFinal
    };

    fetch(`${API_BASE}/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(producto)
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'No se pudo guardar el producto.');
        return data;
      })
      .then(() => {
        alert('Producto agregado');
        const modal = document.getElementById('modal-producto');
        if (modal) {
          e.target.reset();
          const preview = document.getElementById('imagen_preview');
          if (preview) {
            preview.removeAttribute('src');
            preview.style.visibility = 'hidden';
          }
          cerrarModal(modal);
          cargarProductos();
        } else if (!cerrarVentanaYRefrescar('productos.html')) {
          window.location.href = 'productos.html';
        }
      })
      .catch(err => {
        alert(err.message || 'Error guardando el producto');
      });
  });
}

// --- ELIMINAR ---
function eliminarProducto(id) {
  if (!ES_PRODUCTOS) return;

  if (confirm('Â¿Eliminar este producto?')) {
    fetch(`${API_BASE}/productos/${id}`, { method: 'DELETE' })
      .then(() => {
        alert('Producto eliminado');
        cargarProductos();
      });
  }
}

// --- EDITAR ---
function editarProducto(id) {
  if (!ES_PRODUCTOS) return;
  const prod = productos.find(p => p.id === id);
  if (!prod) return;

  const nombreNuevo = prompt('Nombre', prod.nombre);
  if (nombreNuevo === null) return;
  const descripcionNueva = prompt('Descripción', prod.descripcion || '');
  if (descripcionNueva === null) return;
  const precioNuevo = prompt('Precio', prod.precio);
  if (precioNuevo === null) return;
  const cantidadNueva = prompt('Cantidad', prod.cantidad);
  if (cantidadNueva === null) return;
  const fechaNueva = prompt('Fecha de caducidad (YYYY-MM-DD)', formatearFecha(prod.fecha_caducidad || ''));
  if (fechaNueva === null) return;
  const categoriaNueva = prompt('Categoría', prod.categoria || '');
  if (categoriaNueva === null) return;
  const proveedorNuevo = prompt('Proveedor', prod.proveedor || '');
  if (proveedorNuevo === null) return;
  const imagenNueva = prompt('Imagen URL (assets/productos/archivo.jpg o https://...)', prod.imagen_url || '');
  if (imagenNueva === null) return;

  fetch(`${API_BASE}/productos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: nombreNuevo,
      descripcion: descripcionNueva,
      precio: Number(precioNuevo),
      cantidad: Number(cantidadNueva),
      fecha_caducidad: fechaNueva,
      categoria: categoriaNueva,
      proveedor: proveedorNuevo,
      imagen_url: imagenNueva.trim()
    })
  })
    .then(res => res.json())
    .then(() => {
      alert('Producto actualizado');
      cargarProductos();
    });
}

// -------------------------------------------------------------------
// --- ESTADÃSTICAS + GRÃFICOS (SOLO index.html) ---
// -------------------------------------------------------------------

function actualizarEstadisticas() {
  if (!ES_INDEX) return;

  const totalProductos = productos.length;
  const valorInventario = productos.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);
  const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];

  document.getElementById('stat-total').textContent = totalProductos;
  document.getElementById('stat-inventario').textContent = `$${valorInventario.toFixed(2)}`;
  document.getElementById('stat-categorias').textContent = categorias.length;

  renderizarGraficos();
}

// --- GRÃFICOS ---
let graficoCategorias, graficoProveedores;

function renderizarGraficos() {
  if (!ES_INDEX) return;

  const categorias = {};
  const proveedores = {};

  productos.forEach(p => {
    if (p.categoria) categorias[p.categoria] = (categorias[p.categoria] || 0) + 1;
    if (p.proveedor) proveedores[p.proveedor] = (proveedores[p.proveedor] || 0) + 1;
  });

  const ctxCat = document.getElementById('barChart');
  const ctxProv = document.getElementById('pieChart');

  if (!ctxCat || !ctxProv) return;

  if (graficoCategorias) graficoCategorias.destroy();
  if (graficoProveedores) graficoProveedores.destroy();

    if (window.Chart && Chart.defaults && Chart.defaults.font) {
    Chart.defaults.font.family = "Segoe UI, Arial, sans-serif";
    Chart.defaults.font.size = 12;
  }

  graficoCategorias = new Chart(ctxCat, {
    type: 'bar',
    data: {
      labels: Object.keys(categorias),
      datasets: [{
        label: 'Productos por Categoría',
        data: Object.values(categorias),
        backgroundColor: 'rgba(59, 130, 246, 0.45)',
        borderColor: 'rgba(59, 130, 246, 0.9)',
        borderWidth: 1,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          titleFont: { size: 13, weight: '600' },
          bodyFont: { size: 12 },
          padding: 10,
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 12, weight: '600' } }
        },
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, font: { size: 12 } }
        }
      }
    }
  });

    graficoProveedores = new Chart(ctxProv, {
    type: 'pie',
    data: {
      labels: Object.keys(proveedores),
      datasets: [{
        data: Object.values(proveedores),
        backgroundColor: ['#3b82f6', '#f97316', '#10b981', '#a855f7', '#f43f5e'],
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 14, boxHeight: 14, padding: 16, font: { size: 12 } }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          titleFont: { size: 13, weight: '600' },
          bodyFont: { size: 12 },
          padding: 10,
          cornerRadius: 8
        }
      },
      layout: {
        padding: { top: 8, bottom: 8 }
      }
    }
  });
}

function inicializarReportes() {
  const btnAplicar = document.getElementById('btn-aplicar-reportes');
  const btnExportarPedidos = document.getElementById('btn-exportar-pedidos');
  const btnExportarStock = document.getElementById('btn-exportar-stock');
  const fechaFin = document.getElementById('reporte-fecha-fin');
  const fechaInicio = document.getElementById('reporte-fecha-inicio');

  if (fechaFin && !fechaFin.value) {
    fechaFin.value = new Date().toISOString().slice(0, 10);
  }

  if (fechaInicio && !fechaInicio.value) {
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 30);
    fechaInicio.value = inicio.toISOString().slice(0, 10);
  }

  Promise.all([cargarProductos(), cargarPedidos(), cargarClientes()]).then(() => {
    renderizarReportes();
  });

  btnAplicar?.addEventListener('click', renderizarReportes);
  btnExportarPedidos?.addEventListener('click', exportarPedidosCSV);
  btnExportarStock?.addEventListener('click', exportarInventarioCSV);
}

function obtenerPedidosFiltradosReporte() {
  const fechaInicio = document.getElementById('reporte-fecha-inicio')?.value || '';
  const fechaFin = document.getElementById('reporte-fecha-fin')?.value || '';

  return pedidos.filter(pedido => {
    if (!pedido.fecha) return true;
    const fechaPedido = formatearFecha(pedido.fecha);
    if (fechaInicio && fechaPedido < fechaInicio) return false;
    if (fechaFin && fechaPedido > fechaFin) return false;
    return true;
  });
}

function renderizarReportes() {
  if (!ES_REPORTES) return;

  const pedidosFiltrados = obtenerPedidosFiltradosReporte();
  const ingresos = pedidosFiltrados.reduce((acc, pedido) => acc + Number(pedido.total || 0), 0);
  const ticketPromedio = pedidosFiltrados.length ? ingresos / pedidosFiltrados.length : 0;
  const clientesActivos = clientes.filter(cliente => Number(cliente.activo) === 1).length;
  const valorInventario = productos.reduce((acc, producto) => acc + (Number(producto.precio || 0) * Number(producto.cantidad || 0)), 0);
  const stockBajo = productos.filter(producto => Number(producto.cantidad || 0) <= 10);
  const pedidosEntregados = pedidosFiltrados.filter(pedido => pedido.estado === 'entregado').length;
  const pedidosPendientes = pedidosFiltrados.filter(pedido => pedido.estado === 'pendiente').length;

  setText('rep-ingresos', `$${ingresos.toFixed(2)}`);
  setText('rep-pedidos', String(pedidosFiltrados.length));
  setText('rep-ticket', `$${ticketPromedio.toFixed(2)}`);
  setText('rep-clientes', String(clientesActivos));
  setText('rep-inventario', `$${valorInventario.toFixed(2)}`);
  setText('rep-stock-bajo', String(stockBajo.length));
  setText('rep-entregados', String(pedidosEntregados));
  setText('rep-pendientes', String(pedidosPendientes));

  renderizarTopCategorias();
  renderizarTablaStockBajo(stockBajo);
  renderizarGraficosReportes(pedidosFiltrados);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderizarTopCategorias() {
  const contenedor = document.getElementById('top-categorias');
  if (!contenedor) return;

  const resumen = {};
  productos.forEach(producto => {
    const categoria = producto.categoria || 'Sin categoría';
    if (!resumen[categoria]) {
      resumen[categoria] = { cantidad: 0, valor: 0 };
    }
    resumen[categoria].cantidad += Number(producto.cantidad || 0);
    resumen[categoria].valor += Number(producto.precio || 0) * Number(producto.cantidad || 0);
  });

  const top = Object.entries(resumen)
    .sort((a, b) => b[1].valor - a[1].valor)
    .slice(0, 5);

  contenedor.innerHTML = top.length
    ? top.map(([nombre, data]) => `
        <div class="top-list-item">
          <div>
            <strong>${nombre}</strong>
            <span>${data.cantidad} unidades</span>
          </div>
          <b>$${data.valor.toFixed(2)}</b>
        </div>
      `).join('')
    : '<p class="empty-note">Todavía no hay datos suficientes para mostrar categorías.</p>';
}

function renderizarTablaStockBajo(lista) {
  const tbody = document.querySelector('#reporte-stock-table tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="5">No hay productos con stock bajo en este momento.</td></tr>';
    return;
  }

  lista
    .sort((a, b) => Number(a.cantidad || 0) - Number(b.cantidad || 0))
    .forEach(producto => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${producto.nombre}</td>
        <td>${producto.categoria || '-'}</td>
        <td>${producto.proveedor || '-'}</td>
        <td><span class="badge cancelado">${producto.cantidad}</span></td>
        <td>$${Number(producto.precio || 0).toFixed(2)}</td>
      `;
      tbody.appendChild(fila);
    });
}

function renderizarGraficosReportes(pedidosFiltrados) {
  if (!window.Chart) return;

  const estados = {};
  pedidosFiltrados.forEach(pedido => {
    const estado = pedido.estado || 'sin estado';
    estados[estado] = (estados[estado] || 0) + 1;
  });

  const categorias = {};
  productos.forEach(producto => {
    const categoria = producto.categoria || 'Sin categoría';
    categorias[categoria] = (categorias[categoria] || 0) + (Number(producto.precio || 0) * Number(producto.cantidad || 0));
  });

  const etiquetasEstados = Object.keys(estados).length ? Object.keys(estados) : ['Sin datos'];
  const valoresEstados = Object.keys(estados).length ? Object.values(estados) : [1];
  const etiquetasCategorias = Object.keys(categorias).length ? Object.keys(categorias) : ['Sin datos'];
  const valoresCategorias = Object.keys(categorias).length ? Object.values(categorias) : [0];

  const ctxEstados = document.getElementById('reportesEstadosChart');
  const ctxCategorias = document.getElementById('reportesCategoriasChart');
  if (!ctxEstados || !ctxCategorias) return;

  if (graficoReportesEstados) graficoReportesEstados.destroy();
  if (graficoReportesCategorias) graficoReportesCategorias.destroy();

  graficoReportesEstados = new Chart(ctxEstados, {
    type: 'doughnut',
    data: {
      labels: etiquetasEstados,
      datasets: [{
        data: valoresEstados,
        backgroundColor: ['#f5c14b', '#4f8ef7', '#7c8cff', '#2db983', '#ef6b81'],
        borderColor: '#ffffff',
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 14, boxHeight: 14, padding: 16, font: { size: 12 } }
        }
      }
    }
  });

  graficoReportesCategorias = new Chart(ctxCategorias, {
    type: 'bar',
    data: {
      labels: etiquetasCategorias,
      datasets: [{
        label: 'Valor por categoría',
        data: valoresCategorias,
        backgroundColor: 'rgba(13, 99, 200, 0.42)',
        borderColor: 'rgba(13, 99, 200, 0.95)',
        borderWidth: 1,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { display: false }
        },
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function descargarCSV(nombreArchivo, encabezados, filas) {
  const contenido = [
    encabezados.join(','),
    ...filas.map(fila => fila.map(valor => `"${String(valor ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

function exportarPedidosCSV() {
  const filas = obtenerPedidosFiltradosReporte().map(pedido => [
    pedido.id,
    pedido.cliente,
    formatearFecha(pedido.fecha),
    pedido.estado,
    Number(pedido.total || 0).toFixed(2),
    pedido.metodo
  ]);

  descargarCSV('reporte_pedidos.csv', ['ID', 'Cliente', 'Fecha', 'Estado', 'Total', 'Método'], filas);
}

function exportarInventarioCSV() {
  const filas = productos.map(producto => [
    producto.id,
    producto.nombre,
    producto.categoria || '',
    producto.proveedor || '',
    Number(producto.cantidad || 0),
    Number(producto.precio || 0).toFixed(2)
  ]);

  descargarCSV('reporte_inventario.csv', ['ID', 'Nombre', 'Categoría', 'Proveedor', 'Stock', 'Precio'], filas);
}

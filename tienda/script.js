let productos = [];
const API_BASE = 'http://localhost:3000';

const productosDemo = [

  { id: 1, nombre: 'Paracetamol 500mg', precio: 2.5, categoria: 'Analgésicos', stock: 120, descripcion: 'Alivia dolor y fiebre. Caja con 20 tabletas.' },
  { id: 2, nombre: 'Vitamina C 1000mg', precio: 5.0, categoria: 'Vitaminas', stock: 80, descripcion: 'Tabletas efervescentes para fortalecer defensas.' },
  { id: 3, nombre: 'Ibuprofeno 400mg', precio: 3.75, categoria: 'Antiinflamatorios', stock: 60, descripcion: 'Reduce dolor e inflamación. Caja de 20.' },
  { id: 4, nombre: 'Jarabe para tos', precio: 6.5, categoria: 'Respiratorio', stock: 45, descripcion: 'Calma la tos seca y ayuda a respirar mejor.' },
  { id: 5, nombre: 'Protector solar SPF50', precio: 9.0, categoria: 'Dermatología', stock: 30, descripcion: 'Protección alta para uso diario.' },
  { id: 6, nombre: 'Alcohol gel 500ml', precio: 4.0, categoria: 'Higiene', stock: 200, descripcion: 'Limpieza rápida de manos sin agua.' },
  { id: 7, nombre: 'Suero oral', precio: 1.75, categoria: 'Hidratación', stock: 100, descripcion: 'Rehidrata y repone electrolitos.' },
  { id: 8, nombre: 'Termómetro digital', precio: 12.0, categoria: 'Equipos', stock: 25, descripcion: 'Lectura rápida y precisa de temperatura.' }

];

const API = {
  getCart() {
    try { return JSON.parse(localStorage.getItem('mf_cart')) || []; } catch { return []; }
  },
  setCart(cart) {
    localStorage.setItem('mf_cart', JSON.stringify(cart));
  },
  getCustomer() {
    try { return JSON.parse(localStorage.getItem('mf_customer')) || {}; } catch { return {}; }
  },
  setCustomer(data) {
    localStorage.setItem('mf_customer', JSON.stringify(data || {}));
  },
  getStoreUser() {
    try { return JSON.parse(localStorage.getItem('mf_store_user')) || null; } catch { return null; }
  },
  setStoreUser(user) {
    localStorage.setItem('mf_store_user', JSON.stringify(user));
  },
  clearStoreUser() {
    localStorage.removeItem('mf_store_user');
  }
};

function formatMoney(n) {
  return `$${Number(n).toFixed(2)}`;
}

function updateStoreAuthUI() {
  const user = API.getStoreUser();
  const authLinks = document.querySelectorAll('[data-store-auth]');
  authLinks.forEach(link => {
    if (user) {
      const name = [user.nombre, user.apellido].filter(Boolean).join(' ').trim() || user.usuario;
      link.textContent = name ? `Hola, ${name}` : 'Mi cuenta';
      link.setAttribute('href', 'mis-pedidos.html');
    } else {
      link.textContent = 'Ingresar';
      link.setAttribute('href', 'login.html');
    }
  });

  const logoutBtns = document.querySelectorAll('[data-store-logout]');
  logoutBtns.forEach(btn => {
    btn.hidden = !user;
    btn.onclick = e => {
      e.preventDefault();
      API.clearStoreUser();
      updateStoreAuthUI();
      window.location.href = 'index.html';
    };
  });
}

function requireStoreAuth() {
  const protectedPages = ['checkout.html', 'mis-pedidos.html', 'pedido.html'];
  const page = window.location.pathname.split('/').pop();
  if (!protectedPages.includes(page)) return;
  if (API.getStoreUser()) return;
  const backTo = encodeURIComponent(page + window.location.search);
  window.location.href = `login.html?next=${backTo}`;
}

function initStoreLogin() {
  const form = document.querySelector('[data-store-login-form]');
  if (!form) return;

  if (API.getStoreUser()) {
    window.location.href = 'index.html';
    return;
  }

  const feedback = document.querySelector('[data-store-login-msg]');
  const btn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const usuario = (document.getElementById('store-login-usuario')?.value || '').trim();
    const password = (document.getElementById('store-login-password')?.value || '').trim();
    if (!usuario || !password) {
      if (feedback) feedback.textContent = 'Completa usuario y contraseña.';
      return;
    }
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Entrando...';
    }
    if (feedback) feedback.textContent = '';

    try {
      const res = await fetch(`${API_BASE}/tienda/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'No se pudo iniciar sesión');

      API.setStoreUser(data.user);
      updateStoreAuthUI();
      const next = new URLSearchParams(window.location.search).get('next') || 'index.html';
      window.location.href = next;
    } catch (err) {
      if (feedback) feedback.textContent = err.message || 'Error de autenticación.';
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Iniciar sesión';
      }
    }
  });
}

function getProductImage(producto) {
  if (producto.imagen_url) return producto.imagen_url;
  const categoria = (producto.categoria || '').toLowerCase();
  if (categoria.includes('vitamina')) return 'assets/productos/vitaminas.svg';
  if (categoria.includes('respiratorio')) return 'assets/productos/respiratorio.svg';
  if (categoria.includes('dermat')) return 'assets/productos/dermatologia.svg';
  if (categoria.includes('higiene')) return 'assets/productos/higiene.svg';
  if (categoria.includes('equipo')) return 'assets/productos/equipos.svg';
  return 'assets/productos/analgesicos.svg';
}


function cargarProductosAPI() {
  return fetch(`${API_BASE}/productos`)
    .then(res => res.json())
    .then(data => {
      productos = data.map(p => ({
        id: p.id,
        nombre: p.nombre,
        precio: Number(p.precio),
        categoria: p.categoria || 'General',
        stock: p.cantidad ?? 0,
        descripcion: p.descripcion || '',
        imagen_url: p.imagen_url || ''
      }));
      renderCatalogo(document.querySelector('.search-bar input')?.value || '');
    })
    .catch(() => {
      if (!productos.length) {
        productos = productosDemo;
        renderCatalogo(document.querySelector('.search-bar input')?.value || '');
      }
    });
}

function renderCatalogo(filtro = '') {
  const grid = document.querySelector('[data-products]');
  if (!grid) return;
  grid.innerHTML = '';
  const texto = filtro.toLowerCase().trim();
  const lista = texto
    ? productos.filter(p =>
        p.nombre.toLowerCase().includes(texto) ||
        p.categoria.toLowerCase().includes(texto) ||
        p.descripcion.toLowerCase().includes(texto)
      )
    : productos;
  lista.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <a class="product-link" href="producto.html?id=${p.id}">
        <div class="product-image">
          <img class="product-photo" src="${getProductImage(p)}" alt="${p.nombre}" loading="lazy" />
          <span class="product-tag">${p.categoria}</span>
        </div>
      </a>
      <a class="product-link" href="producto.html?id=${p.id}">
        <h3>${p.nombre}</h3>
      </a>
      <div class="small">${p.descripcion}</div>
      <div class="small">Stock disponible: ${p.stock}</div>
      <div class="price">${formatMoney(p.precio)}</div>
      <div class="qty-row">
        <input class="qty-input" type="number" min="1" value="1" />
        <button class="btn" data-add="${p.id}">Agregar</button>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const qtyInput = btn.closest('.card')?.querySelector('.qty-input');
      const qty = Math.max(1, Number(qtyInput?.value || 1));
      addToCart(Number(btn.dataset.add), qty);
    });
  });
}

function addToCart(id, qty = 1) {
  const cart = API.getCart();
  const item = cart.find(c => c.id === id);
  if (item) item.qty += qty;
  else {
    const p = productos.find(x => x.id === id);
    cart.push({ id: p.id, nombre: p.nombre, precio: p.precio, qty });
  }
  API.setCart(cart);
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.querySelector('[data-cart-badge]');
  if (!badge) return;
  const total = API.getCart().reduce((acc, c) => acc + c.qty, 0);
  badge.textContent = total;
  badge.classList.remove('active', 'empty');
  if (total > 0) {
    void badge.offsetWidth;
    badge.classList.add('active');
  } else {
    badge.classList.add('empty');
  }
}

function renderDetail() {
  const container = document.querySelector('[data-detail]');
  if (!container) return;
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get('id') || 1);
  const p = productos.find(x => x.id === id) || productos[0];
  if (!p) return;
  container.innerHTML = `
    <div class="product-image detail-image">
      <img class="product-photo" src="${getProductImage(p)}" alt="${p.nombre}" loading="lazy" />
      <span class="product-tag">${p.categoria}</span>
    </div>
    <div>
      <h2 class="section-title">${p.nombre}</h2>
      <p class="small">${p.descripcion}</p>
      <div class="price" style="margin: 12px 0;">${formatMoney(p.precio)}</div>
      <div class="product-meta-grid">
        <div class="product-meta-item">
          <span>Categoría</span>
          <strong>${p.categoria}</strong>
        </div>
        <div class="product-meta-item">
          <span>Disponibilidad</span>
          <strong>${p.stock} unidades</strong>
        </div>
        <div class="product-meta-item">
          <span>Entrega</span>
          <strong>El mismo día</strong>
        </div>
      </div>
      <div class="notice">Producto respaldado por nuestro control de stock y revisión farmacéutica.</div>
      <div style="margin-top: 14px; display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn" data-add="${p.id}">Agregar al carrito</button>
        <a class="btn btn-outline" href="carrito.html">Ver carrito</a>
      </div>
    </div>
  `;
  container.querySelector('[data-add]').addEventListener('click', () => addToCart(p.id));
}

function renderCart() {
  const tableBody = document.querySelector('[data-cart-body]');
  const totalEl = document.querySelector('[data-cart-total]');
  if (!tableBody || !totalEl) return;

  const cart = API.getCart();
  tableBody.innerHTML = '';

  let total = 0;
  cart.forEach(item => {
    total += item.precio * item.qty;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.nombre}</td>
      <td>${formatMoney(item.precio)}</td>
      <td>
        <div class="qty-controls">
          <button class="btn btn-outline" data-qty="${item.id}" data-step="-1">-</button>
          <span>${item.qty}</span>
          <button class="btn btn-outline" data-qty="${item.id}" data-step="1">+</button>
        </div>
      </td>
      <td>${formatMoney(item.precio * item.qty)}</td>
      <td><button class="btn btn-outline" data-remove="${item.id}">Quitar</button></td>
    `;
    tableBody.appendChild(tr);
  });

  totalEl.textContent = formatMoney(total);

  tableBody.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(Number(btn.dataset.remove)));
  });

  tableBody.querySelectorAll('[data-qty]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.qty);
      const step = Number(btn.dataset.step);
      updateQty(id, step);
    });
  });
}

function removeFromCart(id) {
  const cart = API.getCart().filter(c => c.id !== id);
  API.setCart(cart);
  renderCart();
  updateCartBadge();
}

function updateQty(id, step) {
  const cart = API.getCart();
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + step);
  API.setCart(cart);
  renderCart();
  updateCartBadge();
}

function renderCheckout() {
  const totalEl = document.querySelector('[data-checkout-total]');
  const itemsEl = document.querySelector('[data-checkout-items]');
  const submitBtn = document.querySelector('[data-checkout-submit]');
  if (!totalEl) return;

  const cart = API.getCart();
  const total = cart.reduce((acc, c) => acc + c.precio * c.qty, 0);
  totalEl.textContent = formatMoney(total);

  if (itemsEl) {
    if (!cart.length) {
      itemsEl.innerHTML = `<div class="small">No hay productos en el carrito.</div>`;
    } else {
      itemsEl.innerHTML = cart.map(item => `
        <div class="checkout-item">
          <span>${item.nombre} x${item.qty}</span>
          <strong>${formatMoney(item.precio * item.qty)}</strong>
        </div>
      `).join('');
    }
  }

  if (submitBtn) {
    submitBtn.disabled = cart.length === 0;
    submitBtn.style.opacity = cart.length === 0 ? '0.7' : '1';
    submitBtn.style.cursor = cart.length === 0 ? 'not-allowed' : 'pointer';
  }
}

async function submitCheckout(e) {
  e.preventDefault();

  const feedback = document.querySelector('[data-checkout-feedback]');
  const submitBtn = document.querySelector('[data-checkout-submit]');
  const cart = API.getCart();

  if (!cart.length) {
    if (feedback) {
      feedback.className = 'checkout-feedback error';
      feedback.textContent = 'Tu carrito está vacío.';
    }
    return;
  }

  const payload = {
    cliente: {
      nombre: (document.getElementById('checkout-nombre')?.value || '').trim(),
      apellido: (document.getElementById('checkout-apellido')?.value || '').trim(),
      telefono: (document.getElementById('checkout-telefono')?.value || '').trim(),
      email: (document.getElementById('checkout-email')?.value || '').trim(),
      direccion: (document.getElementById('checkout-direccion')?.value || '').trim(),
      ciudad: (document.getElementById('checkout-ciudad')?.value || '').trim()
    },
    metodo: (document.getElementById('checkout-metodo')?.value || '').trim(),
    notas: (document.getElementById('checkout-notas')?.value || '').trim(),
    items: cart.map(item => ({ id: item.id, qty: item.qty }))
  };

  if (!payload.cliente.nombre || !payload.cliente.apellido || !payload.cliente.telefono || !payload.cliente.direccion || !payload.cliente.ciudad) {
    if (feedback) {
      feedback.className = 'checkout-feedback error';
      feedback.textContent = 'Completa nombre, apellido, teléfono, dirección y ciudad.';
    }
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Procesando...';
  }
  if (feedback) {
    feedback.className = 'checkout-feedback';
    feedback.textContent = '';
  }

  try {
    const res = await fetch(`${API_BASE}/tienda/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'No se pudo crear el pedido.');
    }

    API.setCart([]);
    API.setCustomer({
      telefono: payload.cliente.telefono,
      email: payload.cliente.email
    });
    updateCartBadge();
    renderCheckout();

    if (feedback) {
      feedback.className = 'checkout-feedback success';
      feedback.innerHTML = `Pedido #${data.pedido.id} creado correctamente. <a href="pedido.html?id=${data.pedido.id}">Ver detalle</a>`;
    }
  } catch (error) {
    if (feedback) {
      feedback.className = 'checkout-feedback error';
      feedback.textContent = error.message || 'Error al crear el pedido.';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirmar pedido';
    }
  }
}

function renderOrderHistory() {
  const listEl = document.querySelector('[data-orders-list]');
  const formEl = document.querySelector('[data-orders-filter]');
  if (!listEl) return;

  const initial = API.getCustomer();
  const telInput = document.getElementById('orders-telefono');
  const emailInput = document.getElementById('orders-email');
  if (telInput && initial.telefono) telInput.value = initial.telefono;
  if (emailInput && initial.email) emailInput.value = initial.email;

  const load = async () => {
    const telefono = (telInput?.value || '').trim();
    const email = (emailInput?.value || '').trim();
    const qs = new URLSearchParams();
    if (telefono) qs.set('telefono', telefono);
    if (email) qs.set('email', email);

    listEl.innerHTML = `<div class="small">Cargando pedidos...</div>`;
    try {
      const res = await fetch(`${API_BASE}/tienda/pedidos?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al cargar pedidos');

      if (!Array.isArray(data) || !data.length) {
        listEl.innerHTML = `<div class="small">No encontramos pedidos con esos datos.</div>`;
        return;
      }

      listEl.innerHTML = data.map(p => `
        <article class="order-card">
          <div><strong>Pedido #${p.id}</strong></div>
          <div class="small">Cliente: ${p.cliente}</div>
          <div class="small">Fecha: ${String(p.fecha).slice(0, 10)}</div>
          <div><span class="badge ${p.estado}">${p.estado}</span></div>
          <div class="small">Método: ${p.metodo}</div>
          <div class="price">${formatMoney(p.total)}</div>
          <a class="btn btn-outline" href="pedido.html?id=${p.id}">Ver detalle</a>
        </article>
      `).join('');
    } catch (error) {
      listEl.innerHTML = `<div class="small">No se pudieron cargar los pedidos.</div>`;
    }
  };

  formEl?.addEventListener('submit', e => {
    e.preventDefault();
    load();
  });

  load();
}

function renderOrderDetail() {
  const detailEl = document.querySelector('[data-order-detail]');
  if (!detailEl) return;

  const id = Number(new URLSearchParams(window.location.search).get('id'));
  if (!Number.isInteger(id) || id <= 0) {
    detailEl.innerHTML = `<div class="small">Pedido inválido.</div>`;
    return;
  }

  detailEl.innerHTML = `<div class="small">Cargando pedido...</div>`;
  fetch(`${API_BASE}/tienda/pedidos/${id}`)
    .then(res => res.json().then(data => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (!ok) throw new Error(data.message || 'Error');
      const p = data.pedido;
      const detalles = data.detalles || [];
      detailEl.innerHTML = `
        <div class="card">
          <h3>Pedido #${p.id}</h3>
          <div class="small">Cliente: ${p.cliente}</div>
          <div class="small">Fecha: ${String(p.fecha).slice(0, 10)}</div>
          <div><span class="badge ${p.estado}">${p.estado}</span></div>
          <div class="small">Método: ${p.metodo}</div>
          <div class="small">${p.notas || ''}</div>
        </div>
        <table class="cart-table" style="margin-top: 14px;">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Cantidad</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${detalles.map(d => `
              <tr>
                <td>${d.producto_nombre}</td>
                <td>${formatMoney(d.precio_unitario)}</td>
                <td>${d.cantidad}</td>
                <td>${formatMoney(d.subtotal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="cart-summary" style="margin-top: 14px;">
          <div><strong>Total:</strong> ${formatMoney(p.total)}</div>
        </div>
      `;
    })
    .catch(() => {
      detailEl.innerHTML = `<div class="small">No se pudo cargar este pedido.</div>`;
    });
}

function initHeroSlider() {
  const slider = document.querySelector('[data-hero-slider]');
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll('.hero-slide'));
  const dotsWrap = slider.querySelector('[data-hero-dots]');
  const prevBtn = slider.querySelector('[data-hero-prev]');
  const nextBtn = slider.querySelector('[data-hero-next]');
  let index = 0;
  let timer;

  if (!slides.length) return;

  if (dotsWrap) {
    dotsWrap.innerHTML = slides
      .map((_, i) => `<button type="button" class="hero-dot ${i === 0 ? 'active' : ''}" data-dot="${i}" aria-label="Ir al slide ${i + 1}"></button>`)
      .join('');
  }

  const setSlide = newIndex => {
    index = (newIndex + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
    dotsWrap?.querySelectorAll('[data-dot]').forEach(dot => {
      dot.classList.toggle('active', Number(dot.dataset.dot) === index);
    });
  };

  const restart = () => {
    clearInterval(timer);
    timer = setInterval(() => setSlide(index + 1), 5000);
  };

  prevBtn?.addEventListener('click', () => {
    setSlide(index - 1);
    restart();
  });
  nextBtn?.addEventListener('click', () => {
    setSlide(index + 1);
    restart();
  });
  dotsWrap?.querySelectorAll('[data-dot]').forEach(dot => {
    dot.addEventListener('click', () => {
      setSlide(Number(dot.dataset.dot));
      restart();
    });
  });

  restart();
}

function initDealSlider() {
  const track = document.querySelector('[data-deal-slider]');
  if (!track) return;

  const left = document.querySelector('[data-scroll-left]');
  const right = document.querySelector('[data-scroll-right]');
  const amount = 260;

  left?.addEventListener('click', () => {
    track.scrollBy({ left: -amount, behavior: 'smooth' });
  });

  right?.addEventListener('click', () => {
    track.scrollBy({ left: amount, behavior: 'smooth' });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  requireStoreAuth();
  updateStoreAuthUI();
  initStoreLogin();

  const params = new URLSearchParams(window.location.search);
  const query = params.get('buscar') || '';
  const searchInput = document.querySelector('.search-bar input');
  const searchBtn = document.querySelector('.search-btn');
  const suggestBox = document.querySelector('.search-suggest');
  let typingTimer;

  if (searchInput) {
    searchInput.value = query;
  }

  function doSearch() {
    const value = (searchInput?.value || '').trim();
    if (window.location.pathname.endsWith('catalogo.html')) {
      renderCatalogo(value);
    } else {
      window.location.href = `catalogo.html?buscar=${encodeURIComponent(value)}`;
    }
  }

  searchBtn?.addEventListener('click', e => {
    e.preventDefault();
    doSearch();
  });

  searchInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doSearch();
    }
  });

  searchInput?.addEventListener('input', () => {
    if (!suggestBox || !searchInput) return;
    const value = searchInput.value.trim();
    clearTimeout(typingTimer);

    if (!value) {
      suggestBox.hidden = true;
      suggestBox.innerHTML = '';
      return;
    }

    suggestBox.hidden = false;
    suggestBox.innerHTML = `<div class="loading">Cargando...</div>`;

    typingTimer = setTimeout(() => {
      const texto = value.toLowerCase();
      const filtrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(texto) ||
        p.categoria.toLowerCase().includes(texto) ||
        p.descripcion.toLowerCase().includes(texto)
      ).slice(0, 6);

      if (!filtrados.length) {
        suggestBox.innerHTML = `<div class="loading">Sin resultados</div>`;
        return;
      }

      suggestBox.innerHTML = filtrados.map(p => `
        <div class="search-item" data-id="${p.id}">
          <img class="search-thumb" src="${getProductImage(p)}" alt="${p.nombre}" loading="lazy" />
          <div class="search-item-copy">
            <div>${p.nombre}</div>
            <small>${p.categoria}</small>
          </div>
          <strong>${formatMoney(p.precio)}</strong>
        </div>
      `).join('');

      suggestBox.querySelectorAll('.search-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.dataset.id;
          window.location.href = `producto.html?id=${id}`;
        });
      });
    }, 250);
  });

  updateCartBadge();
  cargarProductosAPI().then(() => {
    renderDetail();
  });
  setInterval(cargarProductosAPI, 20000);
  renderCart();
  renderCheckout();
  renderOrderHistory();
  renderOrderDetail();
  initHeroSlider();
  initDealSlider();

  const checkoutForm = document.querySelector('[data-checkout-form]');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', submitCheckout);
  }
});


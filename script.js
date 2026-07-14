/* =============================================
   PIPILUZ – main.js
   ============================================= */

// ----- Datos de productos (se cargan desde data/productos.json) -----
let productos = [];
let coloresDisponibles = [];

async function cargarProductos() {
  try {
    const respuesta = await fetch ("data/products.json");
    if (!respuesta.ok) throw new Error("No se pudo cargar products.json");
    const data = await respuesta.json();

    coloresDisponibles = data.colores || [];
    productos = data.productos || [];

    return productos;
  } catch (error) {
    console.error("Error al cargar productos:", error);
    mostrarToast("⚠️ No se pudieron cargar los productos");
    return [];
  }
}

// ----- Carrito -----
let carrito = JSON.parse(localStorage.getItem("pipiluz_carrito")) || [];

function guardarCarrito() {
  localStorage.setItem("pipiluz_carrito", JSON.stringify(carrito));
  actualizarBadge();
}

function actualizarBadge() {
  const badge = document.getElementById("cartBadge");
  if (badge) badge.textContent = carrito.reduce((acc, i) => acc + i.qty, 0);
}

function agregarAlCarrito(id) {
  const prod = productos.find(p => p.id === id);
  if (!prod) return;
  const existente = carrito.find(i => i.id === id);
  if (existente) {
    existente.qty++;
  } else {
    carrito.push({ ...prod, qty: 1 });
  }
  guardarCarrito();
  mostrarToast(`¡${prod.nombre} agregado al carrito! 🛒`);
}

// ----- Toast notification -----
function mostrarToast(msg) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("toast--show"));
  setTimeout(() => {
    toast.classList.remove("toast--show");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Estilos del toast (inyectados por JS para que no requieran CSS extra)
const toastStyle = document.createElement("style");
toastStyle.textContent = `
  .toast {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: #2C2240;
    color: #fff;
    padding: .8rem 1.6rem;
    border-radius: 50px;
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    font-size: .95rem;
    box-shadow: 0 8px 24px rgba(0,0,0,.25);
    transition: transform .3s ease, opacity .3s ease;
    opacity: 0;
    z-index: 9999;
  }
  .toast--show { transform: translateX(-50%) translateY(0); opacity: 1; }
`;
document.head.appendChild(toastStyle);

// ----- Carrusel de imágenes por producto -----
function initCarrusel(producto) {
  const wrapper = document.querySelector(`.product-carousel[data-id="${producto.id}"]`);
  if (!wrapper) return;

  let index = 0;
  const img = wrapper.querySelector(".carousel-img");
  const dotsContainer = wrapper.querySelector(".carousel-dots");
  const btnPrev = wrapper.querySelector(".carousel-btn--prev");
  const btnNext = wrapper.querySelector(".carousel-btn--next");

  function render() {
    img.src = producto.imagenes[index];
    img.alt = producto.nombre;

    dotsContainer.innerHTML = "";
    producto.imagenes.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className = "carousel-dot" + (i === index ? " active" : "");
      dot.addEventListener("click", () => {
        index = i;
        render();
      });
      dotsContainer.appendChild(dot);
    });
  }

  btnPrev.addEventListener("click", () => {
    index = (index - 1 + producto.imagenes.length) % producto.imagenes.length;
    render();
  });

  btnNext.addEventListener("click", () => {
    index = (index + 1) % producto.imagenes.length;
    render();
  });

  render();
}

// ----- Renderizar productos -----
function renderProductos(lista, contenedor, limite = 4) {
  if (!contenedor) return;
  contenedor.innerHTML = "";

  lista.slice(0, limite).forEach(p => {
    const tieneVariasFotos = Array.isArray(p.imagenes) && p.imagenes.length > 0;
    const primeraImagen = tieneVariasFotos ? p.imagenes[0] : "img/productos/placeholder.webp";

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-carousel" data-id="${p.id}">
        <button class="carousel-btn carousel-btn--prev" aria-label="Foto anterior">‹</button>
        <img class="carousel-img" src="${primeraImagen}" alt="${p.nombre}">
        <button class="carousel-btn carousel-btn--next" aria-label="Foto siguiente">›</button>
        <div class="carousel-dots"></div>
      </div>
      <div class="product-card__body">
        <p class="product-card__name">${p.nombre}</p>
        <p class="product-card__price">${p.precio > 0 ? '$' + p.precio.toLocaleString("es-AR") : "Consultá el precio"}</p>
        <a href="producto.html?id=${p.id}" class="product-card__btn">Ver producto</a>
      </div>
    `;
    contenedor.appendChild(card);

    // Activar el carrusel de este producto si tiene más de una foto
    if (tieneVariasFotos && p.imagenes.length > 1) {
      initCarrusel(p);
    }
  });
}

// ----- Hamburger menu -----
function initHamburger() {
  const ham = document.getElementById("hamburger");
  const nav = document.getElementById("nav");
  if (!ham || !nav) return;
  ham.addEventListener("click", () => nav.classList.toggle("open"));
  // Cerrar al hacer click en un link
  nav.querySelectorAll(".nav__link").forEach(l =>
    l.addEventListener("click", () => nav.classList.remove("open"))
  );
}

// ----- Marcar link activo -----
function marcarActivo() {
  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav__link").forEach(l => {
    const href = l.getAttribute("href");
    l.classList.toggle("active", href === page);
  });
}

// ----- Scroll reveal suave -----
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.animation = "fadeUp .6s ease both";
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".cat-card, .product-card").forEach(el => {
    el.style.opacity = "0";
    observer.observe(el);
  });
}

// ----- Filtros de categoría (página tienda) -----
function initFiltros() {
  const btns = document.querySelectorAll(".filtro-btn");
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      btns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.dataset.cat;
      const filtrados = cat === "todos" ? productos : productos.filter(p => p.categoria === cat);
      renderProductos(filtrados, document.getElementById("allProducts"), filtrados.length);
    });
  });

  // Activar filtro si viene ?cat= en la URL
  const params = new URLSearchParams(window.location.search);
  const catUrl = params.get("cat");
  if (catUrl) {
    const btnActivo = document.querySelector(`.filtro-btn[data-cat="${catUrl}"]`);
    if (btnActivo) btnActivo.click();
  }
}

// ----- Formulario de contacto -----
function initFormularioContacto() {
  const btn = document.getElementById("btnEnviarContacto");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const nombre = document.getElementById("nombre").value;
    const email = document.getElementById("email").value;
    if (!nombre || !email) {
      mostrarToast("⚠️ Por favor completá nombre y email.");
      return;
    }
    mostrarToast("✅ ¡Mensaje enviado! Te respondemos pronto.");
    document.getElementById("nombre").value = "";
    document.getElementById("email").value = "";
    document.getElementById("mensaje").value = "";
  });
}

// ----- Página de carrito -----
function renderCarrito() {
  const contenido = document.getElementById("carritoContenido");
  if (!contenido) return;

  if (!carrito.length) {
    contenido.innerHTML = `
      <div class="carrito-vacio">
        <div class="big">🛍️</div>
        <h2 style="font-family:'Baloo 2',cursive;font-weight:800;margin-bottom:.5rem">Tu carrito está vacío</h2>
        <p>¡Explorá la tienda y encontrá algo que te guste!</p>
        <a href="tienda.html" class="btn btn--primary" style="margin-top:1.5rem">Ir a la tienda</a>
      </div>`;
    return;
  }

  const total = carrito.reduce((s, i) => s + i.precio * i.qty, 0);
  const envio = total >= 30000 ? 0 : 1500;

  contenido.innerHTML = `
    <div class="carrito-wrap">
      <div class="carrito-items">
        ${carrito.map(i => {
          const miniatura = Array.isArray(i.imagenes) && i.imagenes.length
            ? `<img src="${i.imagenes[0]}" alt="${i.nombre}" style="width:50px;height:50px;object-fit:cover;border-radius:8px;">`
            : `<div class="carrito-item__emoji">🛍️</div>`;
          return `
            <div class="carrito-item">
              ${miniatura}
              <div class="carrito-item__info">
                <div class="carrito-item__name">${i.nombre}</div>
                <div class="carrito-item__price">$${(i.precio * i.qty).toLocaleString("es-AR")}</div>
              </div>
              <div class="qty-control">
                <button class="qty-btn" data-action="restar" data-id="${i.id}">−</button>
                <span style="font-weight:700;min-width:20px;text-align:center">${i.qty}</span>
                <button class="qty-btn" data-action="sumar" data-id="${i.id}">+</button>
              </div>
              <button class="qty-btn" data-action="quitar" data-id="${i.id}" style="border-color:#f00;color:#f00;">✕</button>
            </div>`;
        }).join("")}
      </div>
      <div class="resumen">
        <h3>Resumen</h3>
        <div class="resumen-row"><span>Subtotal</span><span>$${total.toLocaleString("es-AR")}</span></div>
        <div class="resumen-row"><span>Envío</span><span>${envio === 0 ? '🎉 Gratis' : '$' + envio.toLocaleString("es-AR")}</span></div>
        <div class="resumen-row resumen-total"><span>Total</span><span>$${(total + envio).toLocaleString("es-AR")}</span></div>
        <button class="btn btn--primary" id="btnFinalizarCompra" style="width:100%;margin-top:1rem">Finalizar compra →</button>
        <a href="tienda.html" style="display:block;text-align:center;margin-top:.8rem;color:var(--texto-soft);font-size:.9rem">← Seguir comprando</a>
      </div>
    </div>`;

  // Eventos de cantidad y eliminar (delegación simple por botón)
  contenido.querySelectorAll(".qty-btn[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const accion = btn.dataset.action;
      if (accion === "sumar") cambiarQty(id, 1);
      if (accion === "restar") cambiarQty(id, -1);
      if (accion === "quitar") quitarItem(id);
    });
  });

  const btnFinalizar = document.getElementById("btnFinalizarCompra");
  if (btnFinalizar) btnFinalizar.addEventListener("click", finalizarCompra);
}

function cambiarQty(id, delta) {
  const item = carrito.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) carrito = carrito.filter(i => i.id !== id);
  guardarCarrito();
  renderCarrito();
}

function quitarItem(id) {
  carrito = carrito.filter(i => i.id !== id);
  guardarCarrito();
  renderCarrito();
}

function finalizarCompra() {
  mostrarToast("✅ ¡Pedido recibido! Nos contactamos pronto.");
  carrito = [];
  guardarCarrito();
  renderCarrito();
}

// ----- Init -----
document.addEventListener("DOMContentLoaded", async () => {
  actualizarBadge();
  initHamburger();
  marcarActivo();
  initFormularioContacto();

  await cargarProductos();

  // Página de carrito
  if (document.getElementById("carritoContenido")) renderCarrito();

  // Productos destacados en index
  const grid = document.getElementById("featuredProducts");
  if (grid) renderProductos(productos, grid, 4);

  // Todos los productos en tienda
  const gridTienda = document.getElementById("allProducts");
  if (gridTienda) {
    renderProductos(productos, gridTienda, productos.length);
    initFiltros();
  }

  // Página de detalle de producto
  if (document.getElementById("productoContenido")) initPaginaDetalle();

  initScrollReveal();
});

// =============================================
//   PÁGINA DE DETALLE DE PRODUCTO
// =============================================
function initPaginaDetalle() {
  const contenedor = document.getElementById("productoContenido");
  if (!contenedor) return;

  // Leer el ?id=X de la URL
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get("id"));

  if (!id) {
    contenedor.innerHTML = `<p class="producto-loading">Producto no encontrado. <a href="tienda.html">Volver a la tienda</a></p>`;
    return;
  }

  const producto = productos.find(p => p.id === id);

  if (!producto) {
    contenedor.innerHTML = `<p class="producto-loading">Producto no encontrado. <a href="tienda.html">Volver a la tienda</a></p>`;
    return;
  }

  // Actualizar el título de la pestaña
  document.title = `${producto.nombre} – Pipiluz`;

  // Precio formateado
  const precioTexto = producto.precio > 0
    ? `$${producto.precio.toLocaleString("es-AR")}`
    : "Consultá el precio";

  // Construir HTML del detalle
  contenedor.innerHTML = `
    <div class="producto-detalle">

      <!-- COLUMNA IZQUIERDA: imágenes -->
      <div class="detalle-fotos">
        <div class="detalle-carousel product-carousel" data-id="${producto.id}">
          <button class="carousel-btn carousel-btn--prev" aria-label="Foto anterior">‹</button>
          <img class="carousel-img detalle-img-principal"
               src="${producto.imagenes?.[0] || 'img/productos/placeholder.webp'}"
               alt="${producto.nombre}">
          <button class="carousel-btn carousel-btn--next" aria-label="Foto siguiente">›</button>
          <div class="carousel-dots"></div>
        </div>

        <!-- Miniaturas -->
        <div class="detalle-thumbnails" id="detalleThumbs"></div>
      </div>

      <!-- COLUMNA DERECHA: info -->
      <div class="detalle-info">
        <span class="detalle-categoria">${producto.categoria}</span>
        <h1 class="detalle-nombre">${producto.nombre}</h1>
        <p class="detalle-precio">${precioTexto}</p>
        <p class="detalle-descripcion">${producto.descripcion}</p>

        <!-- Selector de talle -->
        <div>
          <span class="detalle-label">Elegí el talle:</span>
          <div class="talles-grid" id="tallesGrid"></div>
        </div>

        <!-- Acciones -->
        <div class="detalle-acciones">
          <button class="btn-wssp" id="btnWsspDetalle">
            💬 Pedir por WhatsApp
          </button>
          <button class="btn-carrito-detalle" id="btnCarritoDetalle">
            🛒 Agregar al carrito
          </button>
        </div>

        <p class="detalle-aviso">
          📦 Trabajamos por encargue. Una vez confirmado el pedido nos comunicamos para coordinar el pago y el envío.
        </p>
      </div>
    </div>
  `;

  // Activar carrusel grande
  if (Array.isArray(producto.imagenes) && producto.imagenes.length > 1) {
    initCarrusel(producto);
  }

  // Miniaturas clicables
  const thumbsContainer = document.getElementById("detalleThumbs");
  const imgPrincipal = contenedor.querySelector(".detalle-img-principal");

  if (Array.isArray(producto.imagenes)) {
    producto.imagenes.forEach((src, i) => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = `${producto.nombre} foto ${i + 1}`;
      img.className = "detalle-thumb" + (i === 0 ? " active" : "");
      img.addEventListener("click", () => {
        imgPrincipal.src = src;
        thumbsContainer.querySelectorAll(".detalle-thumb").forEach(t => t.classList.remove("active"));
        img.classList.add("active");
      });
      thumbsContainer.appendChild(img);
    });
  }

  // Selector de talles
  const tallesGrid = document.getElementById("tallesGrid");
  let talleSeleccionado = null;

  if (Array.isArray(producto.talles)) {
    producto.talles.forEach(t => {
      const btn = document.createElement("button");
      btn.className = "talle-btn";
      btn.innerHTML = `${t.talle}<span>${t.detalle}</span>`;
      btn.addEventListener("click", () => {
        tallesGrid.querySelectorAll(".talle-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        talleSeleccionado = t;
      });
      tallesGrid.appendChild(btn);
    });
  }

  // Botón WhatsApp con detalle del pedido
  document.getElementById("btnWsspDetalle").addEventListener("click", () => {
    if (!talleSeleccionado) {
      mostrarToast("⚠️ Por favor elegí un talle antes de pedir.");
      return;
    }
    const msg = encodeURIComponent(
      `Hola! Quiero encargar:\n- ${producto.nombre}\n- Talle: ${talleSeleccionado.talle} (${talleSeleccionado.detalle})\n${producto.precio > 0 ? `- Precio: $${producto.precio.toLocaleString("es-AR")}` : ""}`
    );
    window.open(`https://wa.me/5491165948438?text=${msg}`, "_blank");
  });

  // Botón agregar al carrito
  document.getElementById("btnCarritoDetalle").addEventListener("click", () => {
    if (!talleSeleccionado) {
      mostrarToast("⚠️ Por favor elegí un talle antes de agregar.");
      return;
    }
    const itemCarrito = {
      ...producto,
      talleSeleccionado: talleSeleccionado.talle,
      talleDetalle: talleSeleccionado.detalle,
      qty: 1
    };
    const existente = carrito.find(i => i.id === producto.id && i.talleSeleccionado === talleSeleccionado.talle);
    if (existente) {
      existente.qty++;
    } else {
      carrito.push(itemCarrito);
    }
    guardarCarrito();
    mostrarToast(`✅ ${producto.nombre} (${talleSeleccionado.talle}) agregado al carrito 🛒`);
  });
  
}
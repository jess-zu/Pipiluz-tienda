/* =============================================
   PIPILUZ – main.js
   ============================================= */

// ----- Datos de productos de ejemplo -----
const productos = [
  { id: 1, nombre: "Remera Arcoíris",    precio: 4500,  emoji: "👕", cat: "ninos"   },
  { id: 2, nombre: "Pantalón Cargo",     precio: 8900,  emoji: "👖", cat: "ninos"   },
  { id: 3, nombre: "Buzo Canguro",       precio: 12500, emoji: "🧥", cat: "mayores" },
  { id: 4, nombre: "Conjunto Bebé",      precio: 6800,  emoji: "🍼", cat: "bebes"   },
  { id: 5, nombre: "Campera Liviana",    precio: 15900, emoji: "🧤", cat: "mayores" },
  { id: 6, nombre: "Vestido Lunares",    precio: 7200,  emoji: "👗", cat: "ninos"   },
  { id: 7, nombre: "Mochila Estrella",   precio: 5500,  emoji: "🎒", cat: "accesorios" },
  { id: 8, nombre: "Gorra Aventurero",   precio: 2900,  emoji: "🧢", cat: "accesorios" },
];

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

// ----- Renderizar productos destacados -----
function renderProductos(lista, contenedor, limite = 4) {
  if (!contenedor) return;
  contenedor.innerHTML = "";
  lista.slice(0, limite).forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-card__img">${p.emoji}</div>
      <div class="product-card__body">
        <p class="product-card__name">${p.nombre}</p>
        <p class="product-card__price">$${p.precio.toLocaleString("es-AR")}</p>
        <button class="product-card__btn" data-id="${p.id}">Agregar al carrito</button>
      </div>
    `;
    card.querySelector("button").addEventListener("click", () => agregarAlCarrito(p.id));
    contenedor.appendChild(card);
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

// ----- Init -----
document.addEventListener("DOMContentLoaded", () => {
  actualizarBadge();
  initHamburger();
  marcarActivo();

  // Productos destacados en index
  const grid = document.getElementById("featuredProducts");
  if (grid) renderProductos(productos, grid, 4);

  // Todos los productos en tienda
  const gridTienda = document.getElementById("allProducts");
  if (gridTienda) renderProductos(productos, gridTienda, productos.length);

  initScrollReveal();
});
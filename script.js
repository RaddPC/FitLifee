// Registro simple de clics en enlaces
document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        console.log('Cliente interesado');
    });
});

// Número de WhatsApp del negocio
const NUMERO_WHATSAPP = '573332420240';

// Carrito de compras (persistido en el navegador del cliente)
let carrito = JSON.parse(localStorage.getItem('yeseo_carrito')) || [];

// Formatea un número como pesos colombianos (ej: 45000 -> $45.000 COP)
function formatearPrecio(valor) {
    const numero = Number(valor);
    return '$' + numero.toLocaleString('es-CO') + ' COP';
}

// Guarda el carrito en el navegador y refresca toda la interfaz
function guardarCarrito() {
    localStorage.setItem('yeseo_carrito', JSON.stringify(carrito));
    renderizarTodo();
}

// Agrega un producto al carrito (o suma 1 si ya estaba agregado)
function agregarAlCarrito(boton) {
    const card = boton.closest('.card');

    const id = card.dataset.id;
    const nombre = card.dataset.nombre;
    const precio = Number(card.dataset.precio);
    const imagen = card.dataset.imagen;

    const existente = carrito.find(item => item.id === id);

    if (existente) {
        existente.cantidad += 1;
    } else {
        carrito.push({ id, nombre, precio, imagen, cantidad: 1 });
}
// Meta Pixel: registrar evento AddToCart
    if (typeof fbq === 'function') {
        fbq('track', 'AddToCart', {
            content_name: nombre,
            content_ids: [id],
            value: precio,
            currency: 'COP'
        });
    }
    guardarCarrito();

    // Pequeña confirmación visual en el botón
    const textoOriginal = boton.innerHTML;
    boton.innerHTML = '<i class="fas fa-check"></i> Agregado';
    setTimeout(() => { boton.innerHTML = textoOriginal; }, 1200);
}

// Cambia la cantidad de un producto en el carrito (+1 / -1)
function cambiarCantidad(id, delta) {
    const item = carrito.find(p => p.id === id);
    if (!item) return;

    item.cantidad += delta;

    if (item.cantidad <= 0) {
        carrito = carrito.filter(p => p.id !== id);
    }

    guardarCarrito();
}

// Elimina un producto del carrito
function quitarDelCarrito(id) {
    carrito = carrito.filter(p => p.id !== id);
    guardarCarrito();
}

// Calcula el total del carrito
function calcularTotal() {
    return carrito.reduce((suma, item) => suma + (item.precio * item.cantidad), 0);
}

// Construye el mensaje de WhatsApp con el detalle del pedido
function construirMensajeWhatsapp() {
    if (carrito.length === 0) return '';

    let mensaje = 'Hola, quiero hacer el siguiente pedido:%0A%0A';

    carrito.forEach(item => {
        mensaje += `• ${item.nombre} x${item.cantidad} - ${formatearPrecio(item.precio * item.cantidad)}%0A`;
    });

    mensaje += `%0ATotal: ${formatearPrecio(calcularTotal())}`;

    return mensaje;
}

// Renderiza el contador del ícono del carrito en la barra superior
function renderizarContador() {
    const totalItems = carrito.reduce((suma, item) => suma + item.cantidad, 0);
    const contador = document.getElementById('carritoContador');
    if (contador) contador.textContent = totalItems;
}

// Renderiza el panel lateral del carrito
function renderizarPanelCarrito() {
    const contenedor = document.getElementById('carritoItems');
    const vacioMsg = document.getElementById('carritoVacioMsg');
    const footer = document.getElementById('carritoFooter');
    const totalEl = document.getElementById('carritoTotal');

    if (!contenedor) return;

    if (carrito.length === 0) {
        contenedor.innerHTML = '';
        vacioMsg.style.display = 'flex';
        footer.style.display = 'none';
        return;
    }

    vacioMsg.style.display = 'none';
    footer.style.display = 'block';

    contenedor.innerHTML = carrito.map(item => `
        <div class="checkout-item">
            <img src="${item.imagen}" alt="${item.nombre}">
            <div class="checkout-item-info">
                <h4>${item.nombre}</h4>
                <span>${formatearPrecio(item.precio)} x ${item.cantidad}</span>
            </div>
        </div>
    `).join('');

    totalEl.textContent = formatearPrecio(calcularTotal());
}

// Renderiza la sección de checkout (con controles de cantidad)
function renderizarCheckout() {
    const vacio = document.getElementById('checkoutVacio');
    const lista = document.getElementById('checkoutLista');
    const resumen = document.getElementById('checkoutResumen');
    const totalEl = document.getElementById('checkoutTotal');
    const linkWhatsapp = document.getElementById('checkoutWhatsapp');

    if (!lista) return;

    if (carrito.length === 0) {
        vacio.style.display = 'block';
        lista.style.display = 'none';
        resumen.style.display = 'none';
        return;
    }

    vacio.style.display = 'none';
    lista.style.display = 'block';
    resumen.style.display = 'block';

    lista.innerHTML = carrito.map(item => `
        <div class="checkout-item">
            <img src="${item.imagen}" alt="${item.nombre}">
            <div class="checkout-item-info">
                <h4>${item.nombre}</h4>
                <span>${formatearPrecio(item.precio)}</span>
            </div>
            <div class="checkout-cantidad">
                <button onclick="cambiarCantidad('${item.id}', -1)">-</button>
                <span>${item.cantidad}</span>
                <button onclick="cambiarCantidad('${item.id}', 1)">+</button>
            </div>
            <button class="checkout-quitar" onclick="quitarDelCarrito('${item.id}')" aria-label="Quitar producto">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');

    totalEl.textContent = formatearPrecio(calcularTotal());
    linkWhatsapp.href = `https://wa.me/${NUMERO_WHATSAPP}?text=${construirMensajeWhatsapp()}`;
}

// Renderiza todas las vistas que dependen del carrito
function renderizarTodo() {
    renderizarContador();
    renderizarPanelCarrito();
    renderizarCheckout();
}

// Abre / cierra el panel lateral del carrito
function abrirCarrito() {
    document.getElementById('carritoOverlay').classList.add('activo');
    document.body.style.overflow = 'hidden';

    // Meta Pixel: registrar evento InitiateCheckout
    if (typeof fbq === 'function' && carrito.length > 0) {
        fbq('track', 'InitiateCheckout', {
            value: calcularTotal(),
            currency: 'COP',
            num_items: carrito.reduce((suma, item) => suma + item.cantidad, 0)
        });
    }
}

function cerrarCarrito() {
    document.getElementById('carritoOverlay').classList.remove('activo');
    document.body.style.overflow = '';
}

document.getElementById('carritoOverlay')?.addEventListener('click', (evento) => {
    if (evento.target.id === 'carritoOverlay') {
        cerrarCarrito();
    }
});

// ========================= //
// FAQ (ACORDEON)
// ========================= //
function toggleFaq(boton) {
    const item = boton.closest('.faq-item');
    const yaAbierto = item.classList.contains('abierto');

    document.querySelectorAll('.faq-item.abierto').forEach(el => el.classList.remove('abierto'));

    if (!yaAbierto) {
        item.classList.add('abierto');
    }
}

// ========================= //
// MODALES DE POLITICAS
// ========================= //
function abrirModalPolitica(tipo) {
    if (tipo === 'privacidad') {
        abrirModal('modalPrivacidad');
    } else if (tipo === 'envio') {
        abrirModal('modalEnvio');
    }
}

function abrirModal(idModal) {
    document.getElementById(idModal).classList.add('activo');
    document.body.style.overflow = 'hidden';
}

function cerrarModal(idModal) {
    document.getElementById(idModal).classList.remove('activo');
    document.body.style.overflow = '';
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (evento) => {
        if (evento.target === overlay) {
            cerrarModal(overlay.id);
        }
    });
});

document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.activo').forEach(modal => {
            cerrarModal(modal.id);
        });
        cerrarCarrito();
    }
});

// Renderizado inicial al cargar la página
document.addEventListener('DOMContentLoaded', renderizarTodo);

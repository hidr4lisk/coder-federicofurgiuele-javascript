import { items } from './items.js'

let jugador = null
let carrito = obtenerDelStorage("carrito") || []

async function cargarStats() {
    let stats = obtenerDelStorage("stats")
    
    if (stats) {
        jugador = stats
        jugador.diamantes = 10000
        return jugador
    }
    
    try {
        const response = await fetch('jugador.json')
        if (!response.ok) {
            throw new Error('Failed to fetch player stats')
        }
        
        jugador = await response.json()
        jugador.diamantes = 10000
        
        localStorage.setItem("stats", JSON.stringify(jugador))
        
        return jugador
    } catch (error) {
        console.error('Error loading player stats:', error)
        
        jugador = {
            vida: 100,
            daño: 10,
            critico: 5,
            esquiva: 5,
            bloqueo: 5,
            armadura: 10,
            diamantes: 10000
        }
        
        return jugador
    }
}

function guardarEnStorage(clave, valor) {
    localStorage.setItem(clave, JSON.stringify(valor))
}

function obtenerDelStorage(clave) {
    const valorJson = localStorage.getItem(clave)
    return valorJson ? JSON.parse(valorJson) : null
}

function mostrarToastExito(mensaje) {
    Toastify({
        text: mensaje,
        duration: 3000,
        close: true,
        gravity: "top", 
        position: "center", 
        backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)"
    }).showToast()
}

function mostrarToastError(mensaje) {
    Toastify({
        text: mensaje,
        duration: 3000,
        close: true,
        gravity: "top", 
        position: "center", 
        backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)"
    }).showToast()
}

function actualizarCantidadCarrito() {
    const cantidadCarrito = document.getElementById("btn-carrito")
    const cantidadTotal = carrito.length > 0
        ? carrito.reduce((total, producto) => total + producto.cantidad, 0)
        : 0
    cantidadCarrito.textContent = cantidadTotal === 0 ? "Carrito" : `Carrito(${cantidadTotal})`
}

function renderizarTienda(filtrar = '') {
    const lienzo = document.getElementById("lienzo")
    lienzo.innerHTML = ''
    lienzo.className = 'modo-tienda'

    const productosAMostrar = filtrar
        ? items.filter(producto => producto.nombre.toLowerCase().includes(filtrar.toLowerCase()) ||
          producto.categoria.toLowerCase().includes(filtrar.toLowerCase()))
        : items

    if (productosAMostrar.length === 0) {
        lienzo.innerHTML = "<p>No se encontraron productos en la tienda.</p>"
        return
    }

    productosAMostrar.forEach(producto => {
        const divProducto = document.createElement("div")
        divProducto.classList.add("producto")

        divProducto.innerHTML = `
            <img class="producto-imagen" src="${producto.imagen}" alt="${producto.nombre}">
            <h3>${producto.nombre} +${producto.mejora}</h3>
            <p>${producto.categoria}</p>
            <p>💎${producto.precio}</p>
            <button class="btn-agregar click-shrink">Agregar al Carrito</button>
        `
        const botonAgregar = divProducto.querySelector(".btn-agregar")
        botonAgregar.addEventListener("click", () => agregarAlCarrito(producto.id))

        lienzo.appendChild(divProducto)
    })
}

function agregarAlCarrito(idProducto) {
    const producto = items.find(p => p.id === idProducto)
    if (!producto) {
        mostrarToastError("Producto no encontrado")
        return
    }

    const productoExistente = carrito.find(item => item.id === idProducto)
    if (productoExistente) {
        productoExistente.cantidad++
    } else {
        carrito.push({ ...producto, cantidad: 1 })
    }
    guardarEnStorage("carrito", carrito)
    actualizarCantidadCarrito()
    renderizarBotonComprar()
}

function mostrarCarrito(filtrar = '') {
    const lienzo = document.getElementById("lienzo")
    lienzo.innerHTML = ''
    lienzo.className = 'modo-carrito'

    const productosAMostrar = filtrar
        ? carrito.filter(producto => producto.nombre.toLowerCase().includes(filtrar.toLowerCase()) ||
          producto.categoria.toLowerCase().includes(filtrar.toLowerCase()))
        : carrito

    if (productosAMostrar.length === 0) {
        lienzo.innerHTML = filtrar
            ? "<p>No se encontraron productos en el carrito.</p>"
            : "<p>El carrito está vacío.</p>"
        actualizarCantidadCarrito()
        renderizarBotonComprar()
        return
    }

    productosAMostrar.forEach(producto => {
        const divProducto = document.createElement("div")
        divProducto.classList.add("producto")

        divProducto.innerHTML = `
            <img class="producto-imagen" src="${producto.imagen}" alt="${producto.nombre}">
            <h3>${producto.nombre} +${producto.mejora}</h3>
            <p>${producto.categoria}</p>
            <p>💎${producto.precio}</p>
            <p>Cantidad en Carrito: ${producto.cantidad}</p>
            <div class="botones">
                <button class="btn-agregar click-shrink">+</button>
                <button class="btn-eliminar click-shrink">-</button>
                <button class="btn-eliminar-todos click-shrink">Eliminar</button>
            </div>
        `

        const botonAgregar = divProducto.querySelector(".btn-agregar")
        const botonEliminar = divProducto.querySelector(".btn-eliminar")
        const botonEliminarTodos = divProducto.querySelector(".btn-eliminar-todos")

        botonAgregar.addEventListener("click", () => {
            agregarAlCarrito(producto.id)
            mostrarCarrito()
        })

        botonEliminar.addEventListener("click", () => {
            eliminarDelCarrito(producto.id)
        })

        botonEliminarTodos.addEventListener("click", () => {
            eliminarProductoCompleto(producto.id)
        })

        lienzo.appendChild(divProducto)
    })

    actualizarCantidadCarrito()
}

function eliminarProductoCompleto(idProducto) {
    carrito = carrito.filter(item => item.id !== idProducto)
    guardarEnStorage("carrito", carrito)
    mostrarCarrito()
    renderizarBotonComprar()
}

function comprarCarrito() {
    if (carrito.length === 0) {
        mostrarToastError("El carrito está vacío. ¡Agregá productos primero!")
        return
    }

    const costoTotal = carrito.reduce((total, item) => total + item.precio * item.cantidad, 0)
    
    if (jugador.diamantes < costoTotal) {
        mostrarToastError("No tenés suficientes diamantes para realizar esta compra")
        return
    }

    jugador.diamantes -= costoTotal

    carrito.forEach(item => {
        if (jugador[item.atributo] !== undefined) {
            jugador[item.atributo] += item.mejora * item.cantidad
        }
    })

    carrito = []
    guardarEnStorage("carrito", carrito)
    guardarEnStorage("stats", jugador)

    renderizarStats()
    mostrarCarrito()
    renderizarBotonComprar()
    mostrarToastExito("¡Compra realizada con éxito!")
}

function renderizarBotonComprar() {
    const botonera = document.getElementById("botonera")
    let botonComprar = botonera.querySelector(".btn-comprar")
    
    if (carrito.length > 0) {
        const costoTotal = carrito.reduce((total, producto) => total + producto.cantidad * producto.precio, 0)

        if (!botonComprar) {
            botonComprar = document.createElement("button")
            botonComprar.classList.add("btn-comprar")
            botonComprar.addEventListener("click", comprarCarrito)
            botonera.appendChild(botonComprar)
        }

        botonComprar.textContent = `Comprar Carrito (💎${costoTotal})`
    } else if (botonComprar) {
        botonera.removeChild(botonComprar)
    }

    actualizarVisibilidadBusqueda()
}

function eliminarDelCarrito(idProducto) {
    const producto = carrito.find(item => item.id === idProducto)
    if (!producto) return

    producto.cantidad--
    if (producto.cantidad === 0) carrito = carrito.filter(item => item.id !== idProducto)

    guardarEnStorage("carrito", carrito)
    mostrarCarrito()
    renderizarBotonComprar()
}

function generarEnemigo() {
    return {
        nombre: "Enemigo",
        vida: Math.max(50, Math.floor(jugador.vida * (0.8 + Math.random() * 0.4))),
        daño: Math.max(5, Math.floor(jugador.daño * (0.8 + Math.random() * 0.4))),
        critico: Math.max(1, Math.floor(jugador.critico * (0.8 + Math.random() * 0.4))),
        esquiva: Math.max(1, Math.floor(jugador.esquiva * (0.8 + Math.random() * 0.4))),
        bloqueo: Math.max(1, Math.floor(jugador.bloqueo * (0.8 + Math.random() * 0.4))),
        armadura: Math.max(5, Math.floor(jugador.armadura * (0.8 + Math.random() * 0.4)))
    }
}

function crearTarjetaBatalla(entidad, esJugador = true) {
    const tarjeta = document.createElement('div')
    tarjeta.classList.add('tarjeta-batalla')
    
    tarjeta.style.backgroundColor = esJugador ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)'
    
    tarjeta.innerHTML = `
        <h2>${esJugador ? 'Jugador' : entidad.nombre}</h2>
        <div class="stats-batalla">
            <div class="stat">
                <span class="stat-nombre">Vida</span>
                <span class="stat-valor">${entidad.vida}</span>
            </div>
            <div class="stat">
                <span class="stat-nombre">Daño</span>
                <span class="stat-valor">${entidad.daño}</span>
            </div>
            <div class="stat">
                <span class="stat-nombre">Crítico</span>
                <span class="stat-valor">${entidad.critico}%</span>
            </div>
            <div class="stat">
                <span class="stat-nombre">Esquiva</span>
                <span class="stat-valor">${entidad.esquiva}%</span>
            </div>
            <div class="stat">
                <span class="stat-nombre">Bloqueo</span>
                <span class="stat-valor">${entidad.bloqueo}%</span>
            </div>
            <div class="stat">
                <span class="stat-nombre">Armadura</span>
                <span class="stat-valor">${entidad.armadura}</span>
            </div>
        </div>
    `
    
    return tarjeta
}

function mostrarBatalla() {
    const lienzo = document.getElementById("lienzo")
    lienzo.innerHTML = ''
    lienzo.className = 'modo-batalla'

    const enemigo = generarEnemigo()

    const contenedorBatalla = document.createElement('div')
    contenedorBatalla.classList.add('contenedor-batalla')

    const filaBatalla = document.createElement("div")
    filaBatalla.classList.add("fila-batalla")

    const tarjetaJugador = crearTarjetaBatalla(jugador)
    const tarjetaEnemigo = crearTarjetaBatalla(enemigo, false)

    const elementoVs = document.createElement('div')
    elementoVs.classList.add('elemento-vs')
    elementoVs.textContent = 'VS'

    filaBatalla.appendChild(tarjetaJugador)
    filaBatalla.appendChild(elementoVs)
    filaBatalla.appendChild(tarjetaEnemigo)

    const filaBoton = document.createElement("div")
    const botonBatalla = document.createElement('button')
    botonBatalla.textContent = 'Iniciar Batalla'
    botonBatalla.classList.add('btn-batalla')
    botonBatalla.addEventListener('click', () => iniciarBatalla(jugador, enemigo))
    filaBoton.appendChild(botonBatalla)

    contenedorBatalla.appendChild(filaBatalla)
    contenedorBatalla.appendChild(filaBoton)

    lienzo.appendChild(contenedorBatalla)
}

function iniciarBatalla(jugador, enemigo) {
    mostrarToastError('¡Batalla en construcción! Próximamente implementaremos la mecánica de combate.')
    console.log('Jugador:', jugador)
    console.log('Enemigo:', enemigo)
}

function renderizarStats() {
    const statsPlayer = document.getElementById("stats_player")
    statsPlayer.innerHTML = ''

    for (let attr in jugador) {
        if (jugador.hasOwnProperty(attr)) {
            const divStat = document.createElement("div")
            divStat.classList.add("stat")

            const atributoFormateado = attr.charAt(0).toUpperCase() + attr.slice(1)

            let colorNombre = 'black'

            const colores = {
                vida: 'green',
                daño: 'red',
                critico: 'orange',
                esquiva: 'gray',
                bloqueo: 'violet',
                armadura: 'purple',
                diamantes: 'cyan'
            }

            colorNombre = colores[attr] || 'black'

            divStat.innerHTML = `
                <p style="
                    color: ${colorNombre};
                    text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3), 0 0 5px ${colorNombre}; 
                    font-weight: bold; 
                    text-transform: uppercase; 
                    font-family: 'Arial', sans-serif;">
                    ${atributoFormateado}
                </p>
                <p style="color: white; font-weight: normal; font-family: 'Arial', sans-serif;">
                    ${jugador[attr]}
                </p>
            `
            statsPlayer.appendChild(divStat)
        }
    }
}

function actualizarVisibilidadBusqueda() {
    const modo = document.querySelector("[data-modo]").dataset.modo
    const inputBuscar = document.getElementById("inputBuscar")
    const botonComprar = document.querySelector(".btn-comprar")
    const statsPlayer = document.getElementById("stats_player")

    if (modo === "batalla") {
        inputBuscar.style.visibility = "hidden"
        inputBuscar.style.pointerEvents = "none"
        statsPlayer.style.visibility = "hidden"
        statsPlayer.style.pointerEvents = "none"
    } else {
        inputBuscar.style.visibility = "visible"
        inputBuscar.style.pointerEvents = "auto"
        statsPlayer.style.visibility = "visible"
        statsPlayer.style.pointerEvents = "auto"
    }

    if (botonComprar) {
        botonComprar.style.visibility = modo === "carrito" ? "visible" : "hidden"
        botonComprar.style.pointerEvents = modo === "carrito" ? "auto" : "none"
    }
}



function buscarProductos() {
    const termino = document.getElementById("inputBuscar").value
    const modo = document.querySelector("[data-modo]").dataset.modo

    if (termino === '') {
        modo === "tienda" ? renderizarTienda() : mostrarCarrito()
        return
    }

    modo === "tienda" ? renderizarTienda(termino) : mostrarCarrito(termino)
}

function configurarModo(modo) {
    document.querySelector("[data-modo]").dataset.modo = modo
    actualizarVisibilidadBusqueda()
    if (modo === "tienda") renderizarTienda()
    else if (modo === "carrito") mostrarCarrito()
    else if (modo === "batalla") mostrarBatalla()
}

document.getElementById("btn-tienda").addEventListener("click", () => configurarModo("tienda"))
document.getElementById("btn-carrito").addEventListener("click", () => configurarModo("carrito"))
document.getElementById("btn-batalla").addEventListener("click", () => configurarModo("batalla"))

document.getElementById("inputBuscar").addEventListener("input", buscarProductos)
document.getElementById("inputBuscar").addEventListener("keydown", (event) => {
    if (event.key === 'Enter') buscarProductos()
})

document.addEventListener("DOMContentLoaded", async () => {
    await cargarStats()
    document.querySelector("[data-modo]").dataset.modo = "batalla"
    actualizarVisibilidadBusqueda()
    renderizarStats()
    mostrarBatalla()
    actualizarCantidadCarrito()
    renderizarBotonComprar()
})
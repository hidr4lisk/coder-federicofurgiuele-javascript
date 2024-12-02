// Importar los productos desde los archivos correspondientes
import { items } from './items.js'
import { jugador } from './jugador.js'

// Variables iniciales
let carrito = obtenerDelStorage("carrito") || [] // Cargar carrito desde localStorage si existe
let stats = obtenerDelStorage("stats") || jugador // Cargar stats desde localStorage si existe
jugador.diamantes = 10000 // Carga los diamantes, cuando el juego este establecido arranca en 0
stats && Object.assign(jugador, stats)

// Funciones auxiliares

// Guardar datos en localStorage
function guardarEnStorage(clave, valor) {
  let valorJson = JSON.stringify(valor)
  localStorage.setItem(clave, valorJson)
}

// Obtener datos desde localStorage
function obtenerDelStorage(clave) {
  const valorJson = localStorage.getItem(clave)
  return valorJson ? JSON.parse(valorJson) : null
}

// Función para actualizar la cantidad en el botón del carrito
function actualizarCantidadCarrito() {
  const cantidadCarrito = document.getElementById("btn-carrito")
  const cantidadTotal = carrito.length > 0
    ? carrito.reduce((total, producto) => total + producto.cantidad, 0)
    : 0
  cantidadCarrito.textContent = cantidadTotal === 0 ? "Carrito" : `Carrito(${cantidadTotal})`
}

// Funciones principales --------------------------------//

// Renderizar la tienda
function renderizarTienda(filtrar = '') {
  const lienzo = document.getElementById("lienzo")
  lienzo.innerHTML = '' // Limpiar la tienda actual

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

// Agregar un producto al carrito
function agregarAlCarrito(idProducto) {
  const producto = items.find(p => p.id === idProducto)
  if (!producto) {
    alert("Producto no encontrado")
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
}

// Mostrar el carrito
function mostrarCarrito(filtrar = '') {
  const lienzo = document.getElementById("lienzo")
  lienzo.innerHTML = '' // Limpiar el lienzo

  const productosAMostrar = filtrar
    ? carrito.filter(producto => producto.nombre.toLowerCase().includes(filtrar.toLowerCase()) ||
      producto.categoria.toLowerCase().includes(filtrar.toLowerCase()))
    : carrito

  if (productosAMostrar.length === 0) {
    lienzo.innerHTML = filtrar
      ? "<p>No se encontraron productos en el carrito.</p>"
      : "<p>El carrito está vacío.</p>"
    actualizarCantidadCarrito()
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
      // Verificar si el carrito tiene productos
    if (carrito.length > 0) {
      // Crear el botón de comprar
      const botonComprar = document.createElement("button")
      botonComprar.textContent = "Comprar Carrito"
      botonComprar.classList.add("btn-comprar")

      // Agregar el evento al botón
      botonComprar.addEventListener("click", comprarCarrito)

      // Añadir el botón al lienzo
      lienzo.appendChild(botonComprar)
    }
}

function eliminarProductoCompleto(idProducto) {
  carrito = carrito.filter(item => item.id !== idProducto)
  guardarEnStorage("carrito", carrito)
  mostrarCarrito()
}
function comprarCarrito() {
  // Si el carrito está vacío, no tiene sentido intentar comprar
  if (carrito.length === 0) {
    alert("El carrito está vacío. ¡Agregá productos primero!")
    return
  }

  // Calcular el costo total de los items en el carrito
  const costoTotal = carrito.reduce((total, item) => total + item.precio, 0)
  
  // Verificar si el jugador tiene suficientes diamantes para la compra
  if (jugador.diamantes < costoTotal) {
    alert("No tenés suficientes diamantes para realizar esta compra")
    return
  }

  // Restar los diamantes del costo total al jugador
  jugador.diamantes -= costoTotal

  // Aplicar las mejoras al jugador por cada item en el carrito
  carrito.forEach(item => {
    if (jugador[item.atributo] !== undefined) {
      jugador[item.atributo] += item.mejora*item.cantidad
    }
  })

  // Vaciar el carrito después de completar la compra
  carrito = []
  guardarEnStorage("carrito", carrito)
  guardarEnStorage("stats", jugador)

  // Actualizar las estadísticas del jugador y mostrar el carrito vacío
  renderizarStats()
  mostrarCarrito()
  alert("¡Compra realizada con éxito!")
}




// Eliminar productos o reducir cantidades en el carrito
function eliminarDelCarrito(idProducto) {
  const producto = carrito.find(item => item.id === idProducto)
  if (!producto) return

  producto.cantidad--
  if (producto.cantidad === 0) carrito = carrito.filter(item => item.id !== idProducto)

  guardarEnStorage("carrito", carrito)
  mostrarCarrito()
}

// Mostrar la interfaz de batalla
function mostrarBatalla() {
  const lienzo = document.getElementById("lienzo")
  lienzo.innerHTML = '<p>SECCION EN CONSTRUCCIÓN</p>'
}

function renderizarStats() {
  const statsPlayer = document.getElementById("stats_player")
  statsPlayer.innerHTML = '' // Limpiar los stats previos

  // Iterar sobre todas las propiedades del objeto "jugador"
  for (let attr in jugador) {
    if (jugador.hasOwnProperty(attr)) {
      const divStat = document.createElement("div")
      divStat.classList.add("stat")

      // Capitalizar la primera letra del atributo para una mejor presentación
      const atributoFormateado = attr.charAt(0).toUpperCase() + attr.slice(1)

      // Definir el color dependiendo del atributo
      let colorNombre = 'black' // Valor por defecto para el nombre del atributo

      switch (attr) {
        case 'vida':
          colorNombre = 'green' // "vida"
          break
        case 'daño':
          colorNombre = 'red' // "daño"
          break
        case 'critico':
          colorNombre = 'orange' // "critico"
          break
        case 'esquiva':
          colorNombre = 'gray' // "esquiva"
          break
        case 'bloqueo':
          colorNombre = 'violet' // "bloqueo"
          break
        case 'armadura':
          colorNombre = 'purple' // "armadura"
          break
        case 'diamantes':
          colorNombre = 'cyan' // "diamantes"
          break
        default:
          colorNombre = 'black' // Si no tiene un color asignado, negro por defecto
      }

      // Crear el HTML para el atributo con el color en el nombre y blanco en el valor
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




// Actualizar la visibilidad de la barra de búsqueda
function actualizarVisibilidadBusqueda() {
  const modo = document.querySelector("[data-modo]").dataset.modo
  const inputBuscar = document.getElementById("inputBuscar")

  if (modo === "batalla") {
    inputBuscar.style.visibility = "hidden"
    inputBuscar.style.pointerEvents = "none"
  } else {
    inputBuscar.style.visibility = "visible"
    inputBuscar.style.pointerEvents = "auto"
  }
}

// Función de búsqueda global
function buscarProductos() {
  const termino = document.getElementById("inputBuscar").value
  const modo = document.querySelector("[data-modo]").dataset.modo

  if (termino === '') {
    modo === "tienda" ? renderizarTienda() : mostrarCarrito()
    return
  }

  modo === "tienda" ? renderizarTienda(termino) : mostrarCarrito(termino)
}

// Eventos ---------------------------------------//

//Aca manejamos los cambios entre TIENDA / CARRITO / BATALLA



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


//Este es para buscar con el input
document.getElementById("inputBuscar").addEventListener("input", buscarProductos)

//Este es para buscar pero escribiendo
document.getElementById("inputBuscar").addEventListener("keydown", (event) => {
  if (event.key === 'Enter') buscarProductos()
})

// Inicialización ---------------------------------//

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("[data-modo]").dataset.modo = "batalla"
  actualizarVisibilidadBusqueda()
  renderizarStats()
  mostrarBatalla()
  actualizarCantidadCarrito()
})

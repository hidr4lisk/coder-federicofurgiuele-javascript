// Importar los productos desde los archivos correspondientes
import { items } from './items.js'

// Variable global para el jugador
let jugador = null

// Variables iniciales
let carrito = obtenerDelStorage("carrito") || [] // Cargar carrito desde localStorage si existe

// Async function to load player stats
async function cargarStats() {
  // First, try to load stats from localStorage
  let stats = obtenerDelStorage("stats");
  
  if (stats) {
      jugador = stats;
      jugador.diamantes = 10000; // Set diamonds as specified
      return jugador;
  }
  
  // If no stats in localStorage, fetch from JSON file
  try {
      const response = await fetch('jugador.json');
      if (!response.ok) {
          throw new Error('Failed to fetch player stats');
      }
      
      jugador = await response.json();
      jugador.diamantes = 10000; // Set diamonds as specified
      
      // Save to localStorage for future use
      localStorage.setItem("stats", JSON.stringify(jugador));
      
      return jugador;
  } catch (error) {
      console.error('Error loading player stats:', error);
      
      // Fallback to a default player object if fetch fails
      jugador = {
          vida: 100,
          daño: 10,
          critico: 5,
          esquiva: 5,
          bloqueo: 5,
          armadura: 10,
          diamantes: 10000
      };
      
      return jugador;
  }
}

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
  renderizarBotonComprar()
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
  // Si el carrito está vacío, no tiene sentido intentar comprar
  if (carrito.length === 0) {
    alert("El carrito está vacío. ¡Agregá productos primero!")
    return
  }

  // Calcular el costo total de los items en el carrito
  const costoTotal = carrito.reduce((total, item) => total + item.precio * item.cantidad, 0)
  
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
  renderizarBotonComprar()
  alert("¡Compra realizada con éxito!")
}

// Función para renderizar el botón de comprar carrito
function renderizarBotonComprar() {
  const botonera = document.getElementById("botonera")

  // Verificar si el botón "Comprar Carrito" ya existe
  let botonComprar = botonera.querySelector(".btn-comprar")
  
  if (carrito.length > 0) {
    // Calcular el costo total del carrito
    const costoTotal = carrito.reduce((total, producto) => total + producto.cantidad * producto.precio, 0)

    if (!botonComprar) {
      // Crear el botón si no existe
      botonComprar = document.createElement("button")
      botonComprar.classList.add("btn-comprar")
      botonComprar.addEventListener("click", comprarCarrito)
      botonera.appendChild(botonComprar)
    }

    // Actualizar el texto del botón
    botonComprar.textContent = `Comprar Carrito (💎${costoTotal})`
  } else if (botonComprar) {
    // Si el carrito está vacío, eliminar el botón "Comprar Carrito"
    botonera.removeChild(botonComprar)
  }

  actualizarVisibilidadBusqueda()
}




// Eliminar productos o reducir cantidades en el carrito
function eliminarDelCarrito(idProducto) {
  const producto = carrito.find(item => item.id === idProducto)
  if (!producto) return

  producto.cantidad--
  if (producto.cantidad === 0) carrito = carrito.filter(item => item.id !== idProducto)

  guardarEnStorage("carrito", carrito)
  mostrarCarrito()
  renderizarBotonComprar()
}

// Función para generar un enemigo aleatorio
function generarEnemigo() {
  // Crear un enemigo con stats similares pero ligeramente aleatorios
  return {
      nombre: "Enemigo",
      vida: Math.max(50, Math.floor(jugador.vida * (0.8 + Math.random() * 0.4))),
      daño: Math.max(5, Math.floor(jugador.daño * (0.8 + Math.random() * 0.4))),
      critico: Math.max(1, Math.floor(jugador.critico * (0.8 + Math.random() * 0.4))),
      esquiva: Math.max(1, Math.floor(jugador.esquiva * (0.8 + Math.random() * 0.4))),
      bloqueo: Math.max(1, Math.floor(jugador.bloqueo * (0.8 + Math.random() * 0.4))),
      armadura: Math.max(5, Math.floor(jugador.armadura * (0.8 + Math.random() * 0.4)))
  };
}

// Función para crear la tarjeta de batalla
function crearTarjetaBatalla(entidad, esJugador = true) {
  const tarjeta = document.createElement('div');
  tarjeta.classList.add('tarjeta-batalla');
  
  // Estilo condicional para jugador o enemigo
  tarjeta.style.backgroundColor = esJugador ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)';
  
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
  `;
  
  return tarjeta;
}

// Función para mostrar la batalla
function mostrarBatalla() {
  const lienzo = document.getElementById("lienzo");
  lienzo.innerHTML = ''; // Limpiar el lienzo

  // Generar un enemigo
  const enemigo = generarEnemigo();

  // Crear contenedor para las tarjetas
  const contenedorBatalla = document.createElement('div');
  contenedorBatalla.classList.add('contenedor-batalla');

  // Crear tarjetas para jugador y enemigo
  const tarjetaJugador = crearTarjetaBatalla(jugador);
  const tarjetaEnemigo = crearTarjetaBatalla(enemigo, false);

  // Crear elemento VS
  const elementoVs = document.createElement('div');
  elementoVs.classList.add('elemento-vs');
  elementoVs.textContent = 'VS';

  // Añadir elementos al contenedor
  contenedorBatalla.appendChild(tarjetaJugador);
  contenedorBatalla.appendChild(elementoVs);
  contenedorBatalla.appendChild(tarjetaEnemigo);

  // Añadir botón de iniciar batalla
  const botonBatalla = document.createElement('button');
  botonBatalla.textContent = 'Iniciar Batalla';
  botonBatalla.classList.add('btn-batalla');
  botonBatalla.addEventListener('click', () => iniciarBatalla(jugador, enemigo));

  // Añadir todo al lienzo
  lienzo.appendChild(contenedorBatalla);
  lienzo.appendChild(botonBatalla);
}

// Función básica de batalla (para expandir después)
function iniciarBatalla(jugador, enemigo) {
  alert('¡Batalla en construcción! Próximamente implementaremos la mecánica de combate.');
  console.log('Jugador:', jugador);
  console.log('Enemigo:', enemigo);
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




// Actualizar la visibilidad de la barra de búsqueda y el botón "Comprar Carrito"
function actualizarVisibilidadBusqueda() {
  const modo = document.querySelector("[data-modo]").dataset.modo
  const inputBuscar = document.getElementById("inputBuscar")
  const botonComprar = document.querySelector(".btn-comprar")

  // Controlar visibilidad del inputBuscar
  if (modo === "batalla") {
    inputBuscar.style.visibility = "hidden"
    inputBuscar.style.pointerEvents = "none"
  } else {
    inputBuscar.style.visibility = "visible"
    inputBuscar.style.pointerEvents = "auto"
  }

  // Controlar visibilidad del botón "Comprar Carrito"
  if (botonComprar) {
    if (modo === "carrito") {
      botonComprar.style.visibility = "visible"
      botonComprar.style.pointerEvents = "auto"
    } else {
      botonComprar.style.visibility = "hidden"
      botonComprar.style.pointerEvents = "none"
    }
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

document.addEventListener("DOMContentLoaded", async () => {
  await cargarStats();
  document.querySelector("[data-modo]").dataset.modo = "batalla"
  actualizarVisibilidadBusqueda()
  renderizarStats()
  mostrarBatalla()
  actualizarCantidadCarrito()
  renderizarBotonComprar()
})

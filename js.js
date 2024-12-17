function mostrarBatalla() {
    const lienzo = document.getElementById("lienzo")
    lienzo.innerHTML = ''

    const enemigo = generarEnemigo()
    const tarjetaJugador = crearTarjetaBatalla(jugador)
    tarjetaJugador.classList.add('tarjerta-jugador')
    const tarjetaEnemigo = crearTarjetaBatalla(enemigo, false)
    tarjetaEnemigo.classList.add('tarjeta-enemigo')

    const elementoVs = document.createElement('div')
    elementoVs.classList.add('elemento-vs')
    elementoVs.textContent = 'VS'
    
    const botonBatalla = document.createElement('button')
    botonBatalla.textContent = 'Iniciar Batalla'
    botonBatalla.classList.add('btn-batalla')
    botonBatalla.addEventListener('click', () => iniciarBatalla(jugador, enemigo))

    lienzo.appendChild(tarjetaJugador)
    lienzo.appendChild(elementoVs)
    lienzo.appendChild(tarjetaEnemigo)
    lienzo.appendChild(botonBatalla)
}

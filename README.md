# Mahjong Coop

Juego de Mahjong colaborativo en tiempo real desarrollado con React, Vite, TypeScript, Express y Socket.IO.

## Informacion academica

- Universidad: Universidad Nacional de Costa Rica
- Escuela: Informatica
- Curso: Programacion IV
- Cuatrimestre: 2026 - I
- Tipo de proyecto: Taller de desarrollo web en tiempo real

## Integrantes

- Greichel Campos Jiménez
- Massiel Valverde Mora
- Tamara Gamboa Acuña
- Darien Arroyo Castro
- Andrés Mora Mora

## Descripcion

Mahjong Coop es una aplicacion web multijugador en tiempo real donde varios jugadores comparten un mismo tablero y colaboran para encontrar parejas de fichas. El sistema sincroniza los movimientos, puntajes y cambios del tablero de forma inmediata entre todos los clientes conectados.

El proyecto fue construido bajo una arquitectura cliente-servidor y utiliza WebSockets para mantener una comunicacion bidireccional persistente entre frontend y backend.

## Objetivo del proyecto

El objetivo de esta aplicacion es demostrar el uso de tecnologias web modernas para construir una experiencia colaborativa en tiempo real, en la que multiples usuarios interactuan sobre un mismo estado compartido, con sincronizacion continua y control centralizado desde el servidor.

## Comunicacion en tiempo real

Este proyecto utiliza WebSockets mediante Socket.IO para mantener la conexion activa entre cliente y servidor sin necesidad de recargar la pagina.

Con este enfoque:

- El cliente y el servidor pueden enviar eventos en cualquier momento.
- Los cambios del tablero se reflejan en tiempo real.
- Los puntajes y estadisticas se actualizan para todos los jugadores al instante.
- La aplicacion puede manejar salas de juego y reconexion del cliente.

Socket.IO se utiliza para:

- Manejo de eventos en tiempo real.
- Sincronizacion del estado del juego.
- Comunicacion por salas.
- Reconexion automatica del cliente.

## Logica general del juego

El servidor actua como fuente de verdad del sistema. Cada accion de los jugadores se procesa en backend y luego se retransmite a todos los clientes de la sala.

### Flujo de juego

1. Un jugador crea una sala o se une a una existente mediante un codigo.
2. El anfitrion espera a que se complete el numero de jugadores definido para la sala.
3. El anfitrion inicia la partida.
4. Los jugadores seleccionan fichas visibles y validas.
5. Si dos fichas coinciden, se emparejan y se actualiza el puntaje.
6. El nuevo estado del juego se envia a todos los clientes en tiempo real.

### Estado de las fichas

Las fichas pueden presentarse visualmente como:

- Disponibles para seleccion.
- Bloqueadas segun la estructura del tablero Mahjong.
- Bloqueadas temporalmente por otro jugador.
- Emparejadas o retiradas del tablero.

## Arquitectura general

El sistema sigue una arquitectura cliente-servidor basada en eventos:

- El servidor mantiene el estado oficial de cada sala.
- Los clientes envian acciones mediante Socket.IO.
- El servidor valida y procesa los cambios.
- El nuevo estado se retransmite a todos los clientes conectados a la sala.
- El frontend renderiza tablero, ranking, resumen y grafica a partir del estado recibido.

## Flujo de comunicacion

1. El cliente se conecta al servidor.
2. El jugador crea una sala o envia un evento para unirse a una existente.
3. El servidor registra al jugador en la sala correspondiente.
4. Durante la partida, los clientes emiten eventos de seleccion, reinicio, mezcla o deshacer.
5. El servidor actualiza el estado del juego.
6. El servidor emite el nuevo estado con `game:state`.
7. Todos los clientes renderizan la actualizacion en tiempo real.

## Tecnologias

### Frontend

- React
- Vite
- TypeScript
- Socket.IO Client
- Recharts

### Backend

- Node.js
- Express
- Socket.IO
- TypeScript

## Caracteristicas principales

- Creacion y union a salas mediante codigo.
- Limite de jugadores por sala.
- Inicio de partida controlado por el anfitrion.
- Sincronizacion del tablero en tiempo real.
- Seleccion colaborativa de fichas.
- Bloqueo visual de fichas segun la logica de Mahjong.
- Ranking en vivo.
- Grafico de evolucion de puntajes.
- Controles funcionales para `Nuevo`, `Deshacer`, `Pista` y `Mezclar`.
- Reconexion del cliente con intento de reingreso automatico a la sala.
- Interfaz responsive para desktop y movil.
- Sonidos y pantalla de victoria.

## Estructura del proyecto

```text
Mahjong-Coop/
|-- README.md
`-- mahjong-coop/
    |-- client/
    |   |-- src/
    |   |   |-- components/
    |   |   |-- hooks/
    |   |   |-- lib/
    |   |   |-- App.tsx
    |   |   `-- App.css
    |   `-- package.json
    `-- server/
        |-- src/
        |   |-- game.ts
        |   |-- index.ts
        |   |-- socket.ts
        |   `-- types.ts
        `-- package.json
```

## Requisitos

- Node.js 18 o superior
- npm

## Instalacion

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd Mahjong-Coop
```

### 2. Instalar dependencias del cliente

```bash
cd mahjong-coop/client
npm install
```

### 3. Instalar dependencias del servidor

```bash
cd ../server
npm install
```

## Variables de entorno

### Frontend (`mahjong-coop/client`)

Crea un archivo `.env`:

```bash
VITE_SERVER_URL=http://localhost:3000
```

### Backend (`mahjong-coop/server`)

Crea un archivo `.env` o configura las variables del entorno:

```bash
CLIENT_URL=http://localhost:5173
PORT=3000
```

Si deseas permitir varios origenes en el backend:

```bash
CLIENT_URL=http://localhost:5173,https://tu-frontend.vercel.app
```

## Ejecucion en desarrollo

### Backend

Desde `mahjong-coop/server`:

```bash
npm run dev
```

Servidor disponible en `http://localhost:3000`.

### Frontend

Desde `mahjong-coop/client`:

```bash
npm run dev
```

Aplicacion disponible en `http://localhost:5173`.

## Scripts utiles

### Cliente

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

### Servidor

```bash
npm run dev
npm run build
npm run start
```

## Como jugar

1. Ingresa tu nombre.
2. Crea una sala o unete con un codigo.
3. Define el cupo maximo de jugadores al crear la sala.
4. Espera a que todos los jugadores entren.
5. El anfitrion inicia la partida.
6. Selecciona parejas de fichas iguales que esten disponibles.
7. Colabora con los demas jugadores para limpiar el tablero y mejorar el puntaje.

## Estado actual del proyecto

### Implementado

- Tablero centrado y escalado visualmente dentro de la mesa.
- Fichas bloqueadas y disponibles con estilos diferenciados.
- Salas con cupo maximo y control de anfitrion.
- Inicio real de partida desde lobby.
- Seleccion y bloqueo de fichas en tiempo real.
- Ranking en vivo.
- Grafico de evolucion de puntajes.
- Controles funcionales conectados a la logica del juego.
- Pista visual en cliente.
- Reinicio, mezcla y deshacer sincronizados.
- Reconexion del cliente con intento de restauracion de sesion.
- Sonidos y pantalla de victoria.

### Mejoras futuras

- Chat dentro de la sala.
- Mayor feedback visual en desbloqueo de fichas.
- Recuperacion mas avanzada del estado visual tras reconexion.
- Documentacion de despliegue final con URL publica.

## Despliegue

### Frontend en Vercel

- Importa el repositorio en Vercel.
- Selecciona `mahjong-coop/client` como `Root Directory`.
- Configura `VITE_SERVER_URL` con la URL publica del backend.

### Backend en Render o Railway

- Crea un servicio desde el repositorio.
- Selecciona `mahjong-coop/server` como `Root Directory`.
- Configura `CLIENT_URL` con la URL publica del frontend.
- La plataforma asigna `PORT` automaticamente.

### Ejemplo de variables en produccion

Frontend:

```bash
VITE_SERVER_URL=https://tu-backend.onrender.com
```

Backend:

```bash
CLIENT_URL=https://tu-frontend.vercel.app
```


## Conclusion

Mahjong Coop demuestra como una aplicacion web puede aprovechar WebSockets para construir una experiencia colaborativa moderna, en la que multiples usuarios interactuan simultaneamente sobre un mismo estado compartido. El proyecto integra frontend y backend tipados con TypeScript, sincronizacion en tiempo real, control de salas y una interfaz orientada a la cooperacion entre jugadores.

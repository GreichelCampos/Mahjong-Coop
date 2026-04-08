# Mahjong Coop

Juego de Mahjong colaborativo en tiempo real desarrollado con React, Vite, TypeScript, Express y Socket.IO.

## Descripción

Mahjong Coop es una aplicación multijugador donde varios jugadores comparten el mismo tablero y colaboran para encontrar parejas de fichas.  
El estado del juego se sincroniza en tiempo real entre clientes usando WebSockets.

## Tecnologías

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

## Características principales

- Creación y unión a salas
- Sincronización en tiempo real del tablero
- Selección colaborativa de fichas
- Bloqueo visual de fichas según lógica Mahjong
- Ranking en vivo
- Gráfico de evolución de puntajes
- Controles funcionales:
  - Nuevo
  - Deshacer
  - Pista
  - Mezclar
- Interfaz adaptada para desktop y móvil

## Estructura del proyecto

```bash
Mahjong-Coop/
├── README.md
└── mahjong-coop/
    ├── client/
    │   ├── src/
    │   │   ├── components/
    │   │   ├── hooks/
    │   │   ├── lib/
    │   │   ├── App.tsx
    │   │   └── App.css
    │   └── package.json
    └── server/
        ├── src/
        │   ├── game.ts
        │   ├── index.ts
        │   ├── socket.ts
        │   └── types.ts
        └── package.json
```

## Requisitos

- Node.js 18 o superior
- npm

## Instalación

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

## Ejecución en desarrollo

### Backend

Desde `mahjong-coop/server`:

```bash
npm run dev
```

Servidor disponible en:

```bash
http://localhost:3000
```

### Frontend

Desde `mahjong-coop/client`:

```bash
npm run dev
```

Aplicación disponible en:

```bash
http://localhost:5173
```

## Scripts útiles

### Cliente

```bash
npm run dev
npm run build
npm run preview
```

### Servidor

```bash
npm run dev
npm run build
npm run start
```

## Cómo jugar

1. Ingresa tu nombre.
2. Crea una sala o únete con un código.
3. Espera a entrar a la partida.
4. Selecciona parejas de fichas iguales.
5. Las fichas disponibles cambian según la lógica del tablero Mahjong.
6. Colabora con los demás jugadores para limpiar la mesa.

## Arquitectura general

- El servidor mantiene la fuente de verdad del juego.
- Cada acción del jugador se envía por Socket.IO.
- El servidor procesa el nuevo estado y lo retransmite a todos los clientes.
- El frontend renderiza tablero, ranking, resumen y gráfica usando el estado recibido.

## Estado actual del proyecto

Actualmente el proyecto incluye:

- tablero centrado y escalado visualmente
- fichas bloqueadas y disponibles con estilos diferenciados
- panel lateral con ranking y resumen
- controles conectados a la lógica del juego
- pista visual en cliente
- reinicio, mezcla y deshacer sincronizados
- gráfico de puntajes en tiempo real

## Posibles mejoras futuras

- efectos de sonido
- animaciones de victoria
- notificaciones visuales cuando una ficha se desbloquea
- despliegue en producción
- reconexión avanzada con restauración de sesión

## Integrantes

- Greichel Campos
- Massiel Valverde
- Tamara Gamboa
- Darien Arroyo
- Andres Mora


Deployment update
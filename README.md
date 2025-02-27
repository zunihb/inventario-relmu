# Sistema de Inventario y Limpieza Relmu

Sistema web para gestionar el inventario de artículos de aseo y registro de tareas de limpieza.

## Requisitos

- Node.js (v14 o superior)
- MongoDB (v4.4 o superior)

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/zunihb/inventario-relmu.git
cd inventario-relmu
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
- Crear un archivo `.env` en la carpeta `backend` con el siguiente contenido:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/relmu
```

## Ejecución

1. Iniciar MongoDB
- Asegúrate de que MongoDB esté corriendo en tu sistema
- Si usas MongoDB Atlas, actualiza la URL en el archivo `.env`

2. Iniciar el servidor backend:
```bash
npm run dev
```

3. Abrir el frontend:
- Navegar a la carpeta `frontend`
- Abrir `index.html` en un navegador web
- O usar un servidor web estático como `live-server`

## Estructura del Proyecto

```
├── backend/
│   ├── server.js
│   └── src/
│       ├── controllers/
│       ├── models/
│       └── routes/
└── frontend/
    ├── index.html
    ├── limpieza.html
    └── src/
        ├── css/
        └── js/
```

## Características

- Gestión de inventario de artículos de aseo
  - Agregar, editar y eliminar artículos
  - Control de stock
  - Historial de cambios
  - Alertas de stock agotado
  - Búsqueda y filtrado

- Registro de tareas de limpieza
  - Agregar y editar registros de limpieza
  - Notas y observaciones
  - Búsqueda por contenido

## API Endpoints

### Inventario

- `GET /api/inventario` - Obtener todos los artículos
- `POST /api/inventario` - Crear nuevo artículo
- `PUT /api/inventario/:id` - Actualizar artículo
- `DELETE /api/inventario/:id` - Eliminar artículo
- `GET /api/inventario/:id/history` - Obtener historial de un artículo

### Limpieza

- `GET /api/limpieza` - Obtener todos los registros
- `POST /api/limpieza` - Crear nuevo registro
- `PUT /api/limpieza/:id` - Actualizar registro
- `DELETE /api/limpieza/:id` - Eliminar registro
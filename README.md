# Agrocloud_Test_App

Aplicación para demostración y pruebas de integración/conectividad con el sistema de instancias AgroCloud.

## 🚀 Estructura del Proyecto

El proyecto está organizado en:
- `agrocloud-tester/client`: Aplicación frontend desarrollada con React + Vite + Tailwind CSS.
- `agrocloud-tester/server`: Backend en Node.js / Express para interactuar con la base de datos PostgreSQL de AgroCloud.

## 🛠️ Instalación y Ejecución Local

### Backend (Server)
```bash
cd agrocloud-tester/server
npm install
npm run dev
```

> **Nota:** Configura el archivo `.env` basado en `.env.example`.

### Frontend (Client)
```bash
cd agrocloud-tester/client
npm install
npm run dev
```
La aplicación cliente estará disponible en `http://localhost:5173`.

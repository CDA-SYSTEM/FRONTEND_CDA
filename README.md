# FRONTEND_CDA - Hito Web

Frontend base del sistema de recepcion e inspeccion del CDA Putumayo.

Este hito cubre solo web y deja el proyecto listo para continuar con Android en una segunda etapa.

## Objetivo del Hito 1

- Tener una base frontend funcional y modular para que el equipo inicie desarrollo.
- Validar flujo minimo: login, rutas protegidas y modulos iniciales.
- Dejar documentacion y scripts listos para publicar en GitHub.

## Stack Tecnico

- React 18 + TypeScript
- Vite 5
- React Router DOM
- Zustand (estado de autenticacion)
- TanStack Query (estado de servidor)
- React Hook Form + Zod (formularios y validaciones)
- Axios (cliente HTTP con interceptores)
- ESLint + Prettier
- Vitest

## Prerrequisitos

- Node.js 20.19+ o 22.12+
- npm 10+

Nota: en este entorno se detecto Node 22.11, por lo que se fijo Vite 5 para mantener compatibilidad del hito web.

## Instalacion

```bash
npm install
```

## Variables de Entorno

Crear archivo `.env` con base en `.env.example`.

Ejemplo:

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Frontend CDA Putumayo
```

## Scripts Disponibles

- `npm run dev`: inicia servidor local
- `npm run build`: compila para produccion
- `npm run preview`: sirve build local
- `npm run lint`: ejecuta lint
- `npm run test`: ejecuta pruebas unitarias
- `npm run test:watch`: pruebas en modo watch
- `npm run cap:sync`: build web + sincronizacion de plataformas Capacitor
- `npm run android:sync`: build web + sincronizacion solo Android
- `npm run android:open`: abrir proyecto Android en Android Studio

## Estructura de Carpetas

```text
src/
  core/
    api/          # cliente axios
    router/       # rutas de la app
  modules/
    auth/         # login, guard, store, schema
    dashboard/    # vista principal
    recepcion/    # formulario base cliente/vehiculo
    inspeccion/   # checklist base NTC 5375
    facturacion/  # cola base de facturacion
  shared/
    layout/       # layout principal
  test/           # setup de pruebas
```

## Flujo Web Minimo

1. Abrir `/login`.
2. Ingresar correo y contrasena validos (demo local).
3. Acceder a dashboard y navegar modulos.
4. Probar cierre de sesion y redireccion al login.

## Checklist de Validacion Antes de GitHub

1. Ejecutar `npm run dev` y revisar vistas en desktop y viewport movil.
2. Ejecutar `npm run lint` sin errores.
3. Ejecutar `npm run test` sin fallas.
4. Ejecutar `npm run build` sin errores.
5. Verificar flujo: login, rutas protegidas, logout y modulos base.

## Troubleshooting

- Error de version Node con Vite:
  - Verifica version con `node -v`.
  - Usa Node 20.19+ o 22.12+ para Vite mas reciente.
- Si falla `npm install` por dependencias opcionales:
  - Borra `node_modules` y `package-lock.json`.
  - Ejecuta `npm install` nuevamente.

## Hito Android Completado

Capacitor ya fue integrado y la plataforma Android ya fue creada en la carpeta android.

Archivos Android base generados:

- android/
- capacitor.config.ts

### Flujo Android (desde este repositorio)

1. Compilar y sincronizar Android:

```bash
npm run android:sync
```

2. Abrir proyecto nativo:

```bash
npm run android:open
```

3. En Android Studio:

- Esperar sincronizacion de Gradle.
- Seleccionar emulador o dispositivo.
- Ejecutar app en modo debug.

### Nota importante de backend para emulador

Si el backend corre en tu maquina local y pruebas en emulador Android, no uses localhost en el frontend.
Usa esta URL en tu archivo .env:

```env
VITE_API_URL=http://10.0.2.2:3000/api
```

### Build APK (Android Studio)

- Menu Build > Build Bundle(s)/APK(s) > Build APK(s)
- APK debug se genera en android/app/build/outputs/apk/debug/

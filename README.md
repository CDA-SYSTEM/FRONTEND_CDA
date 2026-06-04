# FRONTEND_CDA — CDA del Putumayo

Frontend del sistema de gestión del Centro de Diagnóstico Automotor del Putumayo.
Construido con React 18 + TypeScript, arquitectura **Híbrida Modular + Clean Architecture**.

---

## Stack Técnico

| Herramienta | Uso |
|---|---|
| React 18 + TypeScript | UI y tipado estático |
| Vite 5 | Bundler y servidor de desarrollo |
| React Router DOM v7 | Enrutamiento |
| Zustand | Estado global de autenticación |
| TanStack Query | Estado de servidor (cache, refetch) |
| React Hook Form + Zod | Formularios y validaciones |
| Axios | Cliente HTTP con interceptores de token y API Key |
| Capacitor 8 | Empaquetado Android |
| ESLint + Prettier | Linting y formato |
| Vitest | Pruebas unitarias |

---

## Prerrequisitos

- Node.js **20.19+** o **22.12+**
- npm 10+

> Si tienes Node 22.11, usa Vite 5 (ya configurado en este proyecto).

---

## Instalación

```bash
npm install
```

---

## Variables de Entorno

Crea el archivo `.env` con base en `.env.example`:

```env
VITE_API_URL=http://localhost:3000
VITE_API_KEY_FRONT=tu_api_key_aqui
VITE_APP_NAME=CDA Putumayo
```

> Para emulador Android usa `VITE_API_URL=http://10.0.2.2:3000`
> Para un dispositivo físico usa la IP LAN o el dominio real del backend.

---

## Scripts Disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación para producción |
| `npm run preview` | Sirve el build local |
| `npm run lint` | Ejecuta ESLint |
| `npm run test` | Pruebas unitarias (una vez) |
| `npm run test:watch` | Pruebas en modo watch |
| `npm run cap:sync` | Build + sync Capacitor (todas las plataformas) |
| `npm run android:sync` | Build + sync solo Android |
| `npm run android:open` | Abre el proyecto en Android Studio |

---

## Arquitectura Híbrida Modular + Clean

El proyecto combina **arquitectura modular** (cada dominio de negocio es independiente) con los principios de **Clean Architecture** aplicados *dentro* de cada módulo.

### Capas globales (`src/`)

```
src/
├── core/                        # Infraestructura transversal
│   ├── api/                     # Cliente Axios (interceptores de token y API Key)
│   ├── router/                  # React Router — rutas y guard de sesión
│   └── store/                   # Estado global (authStore con Zustand)
│
├── modules/                     # Módulos de dominio (uno por área de negocio)
│   └── <modulo>/
│       ├── domain/              # Tipos TS y esquemas Zod (reglas puras, sin React)
│       ├── hooks/               # Casos de uso: custom hooks que orquestan servicios
│       ├── services/            # Adaptadores HTTP: llaman a core/api/apiClient
│       ├── components/          # Componentes UI reutilizables del módulo
│       └── pages/               # Vistas completas (solo JSX, sin lógica de negocio)
│
└── shared/                      # Piezas compartidas entre módulos
    ├── layout/                  # AppLayout: topbar, navegación, modal de logout
    ├── components/              # Componentes UI globales reutilizables
    └── hooks/                   # Hooks globales reutilizables
```

### Capas internas de cada módulo

| Capa | Carpeta | Qué contiene | Puede importar de |
|---|---|---|---|
| **Dominio** | `domain/` | Interfaces, tipos, schemas Zod | Nada externo (TypeScript puro) |
| **Aplicación** | `hooks/` | Custom hooks con lógica y estado | `domain/` + `services/` |
| **Adaptadores** | `services/` | Llamadas HTTP al backend | `core/api/` + `domain/` |
| **Presentación** | `components/` + `pages/` | JSX puro, sin lógica | `hooks/` + `domain/` |

### Módulos actuales

| Módulo | Descripción | Backend destino |
|---|---|---|
| `auth` | Login, guard de sesión, store global | `/auth/*` |
| `recepcion` | Registro de clientes y vehículos | PostgreSQL |
| `inspeccion` | Checklist NTC 5375 | Cassandra |
| `facturacion` | Cola y emisión de facturas | Tiempo real |
| `dashboard` | Panel de resumen | Agregado |
| `usuarios` | Gestión de usuarios y roles (solo ADMIN) | `/auth/users/*` |

### Flujo de datos típico

```
Page (JSX)
  └── useXxx() hook     ← caso de uso, maneja estado
        └── xxxService  ← adaptador HTTP
              └── apiClient (Axios + token + API Key)
                    └── Backend REST
```

---

## Flujo Web Mínimo

1. Abrir `/login` e ingresar credenciales.
2. El sistema redirige según rol: `ADMIN → /dashboard`, `RECEPCIONISTA → /recepcion`, etc.
3. Navegar los módulos habilitados para el rol.
4. Cerrar sesión desde el topbar.

### Roles del sistema

| Rol | Ruta inicial | Módulos accesibles |
|---|---|---|
| `ADMIN` | `/dashboard` | Todos + Usuarios |
| `RECEPCIONISTA` | `/recepcion` | Recepción, Inspección, Facturación |
| `INSPECTOR` | `/inspeccion` | Inspección |
| `FACTURADOR` | `/facturacion` | Facturación |

---

## Pruebas

```bash
npm run test
```

Pruebas unitarias cubiertas:

| Archivo | Qué prueba |
|---|---|
| `core/store/authStore.test.ts` | Login demo, logout, persistencia en localStorage |
| `modules/auth/domain/auth.schema.test.ts` | Validación del schema Zod de login |
| `modules/auth/components/guard.test.ts` | Lógica pura del guard de sesión |

---

## Android (Capacitor)

### Sincronizar y abrir

```bash
npm run android:sync   # build web + sync
npm run android:open   # abre Android Studio
```

### Generar APK debug

En Android Studio: `Build > Build Bundle(s)/APK(s) > Build APK(s)`

El APK queda en: `android/app/build/outputs/apk/debug/`

---

## Checklist antes de hacer push

- [ ] `npm run dev` — sin errores en consola
- [ ] `npm run lint` — sin advertencias ni errores
- [ ] `npm run test` — todos los tests pasan
- [ ] `npm run build` — compilación exitosa

---

## Troubleshooting

**Error de versión de Node con Vite**
Verifica con `node -v`. Usa Node 20.19+ o 22.12+.

**Falla `npm install` por dependencias opcionales**
Borra `node_modules` y `package-lock.json`, luego ejecuta `npm install` nuevamente.

**El emulador Android no conecta al backend local**
Usa `VITE_API_URL=http://10.0.2.2:3000/api` en el `.env`.

**El token no se envía en las peticiones**
Verifica que `VITE_API_KEY_FRONT` esté definido en el `.env`.

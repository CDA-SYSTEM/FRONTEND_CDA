# FRONTEND_CDA — Sistema de Gestión CDA del Putumayo

Frontend híbrido responsivo para la administración, recepción, facturación y trazabilidad de inspecciones del **Centro de Diagnóstico Automotor (CDA) del Putumayo**. 

Construido utilizando **React 18 + TypeScript**, orquestado bajo una arquitectura **Híbrida Modular** inspirada en los principios de **Clean Architecture**, y empaquetado para plataformas **Web y Android** mediante **Capacitor 8**.

---

## 🚀 Stack Técnico Principal

| Componente | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Core UI** | React 18 + TypeScript | Renderizado de componentes y tipado estático estricto. |
| **Bundler** | Vite 5 | Servidor de desarrollo ultrarrápido y compilación optimizada. |
| **Enrutamiento** | React Router DOM v7 | Control de rutas privadas, públicas y Guards de autenticación. |
| **Estado Global** | Zustand | Gestión ligera de la sesión del usuario (Tokens, Roles, Datos). |
| **Caché y API** | TanStack Query v5 | Sincronización y caché del estado del servidor. |
| **Base de Datos Local** | IndexedDB (idb) | Almacenamiento local para colas de peticiones y sincronización en modo offline. |
| **Formularios** | React Hook Form + Zod | Orquestación de formularios y validaciones en tiempo de ejecución. |
| **Cliente HTTP** | Axios | Cliente HTTP instrumentado con interceptores de seguridad (Tokens, API Keys y Logs). |
| **Híbrido Móvil** | Capacitor 8 | Puente nativo para empaquetado y consumo de APIs de hardware en Android. |
| **Estilos** | CSS Vanilla | Hojas de estilo estructuradas con variables globales de diseño moderno. |
| **Tests** | Vitest | Ejecución ágil de pruebas unitarias y de integración. |

---

## 📁 Arquitectura Híbrida Modular + Clean

El proyecto está diseñado bajo una **estructura modular** (donde cada módulo agrupa una funcionalidad de negocio independiente), implementando internamente la separación de responsabilidades de **Clean Architecture** (Capa de Dominio, Aplicación, Adaptadores y Presentación).

### Estructura de Directorios (`src/`)

```
src/
├── core/                        # Piezas globales transversales de infraestructura
│   ├── api/                     # Cliente Axios (apiClient) con interceptores y logs de red
│   ├── router/                  # Definición de rutas, jerarquías y Guards de seguridad
│   └── store/                   # Almacén de Zustand para persistencia de credenciales (authStore)
│
├── modules/                     # Módulos encapsulados por dominio de negocio
│   └── <modulo>/
│       ├── domain/              # Lógica pura: tipos TS, interfaces y esquemas Zod (sin dependencias de React)
│       ├── hooks/               # Casos de uso: custom hooks que manejan estado y operaciones del módulo
│       ├── services/            # Adaptadores de datos: llamadas HTTP consumiendo apiClient
│       ├── components/          # Elementos visuales reutilizables internos del módulo
│       └── pages/               # Páginas completas (Vistas controladas por hooks)
│
└── shared/                      # Componentes e infraestructura de interfaz reutilizable globalmente
    ├── layout/                  # Estructura visual global (Sidebar responsiva, Topbar, Modales)
    ├── components/              # Inputs premium, modales, alertas y botones genéricos
    └── hooks/                   # Hooks globales (ej. geolocalización, cámara, conectividad)
```

### Tabla de Responsabilidades de Capas

| Capa | Carpeta Interna | Descripción | Puede importar de |
| :--- | :--- | :--- | :--- |
| **Dominio** | `domain/` | Interfaces de negocio, entidades y validaciones de datos (Zod). | Nada (TypeScript puro). |
| **Adaptadores** | `services/` | Implementación de peticiones HTTP mapeadas a los endpoints. | `core/api/` y `domain/`. |
| **Aplicación** | `hooks/` | Custom hooks con lógica y estado, orquestando servicios locales y de API. | `domain/` y `services/`. |
| **Presentación**| `components/` o `pages/` | Elementos JSX responsivos orientados a la experiencia de usuario. | `hooks/` y `domain/`. |

---

## 📦 Módulos del Sistema

| Módulo | Ruta Base | Funcionalidad |
| :--- | :--- | :--- |
| **`auth`** | `/login` | Inicio de sesión, persistencia de tokens de acceso, logout y refresco automático de sesión. |
| **`dashboard`** | `/dashboard` | Resumen del estado de la operación general del CDA, gráficos y KPIs principales. |
| **`usuarios`** | `/usuarios` | Módulo restringido para la administración de usuarios del sistema (solo `ADMIN`). |
| **`recepcion`** | `/recepcion` | Asistente de recepción de vehículos, asignación de clientes e inicio de órdenes de servicio. |
| **`clientes`** | `/clientes` | Creación, consulta y edición de perfiles de clientes naturales o jurídicos. |
| **`inspeccion`** | `/inspeccion/*` | Autoasignación de inspecciones y checklist interactivo bajo la norma NTC 5375. |
| **`vehiculo`** | `/vehiculo/*` | Registro exhaustivo de vehículos, con parametrización dinámica de catálogos inline. |
| **`facturacion`** | `/facturacion` | Gestión y visualización de la cola de facturación de servicios de inspección. |
| **`precios`** | `/precios` | Configuración y control de tarifas de servicios del CDA (solo `ADMIN` y `MANAGER`). |
| **`estados`** | `/estados` | Parametrización y visualización del flujo de estados de inspecciones del CDA. |
| **`storage`** | `/archivos` | Galería interactiva y administración física de archivos de evidencias en storage. |
| **`tracker`** | `/tracker` | Trazabilidad gráfica interactiva (SVG) del mapa de relaciones Cliente ➔ Vehículo ➔ Planilla. |

---

## 🌐 Control de Acceso Basado en Roles (RBAC)

El frontend mapea dinámicamente las rutas de inicio y la visibilidad de la barra lateral (Sidebar) según el rol asignado al token del usuario:

### Mapeo de Rutas Iniciales

| Rol Backend | Ruta Inicial en Frontend |
| :--- | :--- |
| `ADMIN` | `/dashboard` |
| `MANAGER` | `/recepcion` |
| `OPERARIO` | `/recepcion` |
| `RECEPCIONISTA` | `/recepcion` |
| `INSPECTOR` | `/inspeccion/asignacion` |
| `FACTURADOR` | `/facturacion` |

### Tabla de Visibilidad de Módulos (Sidebar)

| Módulo / Ruta | Roles Autorizados |
| :--- | :--- |
| **Dashboard** (`/dashboard`) | Todos los usuarios autenticados. |
| **Usuarios** (`/usuarios`) | `ADMIN` |
| **Recepción** (`/recepcion`) | `ADMIN`, `RECEPCIONISTA`, `MANAGER`, `OPERARIO` |
| **Clientes** (`/clientes`) | `ADMIN`, `RECEPCIONISTA`, `MANAGER`, `OPERARIO` |
| **Checklist** (`/inspeccion/asignacion`) | `ADMIN`, `INSPECTOR` |
| **Vehículos** (`/vehiculo/registro`) | `ADMIN`, `RECEPCIONISTA`, `MANAGER`, `OPERARIO` |
| **Facturación** (`/facturacion`) | `ADMIN`, `FACTURADOR`, `MANAGER` |
| **Tarifas** (`/precios`) | `ADMIN`, `MANAGER` |
| **Estados** (`/estados`) | `ADMIN`, `MANAGER` |
| **Plantillas** (`/plantillas`) | `ADMIN`, `MANAGER` |
| **Archivos** (`/archivos`) | `ADMIN` |
| **Trazabilidad** (`/tracker`) | `ADMIN`, `MANAGER` |

---

## 📶 Mecanismo de Sincronización Offline (HU-021)

El sistema cuenta con un motor robusto para operar bajo condiciones de **conectividad limitada o nula** de manera transparente para el usuario:

1.  **Monitoreo del Estado**: Un suscriptor global (`navigator.onLine`) monitorea el estado del enlace de red en tiempo real.
2.  **Cola de Peticiones en IndexedDB**: Si la red falla, cualquier petición de mutación de datos (peticiones `POST`, `PATCH`, `PUT`, `DELETE` — excluyendo el login y refresco de tokens) se encola localmente en **IndexedDB** a través del servicio `offlineStorage`.
3.  **Resolución Local Inmediata**: La interfaz responde al usuario de manera inmediata como "Operación Local Guardada", evitando pantallas de error de carga o bloqueos.
4.  **Autosincronización al Volver a Conectar**: En el momento en que se restablece la conexión (`online` event), el sistema activa de forma asíncrona un proceso de vaciado de la cola de IndexedDB, enviando las peticiones pendientes al backend secuencialmente.

---

## 🛠️ Configuración y Desarrollo

### Prerrequisitos
- Node.js **20.19+** o **22.12+**
- npm **10+**

### Instalación
```bash
npm install
```

### Configuración del Entorno (`.env`)
Copia el archivo de ejemplo `.env.example` como `.env` en la raíz del proyecto y edítalo:
```env
VITE_API_URL="https://api-tu-dominio.com/api"
VITE_API_KEY_FRONT="tu_api_key_aqui"
VITE_APP_NAME="CDA Putumayo"

# Variables para la firma de la aplicación Android
KEYSTORE_PASSWORD="tu_contrasena_de_firma"
KEY_ALIAS="cda_key"
KEY_PASSWORD="tu_contrasena_de_firma"
```

### Scripts de Desarrollo
- `npm run dev`: Servidor de desarrollo Web local.
- `npm run build`: Compilación optimizada para producción (genera carpeta `dist/`).
- `npm run test`: Ejecución de pruebas unitarias con Vitest.
- `npm run lint`: Validación de reglas de estilo y sintaxis con ESLint.

---

## 📱 Empaquetado y Configuración Android (Capacitor)

El proyecto incluye soporte nativo para compilarse y distribuirse como aplicación de Android.

### 1. Sincronización de Recursos Web
Cada vez que realices cambios en el código de React/Vite, debes compilar y sincronizar los recursos con el proyecto de Android nativo:
```bash
npm run android:sync
```

### 2. Configuración de Red en VPN (Tailscale y DNS Privado)
Dado que el entorno de desarrollo y pruebas se ejecuta sobre una VPN privada de **Tailscale**:

> [!IMPORTANT]
> **DNS Privado de Android**: Si el dispositivo Android tiene configurado un DNS Privado (como NextDNS, AdGuard o Cloudflare DoH), el sistema operativo bloqueará la resolución local de los dominios de la VPN debido a políticas de seguridad contra *DNS Rebinding*. Asegúrate de ir a **Ajustes > Redes e Internet > DNS Privado** en tu celular y ponerlo en **Desactivado** para que la app pueda conectar.

> [!NOTE]
> **Certificados de Seguridad**: El archivo `network_security_config.xml` está configurado para confiar tanto en los certificados raíz del sistema operativo como en los del usuario (`user`). Esto permite instalar certificados de desarrollo (ej. firmas CA de Tailscale) de forma manual en el almacén de credenciales del móvil y que la WebView de la app los reconozca.

---

## 🔑 Compilación de Producción y Firma del APK

El flujo de construcción nativa lee las credenciales del archivo `.env` mediante variables del sistema operativo en Gradle.

### Paso 1: Generar Keystore (Una sola vez)
Si necesitas crear un nuevo archivo de firma, ve al directorio `android/` y ejecuta:
```bash
mkdir keystore
keytool -genkey -v -keystore keystore/cda_release_key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias cda_key
```

### Paso 2: Compilar y Firmar el APK
Abre tu consola de terminal (en Windows PowerShell) y ejecuta los siguientes comandos en la raíz del proyecto para generar el APK optimizado y firmado:

```powershell
# 1. Cargar las credenciales de firma de tu .env al entorno de Gradle
$env:KEYSTORE_PASSWORD="tu_contrasena_de_firma"
$env:KEY_ALIAS="cda_key"
$env:KEY_PASSWORD="tu_contrasena_de_firma"

# 2. Sincronizar activos web
npm run android:sync

# 3. Construir el paquete nativo firmado de Android
cd android
./gradlew assembleRelease
```

### Ubicación del Instalable Final:
Una vez termine el build con éxito, tu instalador APK firmado estará listo en:
👉 `android/app/build/outputs/apk/release/app-release.apk`

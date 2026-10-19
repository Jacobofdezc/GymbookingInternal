# Guía de Despliegue en Producción — GymBooking Internal CRM

Esta guía describe el procedimiento paso a paso para desplegar **GymBooking Internal** en un entorno de producción seguro, escalable y de alto rendimiento utilizando **Vercel** y **Supabase**.

---

## Índice

1. [Preparación del Repositorio y Entorno Local](#1-preparación-del-repositorio-y-entorno-local)
2. [Configuración de Supabase en Producción](#2-configuración-de-supabase-en-producción)
3. [Configuración y Despliegue en Vercel](#3-configuración-y-despliegue-en-vercel)
4. [Ejecución del Bootstrap Post-Despliegue](#4-ejecución-del-bootstrap-post-despliegue)
5. [Lista de Verificación de Salud del Despliegue](#5-lista-de-verificación-de-salud-del-despliegue)
6. [Configuración de Dominio Personalizado y SSL](#6-configuración-de-dominio-personalizado-y-ssl)
7. [Monitorización, Mantenimiento y Backups](#7-monitorización-mantenimiento-y-backups)

---

## 1. Preparación del Repositorio y Entorno Local

Antes de iniciar el despliegue en Vercel, asegúrate de que el código base está limpio, testeado y compilado sin errores:

### 1.1. Verificación del Repositorio Git
Asegúrate de haber subido todos los cambios a la rama principal (`main`) del repositorio oficial:
- Repositorio: `https://github.com/Jacobofdezc/GymbookingInternal`

```bash
git status
git add .
git commit -m "docs: complete production documentation and bootstrap script"
git push origin main
```

### 1.2. Comprobación de Compilación y Tipado
Ejecuta la compilación de producción en local para validar que no existen errores de TypeScript ni discrepancias de linting:

```bash
cd gymbooking-internal
npm run lint
npm run build
```

---

## 2. Configuración de Supabase en Producción

El proyecto Supabase de producción gestiona la persistencia de datos, autenticación y archivos.

- **Proyecto Supabase**: [https://supabase.com/dashboard/project/fuhqldalxqghavnfwjix](https://supabase.com/dashboard/project/fuhqldalxqghavnfwjix)
- **URL del Proyecto**: `https://fuhqldalxqghavnfwjix.supabase.co`

### 2.1. Aplicación de Migraciones
Aplica las 4 migraciones SQL en orden secuencial mediante la CLI o el SQL Editor del panel:
1. `001_schema.sql`: Estructura de tablas, claves foráneas, índices de búsqueda y triggers.
2. `002_functions.sql`: Funciones de seguridad, helpers RLS y triggers de eventos.
3. `003_rls.sql`: Activación obligatoria de Row Level Security y políticas de acceso.
4. `004_seed_statuses.sql`: Procedimiento de inicialización de datos de referencia (`seed_organization_data`).

### 2.2. Configuración del Storage Bucket
1. En el panel de Supabase, accede a **Storage** > **Buckets**.
2. Verifica la existencia del bucket `documents`. Si no existe, créalo con:
   - **Name**: `documents`
   - **Public bucket**: **Desactivado** (privado).
3. Las políticas RLS de la migración 003 controlarán el acceso mediante URLs firmadas.

### 2.3. Configuración de Autenticación (Auth & Email)
1. Ve a **Authentication** > **URL Configuration**:
   - **Site URL**: Introduce la URL de producción definitiva (ej. `https://crm.gymbooking.com` o la URL de Vercel asignada `https://gymbooking-internal.vercel.app`).
   - **Redirect URLs**: Añade los patrones permitidos:
     - `https://crm.gymbooking.com/**`
     - `https://gymbooking-internal.vercel.app/**`
     - `http://localhost:3000/**` (para pruebas locales)
2. Configuración de Proveedor SMTP:
   - En **Authentication** > **Email Settings / SMTP**, desactiva el servicio de email predeterminado para producción y conecta un proveedor transaccional dedicado (Resend, SendGrid o AWS SES). Esto garantiza que las invitaciones y enlaces mágicos no caigan en spam ni superen límites por hora.

---

## 3. Configuración y Despliegue en Vercel

### 3.1. Crear el Proyecto en Vercel
1. Inicia sesión en [Vercel](https://vercel.com) con tu cuenta de equipo.
2. Haz clic en **Add New...** > **Project**.
3. Importa el repositorio: `Jacobofdezc/GymbookingInternal`.

### 3.2. Configuración del Proyecto (Project Settings)
- **Framework Preset**: `Next.js`
- **Root Directory**: Pulsa en **Edit** y selecciona `gymbooking-internal` (¡Crítico! El proyecto de código vive dentro de esta subcarpeta).
- **Build Command**: `next build` (predeterminado).
- **Install Command**: `npm install --legacy-peer-deps`.

### 3.3. Variables de Entorno en Vercel
Configura las variables distinguiendo estrictamente su ámbito de exposición:

| Variable | Ámbito | Valor de Producción | Descripción |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | `https://fuhqldalxqghavnfwjix.supabase.co` | URL pública de la API de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | `eyJhbGciOi...` (tu anon key) | Clave pública de cliente para Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | **Solo Server** | `eyJhbGciOi...` (tu service_role key) | **Superclave secreta**. Desmarca la opción de exposición a cliente |
| `NEXT_PUBLIC_APP_URL` | Client & Server | `https://crm.gymbooking.com` | Dominio canónico de la aplicación |
| `BOOTSTRAP_ADMIN_EMAIL` | **Solo Server** | `admin@gymbooking.com` | Email del primer superadministrador |
| `BOOTSTRAP_ADMIN_NAME` | **Solo Server** | `Admin GymBooking` | Nombre del administrador inicial |
| `BOOTSTRAP_ORG_NAME` | **Solo Server** | `GymBooking` | Nombre de la organización principal |
| `BOOTSTRAP_ORG_SLUG` | **Solo Server** | `gymbooking` | Identificador slug de la organización |

> **Advertencia de Seguridad**: Nunca expongas `SUPABASE_SERVICE_ROLE_KEY` en el navegador. Esta clave tiene permisos ilimitados en la base de datos y se salta todas las políticas RLS.

### 3.4. Ejecutar el Despliegue
Haz clic en **Deploy**. Vercel compilará la aplicación y asignará un dominio inicial (ej. `gymbooking-internal.vercel.app`).

---

## 4. Ejecución del Bootstrap Post-Despliegue

Una vez que el despliegue esté completado, la base de datos necesita inicializar la primera organización y crear el usuario administrador:

### Opción A: Mediante Petición HTTP contra Producción
Ejecuta la siguiente llamada `curl` contra la URL de tu despliegue en Vercel:

```bash
curl -X POST https://gymbooking-internal.vercel.app/api/bootstrap
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "Bootstrap completado exitosamente. Revisa tu email para aceptar la invitación.",
  "organizationId": "d8b3c...uuid",
  "adminEmail": "admin@gymbooking.com"
}
```

### Opción B: Mediante Script CLI en Local
Puedes ejecutar el script `scripts/bootstrap.ts` asegurándote de que tu archivo `.env.local` apunta a las credenciales de producción:

```bash
npx tsx scripts/bootstrap.ts
```

### Finalización del Acceso:
Abre la bandeja de entrada del correo especificado en `BOOTSTRAP_ADMIN_EMAIL`, pulsa en el botón **Aceptar Invitación** y completa tu contraseña o sesión con magic link.

---

## 5. Lista de Verificación de Salud del Despliegue

Tras completar el despliegue, realiza este checklist funcional:

- [ ] **Acceso a Login**: Al visitar `https://tu-dominio.com` sin sesión, se redirige inmediatamente a `/login`.
- [ ] **Magic Link**: Introducir un email corporativo y verificar la recepción del correo.
- [ ] **Carga del Dashboard**: Al iniciar sesión como admin, la barra lateral muestra todas las secciones (Pipeline, Gimnasios, Onboarding, Clases, Incidencias, Equipo).
- [ ] **Aislamiento RLS**: La consulta a `/pipeline` carga los estados sembrados por `seed_organization_data` (`Identificado`, `Contactado`, `Negociación`, etc.).
- [ ] **Subida de Archivos**: Probar la carga de un documento de prueba en la ficha de un gimnasio y verificar que se guarda en el bucket `documents` de Supabase.
- [ ] **Invitación de Miembros**: Enviar una invitación a un usuario con rol `commercial` desde `/team` y comprobar que se genera la fila en la tabla `invitations`.

---

## 6. Configuración de Dominio Personalizado y SSL

Para profesionalizar el acceso del equipo, conecta un dominio corporativo:

1. En el panel de Vercel, accede a **Settings** > **Domains**.
2. Añade tu subdominio de operaciones, por ejemplo: `crm.gymbooking.com`.
3. Vercel indicará los registros DNS requeridos en tu proveedor de dominio (Cloudflare, GoDaddy, Namecheap, etc.):
   - **Tipo**: `CNAME`
   - **Nombre / Host**: `crm`
   - **Valor / Destino**: `cname.vercel-dns.com`
4. Espera unos minutos a que se propaguen los DNS. Vercel aprovisionará automáticamente un certificado SSL/TLS gratuito y renovable de Let's Encrypt.
5. Actualiza las variables `NEXT_PUBLIC_APP_URL` en Vercel y **Site URL / Redirect URLs** en Supabase Dashboard con el nuevo dominio canónico.

---

## 7. Monitorización, Mantenimiento y Backups

### 7.1. Monitorización en Vercel
- **Runtime Logs**: Revisa logs de servidor y posibles errores 500 en **Vercel** > **Deployments** > **Logs**.
- **Speed Insights & Analytics**: Monitoriza los Core Web Vitals y tiempos de respuesta de las rutas en el panel de Vercel.

### 7.2. Monitorización en Supabase
- **Database Health**: En **Supabase Dashboard** > **Reports** > **Database**, vigila el consumo de CPU, memoria RAM, conexiones activas al pool (PgBouncer/Supavisor) y operaciones de disco.
- **Auth Logs**: Consulta intentos fallidos de autenticación o bloqueos de rate limit en **Authentication** > **Logs**.

### 7.3. Política de Backups y Recuperación ante Desastres (DRP)
- **Copias Diarias**: Gestionadas automáticamente por Supabase.
- **Point-in-Time Recovery (PITR)**: En el plan Supabase Pro, mantén activado PITR para restaurar la base de datos a un timestamp exacto en caso de corrupción o manipulación accidental.
- **Dump Periódico de Respaldo**:
  ```bash
  npx supabase db dump --project-ref fuhqldalxqghavnfwjix -f backup_prod_$(date +%Y%m%d).sql
  ```

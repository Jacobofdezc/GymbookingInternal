# GymBooking Internal — CRM y Centro de Operaciones

Plataforma integral de gestión de relaciones comerciales (CRM), pipeline de ventas, incorporación (*onboarding*) técnica y operativa de centros deportivos, seguimiento de clases y gestión de incidencias para el equipo interno de **GymBooking**.

---

## Índice de Contenidos

- [1. Descripción del Proyecto](#1-descripción-del-proyecto)
- [2. Requisitos Previos](#2-requisitos-previos)
- [3. Instalación](#3-instalación)
- [4. Configuración de Supabase](#4-configuración-de-supabase)
- [5. Variables de Entorno](#5-variables-de-entorno)
- [6. Ejecución de Migraciones de Base de Datos](#6-ejecución-de-migraciones-de-base-de-datos)
- [7. Configuración de Supabase Storage](#7-configuración-de-supabase-storage)
- [8. Creación del Primer Administrador (Bootstrap)](#8-creación-del-primer-administrador-bootstrap)
- [9. Ejecución en Local](#9-ejecución-en-local)
- [10. Generación de Tipos TypeScript](#10-generación-de-tipos-typescript)
- [11. Ejecución de Pruebas y Linting](#11-ejecución-de-pruebas-y-linting)
- [12. Despliegue en Vercel](#12-despliegue-en-vercel)
- [13. Gestión de Usuarios y Roles](#13-gestión-de-usuarios-y-roles)
- [14. Copias de Seguridad (Backups)](#14-copias-de-seguridad-backups)
- [15. Guía: Cómo Añadir una Nueva Tabla](#15-guía-cómo-añadir-una-nueva-tabla)
- [16. Resolución de Problemas Frecuentes](#16-resolución-de-problemas-frecuentes)
- [Documentación Adicional](#documentación-adicional)

---

## 1. Descripción del Proyecto

**GymBooking Internal** es la herramienta nuclear de operaciones del equipo de GymBooking. Centraliza todo el ciclo de vida de los gimnasios asociados:
- **Prospección y Pipeline Comercial**: Tablero Kanban interactivo, seguimiento de oportunidades comerciales, estados dinámicos y registro de interacciones omnicanal (llamadas, emails, WhatsApp, reuniones).
- **Onboarding e Incorporación**: Checklist estructurado de tareas para dar de alta gimnasios, verificar datos legales, configurar disciplinas y horarios, y autorizar la publicación.
- **Catálogo de Clases y Horarios**: Gestión de la oferta deportiva, niveles, precios, aforos y métodos de reserva.
- **Gestión de Incidencias**: Sistema de tickets con SLA, prioridades, seguimiento de errores técnicos o comerciales y notificaciones automáticas para incidencias urgentes.
- **Base de Conocimiento y Registro de Decisiones**: Documentación de procedimientos, arquitectura, acuerdos comerciales y repositorio centralizado de documentos privados en Storage.

---

## 2. Requisitos Previos

Antes de comenzar la instalación en local, asegúrate de disponer de las siguientes herramientas y cuentas:

- **Node.js**: Versión `20.x` o superior (Recomendado: Node LTS v20 o v22).
- **npm**: Versión `10.x` o superior (incluido con Node.js).
- **Git**: Sistema de control de versiones.
- **Cuenta en Supabase**: Acceso al proyecto de la organización o proyecto propio ([https://supabase.com](https://supabase.com)).
  - Proyecto oficial: [https://supabase.com/dashboard/project/fuhqldalxqghavnfwjix](https://supabase.com/dashboard/project/fuhqldalxqghavnfwjix)
- **Cuenta en Vercel**: Para despliegue continuo de entornos de desarrollo y producción ([https://vercel.com](https://vercel.com)).

---

## 3. Instalación

Clona el repositorio oficial de GitHub e instala las dependencias dentro del subdirectorio del proyecto:

```bash
# 1. Clonar el repositorio
git clone https://github.com/Jacobofdezc/GymbookingInternal.git

# 2. Entrar en la carpeta del proyecto Next.js
cd GymbookingInternal/gymbooking-internal

# 3. Instalar las dependencias del proyecto
npm install --legacy-peer-deps
```

> **Nota sobre `--legacy-peer-deps`**: Es recomendable utilizar el flag `--legacy-peer-deps` debido a la compatibilidad entre paquetes con soporte para React 19.

---

## 4. Configuración de Supabase

El backend de GymBooking Internal utiliza Supabase como plataforma de base de datos PostgreSQL, autenticación, Storage y Row Level Security (RLS).

1. Inicia sesión en [Supabase Dashboard](https://supabase.com/dashboard).
2. Accede a tu proyecto: [fuhqldalxqghavnfwjix](https://supabase.com/dashboard/project/fuhqldalxqghavnfwjix).
3. Dirígete a **Project Settings** > **API**:
   - **Project URL**: Guarda este valor (ej. `https://fuhqldalxqghavnfwjix.supabase.co`).
   - **anon / public key**: Llave pública para el cliente web.
   - **service_role key**: Llave secreta con privilegios de superusuario para el servidor y scripts de administración. **¡Nunca exponer esta clave en el cliente ni subirla a Git!**

---

## 5. Variables de Entorno

Crea tu archivo `.env.local` a partir de la plantilla `.env.example`:

```bash
cp .env.example .env.local
```

Abre `.env.local` y define los siguientes valores:

```env
# ============================================================
# SUPABASE — Públicas (accesibles en navegador y servidor)
# ============================================================
NEXT_PUBLIC_SUPABASE_URL=https://fuhqldalxqghavnfwjix.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui

# ============================================================
# SUPABASE — Solo Servidor (NUNCA usar prefijo NEXT_PUBLIC_)
# ============================================================
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# ============================================================
# APLICACIÓN
# ============================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================================
# BOOTSTRAP INICIAL (Solo para la primera configuración)
# ============================================================
BOOTSTRAP_ADMIN_EMAIL=admin@gymbooking.com
BOOTSTRAP_ADMIN_NAME="Administrador Inicial"
BOOTSTRAP_ORG_NAME="GymBooking"
BOOTSTRAP_ORG_SLUG="gymbooking"
```

---

## 6. Ejecución de Migraciones de Base de Datos

El esquema relacional, funciones, políticas de seguridad RLS y datos iniciales de referencia están estructurados en 4 migraciones SQL secuenciales:

- `supabase/migrations/001_schema.sql`: Creación de tablas relacionales, índices y triggers de `updated_at`.
- `supabase/migrations/002_functions.sql`: Funciones auxiliares de RLS, triggers de creación de usuarios, auditoría y notificaciones automáticas.
- `supabase/migrations/003_rls.sql`: Activación y políticas granulares de Row Level Security (RLS) para todas las tablas.
- `supabase/migrations/004_seed_statuses.sql`: Procedimiento almacenado `seed_organization_data()` para generar los estados comerciales, estados de onboarding, disciplinas y plantillas predeterminadas.

### Opción A: Mediante Supabase CLI (Recomendado)

```bash
# 1. Iniciar sesión en la CLI de Supabase
npx supabase login

# 2. Vincular el proyecto local con el proyecto remoto
npx supabase link --project-ref fuhqldalxqghavnfwjix

# 3. Aplicar las migraciones a la base de datos remota
npx supabase db push
```

### Opción B: Ejecución directa en Supabase Dashboard

1. Accede a tu panel en [Supabase Dashboard > SQL Editor](https://supabase.com/dashboard/project/fuhqldalxqghavnfwjix/sql).
2. Abre y ejecuta las consultas en este orden estricto:
   1. `supabase/migrations/001_schema.sql`
   2. `supabase/migrations/002_functions.sql`
   3. `supabase/migrations/003_rls.sql`
   4. `supabase/migrations/004_seed_statuses.sql`

---

## 7. Configuración de Supabase Storage

La plataforma permite almacenar documentación contractual, propuestas comerciales, horarios y adjuntos de incidencias:

1. Ve a **Supabase Dashboard** > **Storage**.
2. Haz clic en **Create new bucket**.
3. Configura el bucket:
   - **Name**: `documents`
   - **Public bucket**: Desactivado (debe ser un bucket **privado**, con RLS habilitado).
4. Guarda el bucket. El acceso a los archivos se gestionará de manera segura mediante URLs firmadas y validación de permisos de organización y rol.

---

## 8. Creación del Primer Administrador (Bootstrap)

Dado que las políticas RLS exigen que cada usuario pertenezca a una organización activa para consultar o crear datos, el sistema incluye un mecanismo de **Bootstrap** para inicializar la primera organización y enviar la invitación al administrador.

### Método 1: Vía Script CLI (Recomendado en desarrollo)

Asegúrate de que `BOOTSTRAP_ADMIN_EMAIL` está definido en tu `.env.local` y ejecuta:

```bash
npx tsx scripts/bootstrap.ts
```

El script:
1. Verifica que no exista una organización previa.
2. Crea la organización en `organizations`.
3. Ejecuta `seed_organization_data(org.id)` para sembrar estados y disciplinas.
4. Inserta el registro de invitación con rol `admin`.
5. Envía una invitación oficial por correo electrónico mediante la API de Supabase Auth.

### Método 2: Vía Endpoint HTTP

Inicia el servidor en local (`npm run dev`) y realiza una petición POST:

```bash
curl -X POST http://localhost:3000/api/bootstrap
```

Una vez ejecutado, abre la bandeja de entrada del correo especificado en `BOOTSTRAP_ADMIN_EMAIL`, haz clic en el enlace de invitación para activar tu cuenta y configurar tu contraseña.

---

## 9. Ejecución en Local

Para iniciar el servidor de desarrollo local con recarga rápida (*Hot Module Replacement*):

```bash
npm run dev
```

Abre tu navegador en [http://localhost:3000](http://localhost:3000). Serás redirigido automáticamente a `/login` si aún no has iniciado sesión.

---

## 10. Generación de Tipos TypeScript

El proyecto utiliza TypeScript estricto con los tipos de la base de datos generados directamente desde el esquema de Supabase:

```bash
npx supabase gen types typescript --project-id fuhqldalxqghavnfwjix > types/database.ts
```

> **Consejo**: Ejecuta este comando siempre que añadas una nueva migración o modifiques columnas en la base de datos para mantener sincronizados los tipos estáticos en `types/database.ts`.

---

## 11. Ejecución de Pruebas y Linting

Para comprobar la calidad del código, estándares de estilo y análisis estático de ESLint:

```bash
# Ejecución del linter
npm run lint

# Verificación de compilación de producción de Next.js
npm run build
```

---

## 12. Despliegue en Vercel

El proyecto está optimizado para su despliegue continuo en [Vercel](https://vercel.com):

1. En el panel de Vercel, pulsa en **Add New...** > **Project**.
2. Conecta con el repositorio: [https://github.com/Jacobofdezc/GymbookingInternal](https://github.com/Jacobofdezc/GymbookingInternal).
3. En **Configure Project**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `gymbooking-internal` (¡muy importante al estar dentro de este subdirectorio!).
4. Despliega la sección **Environment Variables** y añade las siguientes claves:

| Variable | Tipo | Descripción |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser & Server | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser & Server | Clave pública anónima de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | **Solo Server** | Clave privada de servicio (desmarcar en cliente) |
| `NEXT_PUBLIC_APP_URL` | Browser & Server | URL en producción (ej. `https://crm.gymbooking.com`) |

5. Pulsa en **Deploy**.
6. Una vez desplegado, si no has ejecutado el bootstrap previamente, ejecuta la llamada POST contra tu dominio de producción:
   ```bash
   curl -X POST https://tu-dominio.vercel.app/api/bootstrap
   ```

---

## 13. Gestión de Usuarios y Roles

La plataforma soporta control de acceso basado en roles (RBAC) con 4 perfiles diferenciados:

| Rol | Permisos Principales |
| :--- | :--- |
| **Administrador (`admin`)** | Acceso global total. Puede invitar miembros, modificar configuración de estados comerciales y de onboarding, ver registros de auditoría y eliminar registros. |
| **Comercial (`commercial`)** | Gestión completa del pipeline CRM, creación de gimnasios, registro de contactos, interacciones comerciales y visualización de documentos comerciales. |
| **Operaciones (`operations`)** | Gestión del proceso de onboarding, verificación de clases, programación de horarios, resolución de incidencias y gestión de documentación técnica. |
| **Observador (`viewer`)** | Acceso de solo lectura al CRM, métricas, incidencias y base de conocimiento. Sin permisos de escritura. |

### Flujo de Invitación:
1. Un administrador accede a la sección de equipo (`/team`).
2. Rellena el email del nuevo colaborador y asigna su rol (`commercial`, `operations`, etc.).
3. El sistema genera un token de invitación y envía un correo con enlace mágico (*magic link*).
4. El colaborador abre el enlace, valida su identidad y el trigger de base de datos `handle_new_user` crea automáticamente su perfil en `profiles` vinculado a la organización correcta.

---

## 14. Copias de Seguridad (Backups)

La base de datos contiene información comercial crítica de la empresa:

1. **Copias Automáticas Diarias**: Supabase realiza copias de seguridad automáticas diarias retenidas según el plan contratado.
2. **Acceso a Backups**: Dirígete a **Supabase Dashboard** > **Database** > **Backups**.
3. **Point-in-Time Recovery (PITR)**: En entornos de producción (Plan Supabase Pro), se recomienda encarecidamente activar PITR para permitir restauraciones a cualquier segundo específico ante incidentes o borrados accidentales.
4. **Dump Manual de Emergencia**:
   ```bash
   npx supabase db dump --project-ref fuhqldalxqghavnfwjix -f backup_$(date +%Y%m%d).sql
   ```

---

## 15. Guía: Cómo Añadir una Nueva Tabla

Sigue este procedimiento estandarizado para ampliar el modelo de datos manteniendo la integridad y la seguridad:

1. **Crear archivo de migración SQL**:
   Crea `supabase/migrations/005_tu_nueva_tabla.sql`.
   ```sql
   CREATE TABLE nueva_tabla (
     id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
     organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
     name            text NOT NULL,
     created_at      timestamptz NOT NULL DEFAULT now(),
     updated_at      timestamptz NOT NULL DEFAULT now()
   );

   CREATE TRIGGER update_nueva_tabla_updated_at
     BEFORE UPDATE ON nueva_tabla
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
   ```
2. **Añadir políticas RLS**:
   Habilita RLS y asegura el aislamiento multinquilino:
   ```sql
   ALTER TABLE nueva_tabla ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "nueva_tabla_select" ON nueva_tabla
     FOR SELECT USING (organization_id = get_user_organization_id());

   CREATE POLICY "nueva_tabla_write" ON nueva_tabla
     FOR ALL USING (organization_id = get_user_organization_id() AND can_write());
   ```
3. **Aplicar la migración**:
   ```bash
   npx supabase db push
   ```
4. **Regenerar los tipos TypeScript**:
   ```bash
   npx supabase gen types typescript --project-id fuhqldalxqghavnfwjix > types/database.ts
   ```
5. **Crear el servicio de datos**:
   En `services/nuevaTabla.ts`, define las funciones con consultas tipadas usando `@/lib/supabase/client` o `@/lib/supabase/server`.
6. **Desarrollar componentes de interfaz**:
   Crea las vistas y componentes en `components/` o `app/(dashboard)/...`.

---

## 16. Resolución de Problemas Frecuentes

### 1. Error de CORS o redirección incorrecta tras iniciar sesión
- **Causa**: Discrepancia entre la URL de origen y `NEXT_PUBLIC_APP_URL` o la configuración de redirección de Supabase Auth.
- **Solución**: Revisa en Supabase Dashboard (**Authentication** > **URL Configuration**) que **Site URL** y las **Redirect URLs** incluyan `http://localhost:3000/**` (en local) y tu dominio de Vercel `https://tu-app.vercel.app/**`.

### 2. Error RLS: "new row violates row-level security policy"
- **Causa**: El usuario autenticado no tiene un perfil creado en la tabla `profiles` o su campo `is_active` es `false`.
- **Solución**: Comprueba en la tabla `public.profiles` que existe una fila con el `id` correspondiente al UID de `auth.users`, con un `organization_id` válido y `is_active = true`.

### 3. El correo con Magic Link o invitación no llega
- **Causa**: Cuota del servicio de email por defecto de Supabase superada o filtro de spam.
- **Solución**: En entornos de desarrollo, puedes revisar los logs en **Supabase** > **Authentication** > **Logs**. Para producción, configura un proveedor SMTP dedicado (Resend, SendGrid o AWS SES) en **Authentication** > **Email Templates / SMTP**.

### 4. Tipos TypeScript desincronizados o errores de tipado en Supabase Client
- **Causa**: Modificaciones en la base de datos sin regenerar `types/database.ts`.
- **Solución**: Ejecuta `npx supabase gen types typescript --project-id fuhqldalxqghavnfwjix > types/database.ts` y reinicia el servidor de TypeScript en tu editor.

---

## Documentación Adicional

Para profundizar en la arquitectura interna y los procesos operativos, consulta los documentos especializados en la carpeta `docs/`:

- [Arquitectura Técnica del Sistema](docs/ARCHITECTURE.md): Diagramas, tecnologías, diseño de base de datos con las 26 tablas relacionales, filosofía RLS y flujos de autenticación.
- [Flujos de Trabajo del Negocio](docs/WORKFLOWS.md): Guía paso a paso del ciclo de vida del gimnasio, pipeline comercial, checklists de onboarding y gestión de incidencias.
- [Guía de Despliegue en Producción](docs/DEPLOYMENT.md): Manual detallado para desplegar, configurar dominios, monitorear y mantener GymBooking Internal en Vercel y Supabase.

# Cooperativa Digital — Espacio Escolar de Gestión Colaborativa

Aplicación web interactiva desarrollada en **Vue 3 (`.vue`)** y **JavaScript puro (`.js`)** con soporte híbrido para **Supabase (PostgreSQL + Auth)**, diseñada para la **Cooperativa Escolar de Soluciones Digitales y Tecnológicas (7.° Año Técnica — Ciclo Lectivo 2026)**.

## Estructura del Proyecto (Solo `.vue`, `.js`, `.css` y `.sql`)

```text
Cooperativa_Souluciones/
├── .env.example                                  # Plantilla de variables públicas de Supabase
├── Informe_Final_Cooperativa_Escolar.md          # Informe final integrador y guion de exposición
├── index.html                                    # Punto de entrada HTML5
├── package.json                                  # Dependencias (Vue 3, Vue Router 4, Supabase JS, Lucide Vue)
├── vite.config.js                                # Configuración de Vite + @vitejs/plugin-vue
├── supabase/
│   └── schema_and_seed.sql                       # Script SQL reproducible (10 tablas, PK/FK, Triggers y Seed)
└── src/
    ├── main.js                                   # Inicialización de Vue 3 y Vue Router
    ├── App.vue                                   # Componente raíz
    ├── styles.css                                # Sistema de diseño visual en CSS puro
    ├── router/
    │   └── index.js                              # Configuración de rutas en JavaScript
    ├── lib/
    │   ├── supabase.js                           # Cliente @supabase/supabase-js y funciones híbridas
    │   └── auth.js                               # Autenticación, perfiles, foto y alta de usuarios por Consejo/Admin
    ├── data/
    │   └── cooperativaModels.js                  # 8 roles cooperativos, datos de prueba, KPIs y series históricas
    ├── views/
    │   └── HomeView.vue                          # Vista principal (Inicio, Solicitudes, Proyectos, Comisiones, Actas, Tablero KPI, Informe, Usuarios y Perfil)
    └── components/
        ├── AuthView.vue                          # Pantalla de inicio de sesión y recuperación
        ├── UserProfileView.vue                   # Perfil personal (foto, datos, contraseña) y panel de Usuarios y Roles (Consejo/Admin)
        ├── CooperativaVisualizations.vue         # 3 visualizaciones SVG analíticas (Principios Gestalt)
        ├── KPITrackingDashboard.vue              # Tablero de Seguimiento Balanced Scorecard (TEUP, IASS, PDFT, IPEC)
        └── FollowUpReportView.vue                # Informe de Seguimiento periódico imprimible (PDF)
```

## Cómo ejecutar el proyecto localmente

```bash
npm install
npm run dev
```

## Cómo conectar tu base de datos en Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. Abrí **SQL Editor -> New Query**, pegá el contenido completo de `supabase/schema_and_seed.sql` y ejecutalo (**Run**).
3. Copiá `.env.example` a `.env` y completá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (nunca incluyas claves privadas `service_role` en el frontend).

---

## Credenciales y Acceso de Usuarios

> **Regla de seguridad:** Las cuentas y roles son creados únicamente por el **Consejo de Administración** o el **Administrador Técnico** desde **Usuarios y roles**. Al ejecutar `supabase/schema_and_seed.sql`, todas las cuentas del padrón se crean con la contraseña inicial `coop2026`. Los usuarios estándar deben cambiarla obligatoriamente en su primer ingreso.

### 1. Cuenta inicial en modo local (sin Supabase configurado)

| Usuario | Correo | Contraseña | Rol asignado |
| :--- | :--- | :--- | :--- |
| `consejo` | `consejo@cooperativa.edu.ar` | `coop2026` | Consejo de Administración |

### 2. Padrón completo de usuarios (`supabase/schema_and_seed.sql`)

| ID | Nombre completo | Usuario (`username`) | Correo institucional | Rol asignado | Contraseña inicial | Cambio obligatorio al ingresar |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `S-05` | Lucía Pereyra | `lucia.pereyra` | `lucia.pereyra@escuela.edu.ar` | `consejo_administracion` (Presidenta) | `coop2026` | No |
| `S-03` | Elena Varela | `elena.varela` | `elena.varela@escuela.edu.ar` | `consejo_administracion` (Secretaria) | `coop2026` | No |
| `S-06` | Camila Méndez | `camila.mendez` | `camila.mendez@escuela.edu.ar` | `consejo_administracion` (Tesorera) | `coop2026` | No |
| `ADM-01` | Prof. Hernán Benítez | `laboratorio.tic` | `laboratorio.tic@escuela.edu.ar` | `admin_tecnico` (Admin Técnico / Sala) | `coop2026` | No |
| `S-01` | Martina López | `martina.lopez` | `martina.lopez@escuela.edu.ar` | `referente_comision` (Ref. Programación) | `coop2026` | Sí |
| `S-02` | Sofía Fernández | `sofia.fernandez` | `sofia.fernandez@escuela.edu.ar` | `referente_comision` (Ref. Diseño UI/UX) | `coop2026` | Sí |
| `S-04` | Agustín Romero | `agustin.romero` | `agustin.romero@escuela.edu.ar` | `referente_comision` (Ref. Pruebas QA) | `coop2026` | Sí |
| `S-08` | Julián Castro | `julian.castro` | `julian.castro@escuela.edu.ar` | `socio` (Programación) | `coop2026` | Sí |
| `S-10` | Alma Torres | `alma.torres` | `alma.torres@escuela.edu.ar` | `socio` (QA y Documentación) | `coop2026` | Sí |
| `S-07` | Socio S-07 | `socio07` | `socio07@escuela.edu.ar` | `socio` (Contenidos) | `coop2026` | Sí |
| `S-14` | Socio S-14 | `socio14` | `socio14@escuela.edu.ar` | `socio` (Contenidos) | `coop2026` | Sí |
| `S-09` | Nicolás Silva | `nicolas.silva` | `nicolas.silva@escuela.edu.ar` | `sindicatura` (Síndico Escolar) | `coop2026` | Sí |
| `ASE-01` | Prof. Valeria Quiroga | `asesoria.coop` | `asesoria.coop@escuela.edu.ar` | `docente_asesor` (Comisión Asesora) | `coop2026` | Sí |
| `D-01` | Prof. Laura Gómez | `biblioteca` | `biblioteca@escuela.edu.ar` | `solicitante_externo` (Biblioteca) | `coop2026` | Sí |
| `D-02` | Prof. Marcos Díaz | `ciencias` | `ciencias@escuela.edu.ar` | `solicitante_externo` (Ciencias) | `coop2026` | Sí |
| `COM-PUB` | Visitante Comunidad | `comunidad` | `comunidad@escuela.edu.ar` | `comunidad_escolar` (Vista Pública) | `coop2026` | Sí |

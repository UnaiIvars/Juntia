# Juntia

> Aplicación web full stack para la gestión y organización de viajes y reservas.

JuntIA es una aplicación web desarrollada como proyecto de **Desarrollo de Aplicaciones Web (DAW)**. Permite a los usuarios registrarse, gestionar su cuenta y organizar viajes y reservas mediante una aplicación conectada a una base de datos relacional.

El proyecto incluye gestión de usuarios, destinos y reservas, además de un panel de administración para gestionar la información de la plataforma.

## Funcionalidades

* **Registro e inicio de sesión** — Autenticación y gestión de usuarios.
* **Gestión de usuarios** — Administración de la información y configuración de la cuenta.
* **Gestión de viajes** — Creación y organización de planes de viaje.
* **Gestión de reservas** — Creación y administración de reservas.
* **Gestión de destinos** — CRUD completo de destinos.
* **Participantes** — Gestión de los usuarios que participan en cada plan.
* **Chat** — Comunicación entre participantes de un viaje.
* **Ubicación y mapas** — Visualización de la ubicación asociada al plan.
* **Panel de administración** — Gestión de usuarios, destinos y reservas.
* **Base de datos relacional** — Persistencia de la información mediante MySQL.

## Tecnologías

| Tecnología     | Uso                                          |
| -------------- | -------------------------------------------- |
| **PHP**        | Desarrollo del backend y lógica de servidor  |
| **MySQL**      | Base de datos relacional                     |
| **JavaScript** | Interactividad y funcionalidades del cliente |
| **HTML5**      | Estructura de la aplicación                  |
| **CSS3**       | Diseño y estilos de la interfaz              |

## Arquitectura

JuntIA utiliza una arquitectura web basada en **PHP**, con **MySQL** como sistema de gestión de base de datos y tecnologías web estándar para el desarrollo del frontend.

```text
┌─────────────────────┐
│      Frontend       │
│                     │
│ HTML5 · CSS3        │
│ JavaScript          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│       Backend       │
│                     │
│        PHP          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│      Database       │
│                     │
│       Supabase      │
└─────────────────────┘
```

## Demo

[Ver Juntia](https://juntia-xi.vercel.app)

La aplicación está disponible online para explorar sus principales funcionalidades.

## Capturas

### Página principal

<img width="1318" height="939" alt="Página principal de JuntIA" src="https://github.com/user-attachments/assets/ff5cfaef-d336-4431-b06a-232870623e81" />

### Dashboard principal

<img width="1443" height="823" alt="Dashboard principal de JuntIA" src="https://github.com/user-attachments/assets/b3403820-53fc-445f-81cf-df1affe6dfd4" />

### Ajustes de usuario

<img width="708" height="866" alt="Ajustes de usuario de JuntIA" src="https://github.com/user-attachments/assets/0b318f43-fb20-4ace-a859-2f78735cd3d5" />

### Inicio de sesión

<img width="895" height="890" alt="Inicio de sesión de JuntIA" src="https://github.com/user-attachments/assets/a77406ed-1e15-4c84-a5cb-26ff846d7d29" />

### Plan de viaje — Horarios, participantes y parámetros

<img width="1186" height="1047" alt="Configuración del plan de viaje" src="https://github.com/user-attachments/assets/da6bf297-ba74-43b3-8349-32088fa61a74" />

### Plan de viaje — Ubicación, mapa y chat

<img width="946" height="1041" alt="Ubicación, mapa y chat del plan" src="https://github.com/user-attachments/assets/de620458-1ed4-4e1e-aa6a-4985911cf71b" />

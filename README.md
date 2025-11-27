# Migración de Datos de Doctoralia

Este proyecto automatiza la extracción de datos de doctores de Doctoralia, genera datos falsos de pacientes y citas, y puebla una base de datos PostgreSQL. Todo el proceso está contenerizado con Docker.

## 📋 Requisitos

- **Docker Desktop** (debe estar en ejecución).
- **Git Bash** (o cualquier terminal compatible con scripts `.sh` en Windows/Linux/Mac).

## 🚀 Cómo ejecutar

### Opción 1: Script Automático (Recomendado)

La forma más sencilla de ejecutar el proyecto es utilizando los scripts automáticos. Estos levantan el entorno, esperan a que termine la migración y abren la herramienta de visualización.

**Para Windows (PowerShell):**

1. Abre PowerShell en la carpeta del proyecto.
2. Ejecuta:

   ```powershell
   ./start.ps1
   ```

   _Nota: Si tienes problemas de permisos, ejecuta primero `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`._

   **Opcional: Omitir Scraping**
   Si ya tienes datos descargados y quieres evitar saturar la página de Doctoralia, usa:

   ```powershell
   ./start.ps1 -SkipScraping
   ```

**Para Linux / Mac:**

1. Dale permisos de ejecución al script:
   ```bash
   chmod +x start.sh
   ```
2. Ejecuta:

   ```bash
   ./start.sh
   ```

   **Opcional: Omitir Scraping**
   Para usar datos cacheados y evitar peticiones innecesarias:

   ```bash
   ./start.sh --skip-scraping
   ```

   > [!TIP]
   > **Tiempos de Ejecución Estimados:**
   >
   > - **Con Scraping:** ~5-7 minutos (dependiendo de la red y configuración).
   > - **Sin Scraping (Skip):** ~0.15 segundos (carga instantánea de datos cacheados).

**¿Qué hacen estos scripts?**

1. Levantan los contenedores de Docker (Base de datos, Aplicación, Prisma Studio).
2. Esperan a que termine el proceso de scraping (o carga de datos) y generación de datos.
3. Abren **Prisma Studio** en tu navegador predeterminado.

### Opción 2: Docker Compose Manual

Si prefieres ejecutar los comandos de Docker directamente:

1. Levanta los servicios (y construye las imágenes si es necesario):

   ```bash
   docker-compose up -d --build
   ```

2. (Opcional) Ver el progreso en los logs:

   ```bash
   docker-compose logs -f app
   ```

3. Una vez finalizado, abre tu navegador en:
   [http://localhost:5555](http://localhost:5555)

## ⚙️ Configuración

El comportamiento del sistema se puede ajustar en el archivo `.env` (o modificando `docker-compose.yml`):

- **PostgreSQL**: Motor de base de datos (versión 16).
- **Docker**: Para orquestar todos los servicios en un entorno aislado.

| Variable                       | Descripción                                     | Valor por defecto                 |
| ------------------------------ | ----------------------------------------------- | --------------------------------- |
| `SCRAPING_CITIES`              | Lista de ciudades a buscar (separadas por coma) | `Lima,Bogotá,Madrid`              |
| `SCRAPING_SPECIALTIES`         | Lista de especialidades a buscar                | `Cardiólogo,Dermatólogo,Pediatra` |
| `PATIENTS_COUNT`               | Cantidad de pacientes falsos a generar          | `200`                             |
| `APPOINTMENTS_COUNT`           | Cantidad de citas a generar                     | `1000`                            |
| `MAX_SERVICES_COUNT`           | Máximo de servicios a extraer por doctor        | `5`                               |
| `MAX_AVAILABILITY_SLOTS_COUNT` | Máximo de horarios a extraer por doctor         | `5`                               |
| `MAX_DOCTORS_PER_SEARCH`       | Máximo de doctores a extraer por búsqueda       | `2`                               |

> [!NOTE]
> Estas configuraciones permiten un **uso controlado** de los recursos y evitan saturar la página de Doctoralia. Se recomienda mantener valores bajos durante el desarrollo y pruebas para ser conscientes con el servidor destino.

## 📂 Estructura del Proyecto

- `src/scrapers`: Lógica de extracción de datos de Doctoralia.
- `src/generators`: Lógica de generación de datos falsos (pacientes).
- `src/services`: Servicio de base de datos y lógica de llenado (seeding).
- `prisma/schema.prisma`: Definición del esquema de la base de datos.
- `docker-compose.yml`: Definición de los servicios de Docker.

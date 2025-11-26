# Migración de Datos de Doctoralia

Este proyecto automatiza la extracción de datos de doctores de Doctoralia, genera datos falsos de pacientes y citas, y puebla una base de datos PostgreSQL. Todo el proceso está contenerizado con Docker.

## 📋 Requisitos

- **Docker Desktop** (debe estar en ejecución).
- **Git Bash** (o cualquier terminal compatible con scripts `.sh` en Windows/Linux/Mac).

## 🚀 Cómo ejecutar

### Opción 1: Script Automático (Recomendado)

La forma más sencilla de ejecutar el proyecto es utilizando el script `start.sh`. Este script levanta el entorno, espera a que termine la migración y abre la herramienta de visualización automáticamente.

Ejecuta el siguiente comando en la raíz del proyecto:

```bash
./start.sh
```

**¿Qué hace este script?**

1. Levanta los contenedores de Docker (Base de datos, Aplicación, Prisma Studio).
2. Abre **Prisma Studio** en tu navegador predeterminado.

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

| Variable               | Descripción                                     | Valor por defecto                 |
| ---------------------- | ----------------------------------------------- | --------------------------------- |
| `SCRAPING_CITIES`      | Lista de ciudades a buscar (separadas por coma) | `Lima,Bogotá,Madrid`              |
| `SCRAPING_SPECIALTIES` | Lista de especialidades a buscar                | `Cardiólogo,Dermatólogo,Pediatra` |
| `PATIENTS_COUNT`       | Cantidad de pacientes falsos a generar          | `200`                             |
| `APPOINTMENTS_COUNT`   | Cantidad de citas a generar                     | `1000`                            |

## 🛠️ Tecnologías Utilizadas

- **Puppeteer**: Para el web scraping de perfiles de doctores en Doctoralia.
- **Faker.js**: Para generar datos realistas de pacientes y citas.
- **Prisma ORM**: Para la gestión del esquema de base de datos y migraciones.
- **PostgreSQL**: Motor de base de datos (versión 16).
- **Docker**: Para orquestar todos los servicios en un entorno aislado.

## 📂 Estructura del Proyecto

- `src/scrapers`: Lógica de extracción de datos de Doctoralia.
- `src/generators`: Lógica de generación de datos falsos (pacientes).
- `src/services`: Servicio de base de datos y lógica de llenado (seeding).
- `prisma/schema.prisma`: Definición del esquema de la base de datos.
- `docker-compose.yml`: Definición de los servicios de Docker.

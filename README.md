# 🏥 Doctoralia ETL Migration

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
![Puppeteer](https://img.shields.io/badge/Puppeteer-40B5A4?style=flat-square&logo=puppeteer&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)
![Plimit](https://img.shields.io/badge/Plimit-FF5733?style=flat-square&logo=none&logoColor=white)
![Faker.js](https://img.shields.io/badge/Faker.js-FFB300?style=flat-square&logo=javascript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white)

Solución automatizada de **Scraping, Transformación y Carga (ETL)** diseñada para extraer datos de Doctoralia y migrarlos a PostgreSQL. El sistema prioriza la robustez, el tipado estático y el despliegue contenerizado.

---

## 🚀 Quick Start (En menos de 1 min)

**Requisitos:** Docker Desktop, Git y Terminal.

### 1. Configuración Inicial

Crea tu archivo de entorno (ya pre-configurado para funcionar _out-of-the-box_):

```bash
cp .env.example .env
```

### 2. Ejecución Automática ("One-Click")

Este script levanta los servicios, ejecuta el pipeline completo de ETL y abre la visualización de datos.

⏱️ **Tiempo de Ejecución:** ~2 a 3 minutos (gracias a la concurrencia paralela de tareas)

| OS                       | Comando Estándar                  |
| :----------------------- | :-------------------------------- |
| **Windows (PowerShell)** | `./start.ps1`                     |
| **Linux / Mac**          | `chmod +x start.sh && ./start.sh` |

> [!TIP]
> **Windows:** Si tienes problemas de permisos, ejecuta primero:
> `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

> **⚡ Opcional: Saltar Scraping (Uso de Caché)**
> Si ya tienes datos descargados o quieres ahorrar tiempo evitando peticiones a Doctoralia:
>
> ```bash
> # Windows
> ./start.ps1 -SkipScraping
>
> # Linux / Mac
> ./start.sh --skip-scraping
> ```

### 3. Resultados

Una vez completado el proceso (~2-3 minutos con scraping, ~15 segundos sin scraping), accede al visualizador de datos (Prisma Studio) en: http://localhost:5555

---

## 🧠 Filosofía de Diseño

- **TypeScript Monorepo**: Un solo lenguaje para Scraping, Scripting y ORM. Garantiza coherencia de tipos y evita el cambio de contexto entre lenguajes.
- **Enfoque Pragmático (No NestJS)**: Al ser un proceso ETL (batch) y no un servicio REST persistente, se evitó la sobreingeniería de un framework web completo en favor de una arquitectura modular ligera.
- **Ingeniería de Software**: Incluye Linter (ESLint), Formatter (Prettier), Hooks (Husky) y Tests (Vitest) para asegurar calidad profesional.

> 📘 **¿Quieres profundizar más?**
> Consulta la [Documentación Técnica Detallada](./TECHNICAL_DETAILS.md) para ver diagramas, explicación del pipeline, estructura de carpetas y decisiones de arquitectura a fondo.

---

## 🔄 Pipeline de Migración

El sistema ejecuta un proceso ETL secuencial:

1.  **Extracción (Scraping)**: Puppeteer navega Doctoralia buscando doctores por especialidad y ciudad.
2.  **Transformación**: Se limpian y normalizan los datos (precios, direcciones, teléfonos). Si falla el scraping, se generan datos sintéticos con Faker.js.
3.  **Carga (Seeding)**: Prisma inserta los datos relacionales (Doctores, Pacientes, Citas) en PostgreSQL.

---

## ⚙️ Configuración (.env)

El comportamiento del scraper y generador es totalmente personalizable.

| Variable                 | Descripción                       | Default (Safe)         |
| :----------------------- | :-------------------------------- | :--------------------- |
| `SCRAPING_CITIES`        | Objetivos de búsqueda (CSV)       | Lima,Bogotá,Madrid     |
| `SCRAPING_SPECIALTIES`   | Especialidades a buscar           | Cardiólogo,Dermatólogo |
| `SCRAPING_CONCURRENCY`   | Tareas paralelas (1-10)           | 3                      |
| `MAX_DOCTORS_PER_SEARCH` | Límite de doctores por ciudad     | 3                      |
| `MAX_SERVICES_COUNT`     | Servicios a extraer por doctor    | 5                      |
| `MAX_AVAILABILITY_SLOTS` | Horarios a extraer                | 5                      |
| `PATIENTS_COUNT`         | Pacientes sintéticos a generar    | 200                    |
| `APPOINTMENTS_COUNT`     | Citas aleatorias a crear          | 1000                   |
| `SCRAPING_DELAY_MS`      | Pausa entre peticiones (Anti-ban) | 1500                   |

> [!IMPORTANT]
> **Ética de Scraping:** Los valores por defecto (`MAX_DOCTORS_PER_SEARCH=3`) son bajos intencionalmente para realizar la prueba técnica sin saturar los servidores de Doctoralia.

---

## 🛠️ Scripts de Desarrollo

Comandos definidos en `package.json` para el ciclo de vida de la aplicación.

| Script          | Comando                  | Acción                                     |
| :-------------- | :----------------------- | :----------------------------------------- |
| `start`         | `pnpm start`             | Ejecuta el pipeline principal (Main).      |
| `generate:data` | `pnpm run generate:data` | Ejecuta solo el scraping (`doctors.json`). |
| `build`         | `pnpm run build`         | Compila TypeScript a JavaScript.           |
| `lint`          | `pnpm run lint`          | Análisis estático de código (ESLint).      |
| `format`        | `pnpm run format`        | Formateo automático (Prettier).            |
| `test`          | `pnpm run test`          | Ejecuta suite de pruebas (Vitest).         |

> ⏱️ **Tiempos Estimados de Ejecución:**
>
> | Escenario                | Tiempo Estimado |
> | :----------------------- | :-------------- |
> | **Build + Scraping**     | 2 - 4 min       |
> | **Rebuild + Scraping**   | 1 - 2 min       |
> | **Build + Cache Data**   | 1 - 2 min       |
> | **Rebuild + Cache Data** | 0.1 - 0.5 seg   |
>
> 💡 **Optimizaciones Implementadas:**
>
> - **Concurrencia Paralela en Scraping** (`SCRAPING_CONCURRENCY=3`): Procesa múltiples ciudades/especialidades simultáneamente, reduciendo el tiempo en **60-70%** vs. enfoque secuencial (~5 minutos).
> - **Paralelismo en Seeding**: Generación de pacientes + inserción de doctores en paralelo, ahorrando **~500ms**.
> - **Operaciones Batch**: Inserciones masivas de pacientes (200→1 query) y citas (1000→1 query), ahorrando **~9 segundos**.
> - **Database Indexes**: Índices optimizados en columnas clave (city, specialty, rating) para queries más rápidas.
> - **Event-Driven Waits**: Reemplazo de delays fijos en Puppeteer por esperas inteligentes, ahorrando **~30-150 segundos**.

### 🐳 Ejecución dentro de Docker (Recomendado)

Para asegurar consistencia de dependencias, ejecuta los scripts usando el contenedor:

```bash
# Ejemplo: Ejecutar scraping manualmente
docker-compose run --rm app pnpm run generate:data

# Ejemplo: Correr Tests Unitarios
docker-compose run --rm app pnpm test
```

---

## ⚠️ Limitaciones y Notas

- **Persistencia**: La DB usa un volumen Docker; eliminarlo borrará los datos relacionales (pero `data/doctors.json` persiste).
- **Rate Limiting**: El scraper incluye retardos aleatorios para simular comportamiento humano.
- **Puertos**: Asegúrate que los puertos `5432` y `5555` estén libres.

---

### Anthoni Portocarrero Rodriguez

[LinkedIn](https://www.linkedin.com/in/anthoni-portotocarrero-rodriguez-06089119a) | [Website](https://www.anthonidev.site)

# ============================================
# Stage 1: Base - Puppeteer Dependencies
# ============================================
FROM node:22-slim AS base

# Install Puppeteer dependencies (deduplicated and optimized)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    chromium \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    procps \
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# ============================================
# Stage 2: Dependencies - Install Node packages
# ============================================
FROM base AS dependencies

# Install pnpm globally
RUN npm install -g pnpm@latest

WORKDIR /app

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml ./

# Install dependencies with cache mount for faster rebuilds
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline

# ============================================
# Stage 3: Builder - Generate Prisma Client
# ============================================
FROM dependencies AS builder

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN pnpm prisma generate

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Optional: Build TypeScript (if needed for production)
# RUN pnpm run build

# ============================================
# Stage 4: Runtime - Final production image
# ============================================
FROM base AS runtime

# Create non-root user for security with home directory
RUN groupadd -r appuser && useradd -r -g appuser -m -d /home/appuser appuser

WORKDIR /app

# Install only pnpm (needed for running the app)
RUN npm install -g pnpm@latest

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy node_modules from builder (includes all deps + generated Prisma Client)
COPY --from=builder /app/node_modules ./node_modules

# Copy source code and Prisma schema
COPY src ./src
COPY prisma ./prisma
COPY tsconfig.json ./

# Create data directory for output and set permissions
RUN mkdir -p /app/data /home/appuser/.local/share/pnpm && \
    chown -R appuser:appuser /app /home/appuser

# Switch to non-root user
USER appuser

# Set Puppeteer cache directory
ENV PUPPETEER_CACHE_DIR=/app/.cache

CMD ["pnpm", "start"]

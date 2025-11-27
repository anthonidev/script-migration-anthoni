# ============================================
# Stage 1: Base - Puppeteer Dependencies
# ============================================
FROM node:22-slim AS base

ENV PUPPETEER_CACHE_DIR=/app/.cache

# Install system dependencies for Puppeteer
# EXACT list from the working single-stage Dockerfile
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
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
    lsb-release \
    xdg-utils \
    chromium \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# ============================================
# Stage 2: Dependencies - Install Node packages
# ============================================
FROM base AS dependencies

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml ./

# Configure pnpm to use hoisted linker
# This creates a flat node_modules structure (like npm) without symlinks to a global store
# ensuring it is safe to copy between stages
RUN pnpm config set node-linker hoisted

# Install dependencies
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 3: Runtime - Final production image
# ============================================
FROM base AS runtime

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma Client in runtime stage
RUN pnpm prisma generate

CMD ["pnpm", "start"]
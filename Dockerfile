# Minimal Node.js Alpine image (~50MB base)
FROM node:20-alpine

# Install dependencies for native modules (sharp, libsignal) and fonts for PDF
RUN apk add --no-cache python3 make g++ vips-dev font-noto

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy application code
COPY . .

# Remove dev/test files to keep image small
RUN rm -rf cleaner/ .git/ *.md

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Ensure data directories exist and are owned by nodejs user
RUN mkdir -p /app/auth_info_baileys /app/data && \
    chown -R nodejs:nodejs /app

USER nodejs

# Health check - ensure process is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD pgrep -x node || exit 1

CMD ["node", "index.js"]

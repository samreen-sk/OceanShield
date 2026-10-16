# OceanShield Backend Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Install build dependencies if needed
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Create uploads directory and set permissions
RUN mkdir -p uploads && chown -R node:node uploads

# Run as non-root user
USER node

# Expose API port
EXPOSE 5000

# Environment defaults
ENV NODE_ENV=production
ENV PORT=5000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200 && r.statusCode !== 503) process.exit(1)});"

# Start application server
CMD ["node", "src/server.js"]

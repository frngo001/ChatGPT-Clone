# Multi-stage build for React application
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm and dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create environment file for runtime configuration
RUN echo '#!/bin/sh' > /docker-entrypoint.d/30-envsubst-on-templates.sh && \
    echo 'envsubst < /etc/nginx/nginx.conf > /tmp/nginx.conf && mv /tmp/nginx.conf /etc/nginx/nginx.conf' >> /docker-entrypoint.d/30-envsubst-on-templates.sh && \
    chmod +x /docker-entrypoint.d/30-envsubst-on-templates.sh

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

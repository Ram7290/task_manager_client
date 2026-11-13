# ==========================================
# Stage 1: Build the React Application
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install clean dependencies
RUN npm ci

# Dynamic build-time environment variable for backend API URL
# Allows setting VITE_API_URL via --build-arg without hardcoding
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy application source code
COPY . .

# Build production assets (outputs to /app/dist)
RUN npm run build

# ==========================================
# Stage 2: Serve Production Assets with Nginx
# ==========================================
FROM nginx:1.27-alpine AS production

# Remove default Nginx welcome assets
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration supporting SPA client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled production artifacts from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# The frontend container listens on port 80
EXPOSE 80

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]

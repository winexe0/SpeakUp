# Stage 1: Build the React application using Vite
FROM node:24-alpine as build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application files and build
COPY . .
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Copy the custom nginx configuration for the API proxy and SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build output to Nginx's static file serving directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

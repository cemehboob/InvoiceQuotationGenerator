# Step 1: Build React App with Vite
FROM node:20-alpine AS build
WORKDIR /app

# Copy dependency specifications
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps || npm install

# Copy source code and build production bundle
COPY . .
RUN npm run build

# Step 2: Serve using Nginx Alpine
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]


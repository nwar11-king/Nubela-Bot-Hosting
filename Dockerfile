# Use Node.js 22 as the base image
FROM node:22

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the frontend (Vite)
RUN npm run build

# Expose port 3000 (platform standard)
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Use npx to ensure we find tsx even if something is weird with the PATH
CMD ["npx", "tsx", "server.ts"]

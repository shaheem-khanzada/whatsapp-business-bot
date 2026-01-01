# Use official Node.js image
FROM node:20-slim AS base

# Install git (required for some npm packages)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install dependencies (including devDependencies for TypeScript)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code and config files
COPY tsconfig.json ./
COPY src ./src

# Build the project
RUN npm run build

# Expose port (adjust if needed)
EXPOSE 3000

# Run the compiled application
CMD ["npm", "start"]


# Use Debian slim instead of Alpine for glibc compatibility
FROM node:22-slim

# Set working directory inside container
WORKDIR /app

# Copy package files first (for dependency caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your source code
COPY . .

# Install ts-node globally if you want to run TypeScript directly
RUN npm install -g ts-node

# Default command to run your bot
CMD ["ts-node", "index.ts"]

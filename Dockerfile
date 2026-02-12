# Use Debian slim instead of Alpine
FROM node:22-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# If you want to run TS directly:
RUN npm install -g ts-node

# Run your bot
CMD ["ts-node", "index.ts"]

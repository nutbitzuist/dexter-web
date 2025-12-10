FROM node:20-slim

WORKDIR /app

# Install Bun
RUN npm install -g bun

# Copy package files
COPY package.json bun.lock ./

# Install dependencies (PRODUCTION ONLY)
# This will skip ink, react, and other heavy CLI deps
ENV NODE_ENV=production
RUN bun install --production

# Copy source
COPY src ./src
COPY tsconfig.json ./

# Environment
ENV PORT=3000
EXPOSE 3000

# Start
CMD ["bun", "run", "src/server.ts"]

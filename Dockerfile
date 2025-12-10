FROM oven/bun:1

WORKDIR /app

# Copy dependency files
COPY package.json bun.lock ./

# Install dependencies (frozen lockfile for speed)
RUN bun install --frozen-lockfile

# Copy source code (respecting .dockerignore)
COPY src ./src
COPY tsconfig.json ./

# Build explicit (optional with Bun but good for checking)
# RUN bun run build 

ENV PORT=3000
EXPOSE 3000

CMD ["bun", "run", "src/server.ts"]

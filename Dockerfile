FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
COPY legacy/package.json legacy/bun.lock ./legacy/

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start server
CMD ["bun", "run", "api"]

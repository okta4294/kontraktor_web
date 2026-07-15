FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb* ./
RUN bun install --production

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Start the application
CMD ["bun", "run", "src/index.ts"]

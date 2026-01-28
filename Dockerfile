############################
# Stage 1 – Build frontend #
############################
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy rest of the project and build
COPY . .

# Build TypeScript + Vite frontend
RUN npm run build


########################################
# Stage 2 – Production runtime (Node)  #
########################################
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy only what is needed for runtime
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built frontend and server code from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# The app listens on 3005 (see server/index.js)
EXPOSE 3005

# Start the Express server (serves API + dist)
CMD ["node", "server/index.js"]


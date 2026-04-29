FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS production

RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/app/data

EXPOSE 3001

CMD ["node", "dist/index.js"]

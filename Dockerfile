# Stage 1: Build Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Python Backend
FROM python:3.12-slim
WORKDIR /app/server

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY server/ .

# Copy built frontend from Stage 1 into /app/dist
COPY --from=frontend-builder /app/dist /app/dist

ENV PORT=8001
ENV ENV=production

EXPOSE 8001

CMD ["python", "main.py"]

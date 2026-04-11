#!/bin/sh
set -e

echo "Chat Service starting..."
echo "Waiting for dependencies to be ready..."

# 1. Đợi MongoDB (Cổng 27017)
echo "Waiting for MongoDB (mongodb:27017)..."
until nc -z mongodb 27017; do
  echo "Attempt: MongoDB not ready, waiting 2s..."
  sleep 2
done
echo "MongoDB is ready!"

# 2. Đợi Redis (Cổng 6379)
echo "Waiting for Redis (redis:6379)..."
until nc -z redis 6379; do
  echo "Attempt: Redis not ready, waiting 2s..."
  sleep 2
done
echo "Redis is ready!"

echo "All dependencies are ready. Starting Chat Service..."
exec node index.js
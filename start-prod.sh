#!/bin/bash
set -e

docker-compose -f docker-compose.prod.no-nginx.yml down
# docker volume rm restaurant_postgres_data

# Проверяем и создаем необходимые директории
mkdir -p backend/uploads

echo "Запускаем Docker Compose в продакшн-режиме без Nginx..."
echo "Бэкенд будет доступен по адресу: http://localhost:8000"
echo "Фронтенд будет доступен по адресу: http://localhost:3000"

# Запускаем Docker Compose с существующим конфигом
docker-compose -f docker-compose.prod.no-nginx.yml up -d --build

echo "Сервисы запущены в фоновом режиме."
echo "Для просмотра логов используйте: docker-compose -f docker-compose.prod.no-nginx.yml logs -f"
echo "Для остановки сервисов используйте: docker-compose -f docker-compose.prod.no-nginx.yml down"

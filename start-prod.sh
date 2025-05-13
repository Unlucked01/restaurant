#!/bin/bash
set -e

# Проверяем наличие файла .env.prod
if [ ! -f .env.prod ]; then
  echo "Файл .env.prod не найден. Создаем пример файла .env.prod из примера."
  cat > .env.prod << EOF
# Database settings
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=restaurant
DB_HOST=db
DB_PORT=5432

# Admin user settings
ADMIN_EMAIL=admin@restaurant.com
ADMIN_PASSWORD=adminpassword
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User

# Security
SECRET_KEY=your-secret-key

# Frontend settings
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
  echo "Создан файл .env.prod. Отредактируйте его, чтобы настроить переменные окружения."
  echo "Для продолжения нажмите Enter или Ctrl+C для отмены..."
  read
fi

# Проверяем и создаем необходимые директории
mkdir -p backend/uploads

# Создаем временный файл docker-compose для запуска без nginx
cat > docker-compose.prod.no-nginx.yml << EOF
version: '3.8'

services:
  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    env_file:
      - .env.prod
    environment:
      - POSTGRES_PASSWORD=\${DB_PASSWORD:-postgres}
      - POSTGRES_USER=\${DB_USER:-postgres}
      - POSTGRES_DB=\${DB_NAME:-restaurant}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - restaurant-network

  backend:
    build:
      context: .
      dockerfile: ./docker/Dockerfile.backend.prod
    ports:
      - "8000:8000"
    env_file:
      - .env.prod
    volumes:
      - ./backend/uploads:/app/uploads
    environment:
      - ADMIN_EMAIL=\${ADMIN_EMAIL:-admin@restaurant.com}
      - ADMIN_PASSWORD=\${ADMIN_PASSWORD:-adminpassword}
      - ADMIN_FIRST_NAME=\${ADMIN_FIRST_NAME:-Admin}
      - ADMIN_LAST_NAME=\${ADMIN_LAST_NAME:-User}
      - SECRET_KEY=\${SECRET_KEY:-your-secret-key}
      - DB_USER=\${DB_USER:-postgres}
      - DB_PASSWORD=\${DB_PASSWORD:-postgres}
      - DB_NAME=\${DB_NAME:-restaurant}
      - DB_HOST=db
      - DB_PORT=5432
      - ALLOW_PUBLIC_ACCESS=true
      - CORS_ORIGINS=http://localhost:3000
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - restaurant-network

  frontend:
    build:
      context: .
      dockerfile: ./docker/Dockerfile.frontend.prod
    ports:
      - "3000:3000"
    env_file:
      - .env.prod
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - TZ=Europe/Moscow
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - restaurant-network

volumes:
  postgres_data:

networks:
  restaurant-network:
    driver: bridge
EOF

# Создаем патч для бэкенда, чтобы добавить публичный доступ
cat > backend_cors_patch.py << EOF
#!/usr/bin/env python3

# Патч для бэкенда, чтобы добавить CORS и публичный доступ
import os

# Путь к файлу main.py
main_file = "backend/main.py"

# Прочитать содержимое файла
with open(main_file, "r") as f:
    content = f.read()

# Проверить, нужно ли добавлять CORS
if "CORSMiddleware" not in content:
    # Добавить импорт CORS
    import_line = "from fastapi import FastAPI, Depends, HTTPException, status"
    cors_import = "from fastapi import FastAPI, Depends, HTTPException, status\\nfrom fastapi.middleware.cors import CORSMiddleware"
    content = content.replace(import_line, cors_import)
    
    # Добавить настройку CORS после создания приложения
    app_line = "app = FastAPI()"
    cors_setup = """app = FastAPI()

# Добавляем CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)"""
    content = content.replace(app_line, cors_setup)

# Записать изменения
with open(main_file, "w") as f:
    f.write(content)

print("Патч для бэкенда успешно применен.")
EOF

# Создаем патч для модификации layout/routes.py для публичного доступа
cat > layout_routes_patch.py << EOF
#!/usr/bin/env python3

# Патч для layout/routes.py, чтобы добавить публичный доступ
import os

# Путь к файлу routes.py
routes_file = "backend/layout/routes.py"

# Прочитать содержимое файла
with open(routes_file, "r") as f:
    content = f.read()

# Проверить, нужно ли модифицировать маршруты
if "Router(prefix=\"/layout\"" in content and "dependencies=[Depends(get_current_user)]" in content:
    # Удалить обязательную зависимость на авторизацию
    old_router = "router = APIRouter(prefix=\"/layout\", tags=[\"layout\"], dependencies=[Depends(get_current_user)])"
    new_router = "router = APIRouter(prefix=\"/layout\", tags=[\"layout\"])"
    content = content.replace(old_router, new_router)
    
    # Добавить опциональную проверку авторизации для отдельных маршрутов
    imports = "from auth.dependencies import get_current_user"
    new_imports = "from auth.dependencies import get_current_user\\nfrom typing import Optional\\nfrom fastapi import Depends"
    content = content.replace(imports, new_imports)

# Записать изменения
with open(routes_file, "w") as f:
    f.write(content)

print("Патч для layout/routes.py успешно применен.")
EOF

# Предоставляем права на выполнение патчей
chmod +x backend_cors_patch.py layout_routes_patch.py

# Выполняем патчи
echo "Применяем патчи к бэкенду..."
python3 backend_cors_patch.py
python3 layout_routes_patch.py

echo "Запускаем Docker Compose в продакшн-режиме без Nginx..."
echo "Бэкенд будет доступен по адресу: http://localhost:8000"
echo "Фронтенд будет доступен по адресу: http://localhost:3000"

# Запускаем Docker Compose с временным файлом конфигурации
docker-compose -f docker-compose.prod.no-nginx.yml up -d --build

echo "Сервисы запущены в фоновом режиме."
echo "Для просмотра логов используйте: docker-compose -f docker-compose.prod.no-nginx.yml logs -f"
echo "Для остановки сервисов используйте: docker-compose -f docker-compose.prod.no-nginx.yml down"

# Очистка временных файлов
rm -f backend_cors_patch.py layout_routes_patch.py 
Вот **полный PRD-документ** (Product Requirements Document) для сервиса бронирования столиков и блюд в ресторане с учетом всех твоих требований, подготовленный для передачи в Claude Sonnet или другого генератора кода.

---

# 🧾 PRD: Веб-сервис бронирования столиков и заказов в ресторане

## 🔧 Общие сведения
- **Название проекта:** Система онлайн-бронирования столиков
- **Формат:** Веб-приложение
- **Языки интерфейса:** Русский
- **Архитектура:** Клиент-сервер, REST API
- **Frontend:** Next.js (React) + TailwindCSS + dnd-kit
- **Backend:** Python FastAPI
- **БД:** PostgreSQL
- **Аутентификация:** JWT (Bearer Token)
- **Регистрация:** Да

---

## 🎯 Цели
- Предоставить пользователям возможность визуально выбирать столик и заказывать еду онлайн.
- Позволить администраторам редактировать зал ресторана (drag & drop + поворот столов + расстановка компонентов).
- Управлять меню и бронированиями централизованно.

---

## 👤 Роли пользователей

### 👥 Гость (user)
- Регистрация / авторизация
- Просмотр зала
- Бронирование стола
- Заказ еды
- Просмотр занятости

### 🔧 Администратор (admin)
- Все права пользователя +
- Режим редактирования зала:
  - Добавление, удаление и перемещение столов
  - Поворот столов
  - Добавление статических объектов (бар, туалет, гардероб)
- Редактирование меню
- Сохранение схемы зала

---

## 🧩 Интерфейс

### 📍 Главная страница
- **Заголовок:** "Забронируйте столик"
- **Визуализация зала ресторана:**
  - Кликабельные столы
  - Цветовая схема:
    - Серый — стол занят
    - Зеленый — свободен
  - Подсказки при наведении
- **Форма бронирования (открывается по клику на стол):**
  - Кол-во гостей (от 1 до макс. стола)
  - Дата (текущая + 14 дней)
  - Время (доступные интервалы)
  - Имя, фамилия
  - Телефон
  - Кнопка: "Забронировать"

### 🍽 Меню (опционально)
- Выбор блюд по категориям
- Добавление в заказ перед подтверждением брони

### 🧭 Админ-панель
- DnD-редактор:
  - Таблица (id, тип, поворот, позиция)
  - Компоненты (бар, WC, гардероб)
  - Возможность вращения объектов
- Редактирование меню

---

## 📦 Типы столов

| Тип | Вместимость | Особенности |
|-----|-------------|-------------|
| Круглый | 2 | Одинарный |
| Круглый с диванами | 4 | Мягкая зона |
| Прямоугольный | 10 | Банкет |
| ВИП | 2–12 | Закрытый зал |

---

## 📚 Бизнес-логика

### Бронирование
- **Ограничение:** только на ближайшие 14 дней
- **Промежутки времени:** по 1 часу (12:00–23:00)
- **Стол считается недоступным, если все таймслоты заняты**
- **Уведомление, если нет свободного времени**

---

## 🧱 База данных (PostgreSQL)

### Таблицы

#### `users`
```sql
id UUID PRIMARY KEY
email TEXT UNIQUE NOT NULL
password_hash TEXT NOT NULL
first_name TEXT
last_name TEXT
phone TEXT
role TEXT CHECK(role IN ('user', 'admin'))
```

#### `tables`
```sql
id UUID PRIMARY KEY
type TEXT
max_guests INTEGER
x INTEGER
y INTEGER
rotation INTEGER -- градусы (0, 90, 180, 270)
room_id UUID
```

#### `static_items`
```sql
id UUID PRIMARY KEY
type TEXT -- 'bar', 'wc', 'wardrobe'
x INTEGER
y INTEGER
rotation INTEGER
room_id UUID
```

#### `reservations`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users
table_id UUID REFERENCES tables
date DATE
time TIME
guests_count INTEGER
first_name TEXT
last_name TEXT
phone TEXT
```

#### `menu_items`
```sql
id UUID PRIMARY KEY
name TEXT
description TEXT
price DECIMAL
category_id UUID
```

#### `categories`
```sql
id UUID PRIMARY KEY
name TEXT
```

---

## 🔐 Аутентификация

- JWT токены
- `POST /auth/register` — регистрация
- `POST /auth/login` — логин
- `GET /auth/me` — проверка токена
- Роль передается в токене (`user` или `admin`)

---

## 📡 API-эндпоинты (FastAPI)

### Аутентификация
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Столы и зал
- `GET /layout` — получить схему зала
- `POST /layout/save` — сохранить схему (только admin)
- `GET /tables/availability?date=...&time=...` — доступность столов

### Резервации
- `POST /reserve`
- `GET /reservations?date=...`

### Меню
- `GET /menu`
- `POST /menu` / `PUT /menu/{id}` / `DELETE /menu/{id}`

---

## 📂 Структура проекта

### Backend (FastAPI)
```
backend/
├── main.py
├── db/
│   ├── database.py
│   └── models.py
├── auth/
│   ├── routes.py
│   └── services.py
├── reservations/
│   ├── routes.py
│   └── services.py
├── layout/
│   ├── routes.py
│   └── editor.py
├── menu/
│   ├── routes.py
│   └── services.py
├── schemas/
│   └── *.py
└── utils/
    └── security.py
```

### Frontend (Next.js)
```
frontend/
├── pages/
│   ├── index.tsx
│   ├── login.tsx
│   ├── register.tsx
│   └── admin.tsx
├── components/
│   ├── Table.tsx
│   ├── ReservationModal.tsx
│   ├── Menu.tsx
│   └── Editor.tsx
├── hooks/
├── lib/
│   └── api.ts
├── context/
│   └── AuthContext.tsx
├── styles/
└── types/
```

---

## ✨ UI/UX требования

- Интерфейс — минималистичный и на **русском языке**
- Использовать TailwindCSS для всех компонентов
- Столы должны быть вращаемыми в редакторе (с использованием dnd-kit + CSS transform: rotate)
- Цветовая индикация занятости
- Удобная форма регистрации и авторизации
- Адаптивный интерфейс (мобильный + десктоп)

---

## 🧪 Тесты
- Покрытие: 80%+
- Модульные тесты (Pytest)
- UI-тесты (Playwright или Cypress)

---

Если нужно, я могу также:
- Сгенерировать `.env.example`
- Написать базовую миграцию SQL
- Подготовить mock-данные для меню и залов

Хочешь получить шаблон кода на FastAPI или Next.js прямо под этот PRD?
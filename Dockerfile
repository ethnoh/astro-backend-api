# 1) Базовый образ Node + Python
FROM node:18-bullseye

# 2) Устанавливаем python + pip + ttf шрифты
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# 3) Создаем рабочую директорию
WORKDIR /app

# 4) Копируем package.json (ускоряет билд)
COPY package*.json ./

# 5) Устанавливаем Node зависимости
RUN npm install

# 6) Копируем ВСЁ приложение в образ
COPY . .

# 7) Собираем Next.js
RUN npm run build

# 8) Стартуем Next.js сервер
CMD ["npm", "start"]

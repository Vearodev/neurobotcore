# Используем официальный образ Node.js с поддержкой TypeScript
FROM node

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем все файлы проекта в контейнер
COPY . .

# Компилируем TypeScript в JavaScript
RUN npm run build

# Указываем команду для запуска приложения
CMD ["npm", "start"]

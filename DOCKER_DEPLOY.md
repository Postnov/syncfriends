# Развертывание SyncFriends в Docker

## Требования

- Docker
- Docker Compose
- Git

## Инструкция по установке

### 1. Клонирование репозитория

```bash
git clone https://github.com/Postnov/syncfriends.git
cd syncfriends
```

### 2. Сборка и запуск Docker-контейнера

```bash
# Сборка и запуск контейнера в фоновом режиме
docker-compose up -d
```

После этих команд приложение будет доступно по адресу http://YOUR_SERVER_IP:3000

### 3. Проверка статуса контейнера

```bash
docker-compose ps
```

### 4. Просмотр логов

```bash
docker-compose logs -f
```

### 5. Остановка контейнера

```bash
docker-compose down
```

## Настройка Nginx в качестве обратного прокси (рекомендуется)

Для настройки Nginx как обратного прокси-сервера создайте файл конфигурации:

```bash
sudo nano /etc/nginx/sites-available/syncfriends
```

И добавьте следующую конфигурацию (замените your-domain.com на ваш домен):

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Создайте символическую ссылку и перезапустите Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/syncfriends /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Настройка SSL с Certbot (опционально)

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Обновление приложения

```bash
# Остановите текущий контейнер
docker-compose down

# Получите последние изменения из репозитория
git pull

# Пересоберите и запустите контейнер
docker-compose up -d --build
```

## Резервное копирование данных

Все данные приложения хранятся в директории `./data`. Вы можете создать резервную копию этой директории:

```bash
# Создание резервной копии
tar -czvf syncfriends-backup-$(date +%Y%m%d).tar.gz ./data

# Восстановление из резервной копии
tar -xzvf syncfriends-backup-20240601.tar.gz
```

## Устранение неполадок

### Контейнер не запускается

Проверьте логи:

```bash
docker-compose logs
```

### Проблемы с доступом к приложению

Убедитесь, что порт 3000 открыт в брандмауэре:

```bash
sudo ufw allow 3000
```

### Для более детальной диагностики

```bash
# Проверка работы контейнера
docker-compose ps

# Интерактивный вход в контейнер
docker-compose exec syncfriends sh
``` 
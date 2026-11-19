# Автодеплой на сервер

После настройки сайт обновляется сам:

```
git push в main  →  GitHub Actions  →  rsync по SSH  →  /var/www/thelastdisk  →  nginx отдаёт сайт
```

Процесс описан в `.github/workflows/deploy.yml`. Pipeline копирует на сервер только изменённые файлы
и удаляет файлы, которых больше нет в репозитории. `README.md`, `DEPLOY.md` и служебные папки git на сервер не попадают.

Настройка делается один раз и состоит из трёх шагов: подготовить сервер, создать ключ для деплоя и записать секреты в GitHub.
Команды ниже рассчитаны на Ubuntu или Debian. Вместо `SERVER` подставьте IP или домен сервера.

---

## 1. Подготовить сервер

Зайдите на сервер под root или пользователем с `sudo`.

**Поставить nginx и rsync, создать пользователя `deploy` и папку сайта:**

```bash
sudo apt update && sudo apt install -y nginx rsync
sudo adduser --disabled-password --gecos "" deploy
sudo mkdir -p /var/www/thelastdisk
sudo chown deploy:deploy /var/www/thelastdisk
```

Пользователь `deploy` нужен, чтобы ключ из GitHub давал доступ только к папке сайта, а не ко всему серверу.

**Настроить nginx.** Создайте файл `/etc/nginx/sites-available/thelastdisk`:

```nginx
server {
    listen 80;
    server_name example.com www.example.com;   # ваш домен; если домена нет — поставьте _

    root /var/www/thelastdisk;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # html, css и js браузер перепроверяет при каждом заходе, чтобы обновления были видны сразу
    location ~* \.(html|css|js)$ {
        add_header Cache-Control "no-cache";
    }

    # картинки и видео кэшируются на сутки
    location ~* \.(png|jpe?g|gif|svg|webp|mp4|woff2?)$ {
        expires 1d;
    }
}
```

**Включить сайт:**

```bash
sudo ln -s /etc/nginx/sites-available/thelastdisk /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default    # только если домена нет и сайт открывается по IP
sudo nginx -t && sudo systemctl reload nginx
```

Если включён файрвол ufw, откройте порты 80 и 443: `sudo ufw allow 'Nginx Full'`.

**HTTPS.** Когда домен уже указывает на сервер, сертификат Let's Encrypt ставится одной командой
(certbot сам поправит конфиг nginx и будет продлевать сертификат):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
```

---

## 2. Ключ для деплоя

Это отдельная пара SSH-ключей только для GitHub Actions. Ваш личный ключ для этого не используйте.

**Создать ключ на своём компьютере** (Git Bash или PowerShell):

```bash
ssh-keygen -t ed25519 -f ~/.ssh/nastyaCOL-deploy -N "" -C "github-actions-deploy"
```

Появятся два файла:
- `~/.ssh/nastyaCOL-deploy` — приватная часть, пойдёт в GitHub Secrets. Никуда больше её не копируйте и не кладите в папку проекта.
- `~/.ssh/nastyaCOL-deploy.pub` — публичная часть, пойдёт на сервер.

**Положить публичную часть на сервер.** Если вы заходите на сервер как root, хватит одной команды:

```bash
cat ~/.ssh/nastyaCOL-deploy.pub | ssh root@SERVER "mkdir -p /home/deploy/.ssh && cat >> /home/deploy/.ssh/authorized_keys && chown -R deploy:deploy /home/deploy/.ssh && chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys"
```

Если заходите под обычным пользователем с `sudo`, сделайте то же самое вручную на сервере:
откройте `sudo nano /home/deploy/.ssh/authorized_keys`, вставьте одной строкой содержимое `nastyaCOL-deploy.pub`,
затем выполните `sudo chown -R deploy:deploy /home/deploy/.ssh`, `sudo chmod 700 /home/deploy/.ssh`
и `sudo chmod 600 /home/deploy/.ssh/authorized_keys`.

**Проверить, что ключ работает.** Команда должна выполниться без запроса пароля:

```bash
ssh -i ~/.ssh/nastyaCOL-deploy deploy@SERVER "ls -la /var/www/thelastdisk"
```

---

## 3. Секреты в GitHub

В репозитории откройте **Settings → Secrets and variables → Actions → New repository secret** и создайте:

| Имя | Что вписать |
|---|---|
| `SSH_HOST` | IP или домен сервера |
| `SSH_USER` | `deploy` |
| `SSH_KEY` | всё содержимое файла `~/.ssh/nastyaCOL-deploy` (без `.pub`), включая строки `-----BEGIN…` и `-----END…` |
| `DEPLOY_PATH` | `/var/www/thelastdisk` |
| `SSH_PORT` | необязательно: только если SSH на сервере не на порту 22 |
| `SSH_KNOWN_HOSTS` | необязательно, см. ниже |

Скопировать приватный ключ в буфер обмена:
- в PowerShell: `Get-Content ~/.ssh/nastyaCOL-deploy -Raw | Set-Clipboard`
- в Git Bash: `cat ~/.ssh/nastyaCOL-deploy | clip`

**`SSH_KNOWN_HOSTS` (необязательно, но надёжнее).** Без него pipeline при каждом запуске заново узнаёт
отпечаток сервера и верит ему. Если записать отпечаток один раз, подмена сервера будет замечена.
Выполните на своём компьютере и вставьте весь вывод в секрет:

```bash
ssh-keyscan SERVER
```

---

## 4. Проверить

Сделайте `git push` в `main` или откройте вкладку **Actions → Deploy to server → Run workflow**.
Зелёная галочка означает, что сайт обновлён. Красный крестик — откройте запуск и посмотрите лог шага, на котором он упал.

## Как обновлять сайт дальше

```bash
git add .
git commit -m "что поменялось"
git push
```

Через полминуты изменения будут на сервере.

**Откатить неудачное изменение:** `git revert HEAD` и `git push`. На сервер уедет предыдущая версия.

## Если что-то не работает

| Ошибка в логе | Что делать |
|---|---|
| `Permission denied (publickey)` | Публичный ключ не попал в `/home/deploy/.ssh/authorized_keys` или в `SSH_KEY` скопирован не весь файл |
| `rsync: command not found` | На сервере нет rsync: `sudo apt install -y rsync` |
| `Permission denied` при записи файлов | Папка принадлежит не `deploy`: `sudo chown -R deploy:deploy /var/www/thelastdisk` |
| `DEPLOY_PATH='…' — так нельзя` | Секрет `DEPLOY_PATH` пустой или указывает не на папку сайта |
| `Host key verification failed` | Отпечаток сервера изменился (например, сервер переустановили). Обновите `SSH_KNOWN_HOSTS` |
| Деплой зелёный, а сайт старый | Обновите страницу с Ctrl+F5 и проверьте, что `root` в конфиге nginx совпадает с `DEPLOY_PATH` |

GitHub не принимает файлы больше 100 МБ. Видео для первого экрана лучше сжать до 10–20 МБ:
так и сайт будет грузиться быстрее.

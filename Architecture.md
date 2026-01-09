# StreamCore Architecture Documentation

## 1. Обзор проекта (Overview)

**StreamCore** — это модульное десктопное приложение для стримеров. Оно объединяет управление интеграциями (Twitch, YouTube) и предоставляет платформу для запуска сторонних плагинов (модулей).

**Ключевые особенности:**
* **Локальное исполнение:** Все данные и токены хранятся на ПК пользователя.
* **Модульность:** Расширение функционала через изолированные плагины.
* **Безопасность:** Строгая система прав (Permissions) для каждого модуля.
* **Кроссплатформенность:** Поддержка Twitch, YouTube и других сервисов через единый API.

---

## 2. Технологический стек (Tech Stack)

### Backend (Core & SDK)
* **Language:** Python 3.11+
* **Server Framework:** FastAPI (ASGI)
* **Real-time Communication:** python-socketio (WebSocket / Socket.io)
* **Process Management:** `subprocess` (для изоляции модулей)
* **Packaging:** Nuitka (компиляция в бинарный код)

### Frontend (Dashboard & Overlays)
* **Framework:** React 18+
* **Build Tool:** Vite
* **Styling:** Tailwind CSS
* **Icons:** Lucide React
* **API Client:** socket.io-client

### Distribution & CI/CD
* **Installer:** Inno Setup (Windows), DMG Canvas (macOS)
* **Updates:** GitHub Releases API
* **CI:** GitHub Actions

---

## 3. Структура проекта (Directory Structure)

```text
StreamCore/
├── main.py                   # Точка входа (Bootstrapper)
├── requirements.txt          # Python зависимости
├── static_dist/              # Собранный Frontend (генерируется автом.)
├── modules/                  # Пользовательские модули (runtime)
│   └── example_bot/
│       ├── manifest.json     # Конфигурация модуля
│       ├── backend.py        # Логика модуля
│       └── dist/             # Frontend модуля (если есть)
└── src/
    ├── core/                 # Ядро приложения
    │   ├── server.py         # FastAPI + Socket.io Router
    │   ├── loader.py         # Module Lifecycle Manager
    │   ├── config.py         # Управление настройками и токенами
    │   └── integrations/     # Адаптеры (Twitch, YouTube)
    ├── sdk/                  # SDK для разработчиков
    │   └── base.py           # BaseModule класс
    └── frontend/             # Исходный код React App
        ├── vite.config.js
        └── src/
```

## Архитектура системы (System Design)
Приложение построено по архитектуре Hub & Spoke (Звезда), где Core является центральным хабом, а модули и UI — спицами.

```
graph TD
    User[Стример] -->|Browser/OBS| UI[Frontend Dashboard / Overlays]
    UI --WebSocket--> Core[Python Core]
    
    subgraph "Core Logic"
        Gatekeeper[Permission Check]
        Router[Integrations Router]
        Loader[Module Loader]
    end
    
    Core --> Loader
    Core --> Gatekeeper
    Gatekeeper --> Router
    
    Router --API--> Twitch[Twitch API]
    Router --API--> YT[YouTube API]
    
    subgraph "Isolation Sandbox"
        Mod1[Module Process 1]
        Mod2[Module Process 2]
    end
    
    Loader --Subprocess--> Mod1
    Loader --Subprocess--> Mod2
    
    Mod1 --Socket.io Bridge--> Core
    Mod2 --Socket.io Bridge--> Core
```

## 4.1. Core (Ядро)

Ядро отвечает за:

- **Хостинг**  
  Запуск локального веб-сервера (по умолчанию порт `8080`).

- **Lifecycle**  
  Сканирование папки `modules/`, проверка манифестов, запуск и остановка процессов модулей.

- **Bridge**  
  Приём сообщений от модулей через WebSocket.

- **Gatekeeper**  
  Проверка прав доступа перед выполнением команд модуля.

---

## 4.2. Modules (Модули)

Каждый модуль — это отдельная папка.

- **Backend**  
  Запускается как отдельный OS-процесс.  
  Не имеет прямого доступа к памяти ядра.  
  Общается только через SDK (WebSocket).

- **Frontend**  
  Статические файлы (HTML / JS), которые раздаются ядром по адресу: `/modules-view/{module_id}/`


---

## 4.3. SDK (The Bridge)

SDK — библиотека, скрывающая сложность WebSocket-протокола.

Предоставляет методы:

```python
self.send_message(text, platform)
@self.on_event("donation")
```

---

## 5. Потоки данных (Data Flow)

### Сценарий: модуль отправляет сообщение в чат

1. **Module**  
   Вызывает:
   ```python
   await self.send_message("Привет", platform="twitch")
   ```

2. **SDK**  
   Формирует JSON-пакет:
   ```json
   {
     "cmd": "send_chat",
     "msg": "Привет",
     "target": "twitch"
   }
   ```
   и отправляет его в Core по WebSocket.

3. **Core (Server)**  
   Получает событие.

4. **Gatekeeper**  
   * Находит `manifest.json` модуля по ID сокета.
   * Проверяет наличие права `chat_send`.
   * **Если права нет** — Drop & Log.

5. **Router**  
   * Проверяет `target="twitch"`.
   * Проверяет, подключён ли Twitch (есть ли токен).

6. **Integration Layer**  
   * Использует токен стримера.
   * Делает запрос к Twitch API.

---

## 6. Безопасность и Манифест (Security)

Каждый модуль обязан иметь файл `manifest.json`.

```json
{
  "id": "my_super_bot",
  "name": "Super Bot",
  "version": "1.0.0",
  "entry_point": "backend.py",
  "requirements": ["twitch"],
  "permissions": [
    "chat_read",
    "chat_send"
  ]
}
```

### Принципы защиты:

* **Изоляция процессов:** Падение модуля не роняет Ядро.
* **Отсутствие eval:** Ядро никогда не исполняет код модуля напрямую в своем контексте.
* **Whitelist:** Модуль не может обратиться к YouTube, если запросил права только на Twitch.

---

## 7. Сборка и Развертывание (Build & Deploy)

### Режим разработки (Development)
* **Python:** `python main.py` (Core server: 8080)
* **React:** `npm run dev` (Vite dev server: 5173, proxy -> 8080)

### Сборка (Production)
Процесс автоматизирован через GitHub Actions / локальные скрипты.

1. **Frontend Build:**
   ```bash
   cd src/frontend && npm run build
   ```
   Результат сохраняется в `root/static_dist`.

2. **Python Compilation:** Используется Nuitka.
   ```bash
   nuitka --standalone --onefile --include-data-dir=static_dist=static_dist main.py
   ```

3. **Packaging:** Полученный бинарник упаковывается в Инсталлятор (Inno Setup), который создает структуру папок пользователя (`%AppData%/StreamCore/modules`).

### Обновления
При старте Core делает запрос к GitHub Releases API. Если есть новая версия, скачивает инсталлятор и запускает его в тихом режиме.



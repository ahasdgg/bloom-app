# Breath of Fresh Air — Web

Веб-версия приложения "Breath of Fresh Air" работает на React + Vite.

## Быстрый старт

```bash
cd web
npm install
npm run dev
```

Открой в браузере: http://localhost:5173

## Скрипты

- `npm run dev` — запускает локальный сервер разработки
- `npm run build` — собирает production-версию
- `npm run preview` — запускает локальный сервер для проверки сборки
- `npm run lint` — проверяет код с помощью ESLint
- `npm run format` — форматирует код с помощью Prettier
- `npm run test` — запускает unit-тесты через Vitest

## Окружение

Скопируй файл `web/.env.example` в `web/.env` и заполни переменные. Для Vite допустимы только переменные, начинающиеся с `VITE_`.

## Тесты

Веб-приложение настроено на `Vitest` с `jsdom`-окружением. Тесты лежат в `web/src/__tests__/`.

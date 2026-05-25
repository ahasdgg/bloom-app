"""
analyze.py — Посекундный анализ кадров через Google Gemini API.
Обрабатывает кадры парами, сравнивая изменения между ними.
Формат лога: [Имя файла] — [Описание]
"""

import os
import time
import re
from pathlib import Path
from google import genai
from google.genai import types


# ── Настройки ────────────────────────────────────────────────────────────────

FRAMES_FOLDER = "screens"
OUTPUT_FILE = "analysis.txt"
MODEL_NAME = "gemini-2.5-flash"
DELAY_BETWEEN_PAIRS = 8.0       # секунд между запросами
RATE_LIMIT_WAIT = 30            # секунд ожидания при ошибке rate limit
MAX_RETRIES = 7                 # максимум повторных попыток на пару

PROMPT_PAIR = """\
Ты анализируешь два последовательных кадра из видео. Дай краткое описание каждого.

Кадр А ({frame_a}):
— Опиши подробно, что происходит на этом кадре: объекты, действия, обстановка.

Кадр Б ({frame_b}):
— Опиши только то, что ИЗМЕНИЛОСЬ по сравнению с кадром А. Если изменений нет — напиши "без изменений".

Отвечай строго в формате (две строки, без лишнего текста):
{frame_a}: <описание кадра А>
{frame_b}: <что изменилось относительно кадра А>
"""

PROMPT_SINGLE = """\
Опиши подробно, что происходит на этом кадре видео: объекты, действия, обстановка.
Отвечай строго в одну строку в формате:
{frame}: <описание>
"""

# ── Загрузка API-ключа ────────────────────────────────────────────────────────

def load_api_key() -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        env_file = Path(".env")
        if env_file.exists():
            for line in env_file.read_text().splitlines():
                if line.startswith("GEMINI_API_KEY="):
                    api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    if not api_key:
        raise ValueError(
            "API key not found. Set GEMINI_API_KEY environment variable or add it to .env file."
        )
    return api_key


# ── Работа с файлами ──────────────────────────────────────────────────────────

def get_image_files(folder: str) -> list[str]:
    """Возвращает отсортированный список изображений из папки."""
    folder_path = Path(folder)
    if not folder_path.exists():
        raise FileNotFoundError(f"Папка не найдена: {folder}")
    extensions = {".jpg", ".jpeg", ".png"}
    files = [f.name for f in folder_path.iterdir() if f.suffix.lower() in extensions]
    return sorted(files)


def load_processed(output_file: str) -> set[str]:
    """Загружает уже обработанные файлы из лога (checkpoint)."""
    processed = set()
    output_path = Path(output_file)
    if output_path.exists():
        for line in output_path.read_text(encoding="utf-8").splitlines():
            match = re.match(r"^(.+?)\s*—\s*.+", line)
            if match:
                processed.add(match.group(1).strip())
    return processed


# ── Анализ через Gemini ───────────────────────────────────────────────────────

def read_image_bytes(img_path: str) -> tuple[bytes, str]:
    """Читает изображение и возвращает байты + mime type."""
    with open(img_path, "rb") as f:
        data = f.read()
    ext = Path(img_path).suffix.lower()
    mime = "image/jpeg" if ext in (".jpg", ".jpeg") else "image/png"
    return data, mime


def parse_pair_response(text: str, frame_a: str, frame_b: str) -> dict[str, str]:
    """Парсит ответ модели и возвращает словарь {filename: description}."""
    result = {}
    for frame in (frame_a, frame_b):
        pattern = re.compile(
            rf"^{re.escape(frame)}\s*:\s*(.+)", re.MULTILINE | re.IGNORECASE
        )
        match = pattern.search(text)
        if match:
            result[frame] = match.group(1).strip()
        else:
            result[frame] = None
    return result


def analyze_pair(client, folder: str, frame_a: str, frame_b: str) -> dict[str, str]:
    """Анализирует пару кадров, возвращает {filename: description}."""
    path_a = os.path.join(folder, frame_a)
    path_b = os.path.join(folder, frame_b)

    data_a, mime_a = read_image_bytes(path_a)
    data_b, mime_b = read_image_bytes(path_b)

    prompt = PROMPT_PAIR.format(frame_a=frame_a, frame_b=frame_b)

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=[
            types.Part.from_bytes(data=data_a, mime_type=mime_a),
            types.Part.from_bytes(data=data_b, mime_type=mime_b),
            prompt,
        ],
    )

    parsed = parse_pair_response(response.text, frame_a, frame_b)

    # Fallback если парсинг не сработал
    for frame in (frame_a, frame_b):
        if not parsed.get(frame):
            parsed[frame] = f"[не удалось распарсить] {response.text[:300]}"

    return parsed


def analyze_single(client, folder: str, frame: str) -> str:
    """Анализирует одиночный кадр (для нечётного остатка)."""
    img_path = os.path.join(folder, frame)
    data, mime = read_image_bytes(img_path)
    prompt = PROMPT_SINGLE.format(frame=frame)

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=[
            types.Part.from_bytes(data=data, mime_type=mime),
            prompt,
        ],
    )

    pattern = re.compile(
        rf"^{re.escape(frame)}\s*:\s*(.+)", re.MULTILINE | re.IGNORECASE
    )
    match = pattern.search(response.text)
    return match.group(1).strip() if match else response.text.strip()


# ── Основная логика ───────────────────────────────────────────────────────────

def analyze_with_retry(client, folder: str, frames: list[str]) -> dict[str, str]:
    """Вызывает анализ с повторными попытками при ошибках."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            if len(frames) == 2:
                return analyze_pair(client, folder, frames[0], frames[1])
            else:
                desc = analyze_single(client, folder, frames[0])
                return {frames[0]: desc}
        except Exception as e:
            err_str = str(e).lower()
            is_rate_limit = any(
                kw in err_str for kw in ("429", "rate", "quota", "resource exhausted", "too many", "500", "internal", "503", "unavailable")
            )
            if is_rate_limit:
                wait = RATE_LIMIT_WAIT * attempt
                print(f"  ⚠ Сервер недоступен/лимит. Ожидание {wait}с (попытка {attempt}/{MAX_RETRIES})...")
                time.sleep(wait)
            else:
                print(f"  ✗ Ошибка (попытка {attempt}/{MAX_RETRIES}): {e}")
                if attempt < MAX_RETRIES:
                    time.sleep(5)
                else:
                    raise
    raise RuntimeError(f"Не удалось обработать кадры после {MAX_RETRIES} попыток")


def run_analysis() -> None:
    print("Загрузка API-ключа...")
    api_key = load_api_key()
    client = genai.Client(api_key=api_key)

    print(f"Сканирование папки: {FRAMES_FOLDER}")
    all_files = get_image_files(FRAMES_FOLDER)
    if not all_files:
        print(f"Изображения не найдены в папке: {FRAMES_FOLDER}")
        return

    processed = load_processed(OUTPUT_FILE)
    remaining = [f for f in all_files if f not in processed]

    print(f"Всего кадров:        {len(all_files)}")
    print(f"Уже обработано:      {len(processed)}")
    print(f"Осталось обработать: {len(remaining)}")
    print("-" * 55)

    if not remaining:
        print("Все кадры уже обработаны.")
        return

    # Разбиваем на пары
    pairs = []
    for i in range(0, len(remaining), 2):
        pairs.append(remaining[i:i + 2])

    total_pairs = len(pairs)

    with open(OUTPUT_FILE, "a", encoding="utf-8") as out:
        for pair_idx, frames in enumerate(pairs, 1):
            label = " + ".join(frames)
            print(f"[{pair_idx}/{total_pairs}] Обработка: {label}")

            try:
                results = analyze_with_retry(client, FRAMES_FOLDER, frames)

                for frame in frames:
                    description = results.get(frame, "нет описания")
                    line = f"{frame} — {description}\n"
                    out.write(line)
                    out.flush()
                    print(f"  ✓ {frame}")

            except Exception as e:
                for frame in frames:
                    out.write(f"{frame} — ОШИБКА: {e}\n")
                    out.flush()
                print(f"  ✗ Пропущено из-за ошибки: {e}")

            if pair_idx < total_pairs:
                time.sleep(DELAY_BETWEEN_PAIRS)

    print("-" * 55)
    print(f"Анализ завершён. Результаты сохранены в: {OUTPUT_FILE}")


if __name__ == "__main__":
    run_analysis()

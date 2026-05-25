"""
test_analyze.py — Тестовый запуск: анализирует только первые 10 кадров.
Результат сохраняется в test_analysis.txt
"""

import analyze

# Переопределяем настройки для теста
analyze.FRAMES_FOLDER = "screens"
analyze.OUTPUT_FILE = "test_analysis.txt"
analyze.DELAY_BETWEEN_PAIRS = 5.0

# Патчим функцию получения файлов — берём только первые 10
original_get_files = analyze.get_image_files

def get_first_10(folder):
    files = original_get_files(folder)
    return files[:10]

analyze.get_image_files = get_first_10

if __name__ == "__main__":
    print("=== ТЕСТОВЫЙ ЗАПУСК (10 кадров) ===")
    analyze.run_analysis()

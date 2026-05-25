import os
import time
import argparse
import google.generativeai as genai
from pathlib import Path


def load_api_key() -> str:
    """Load API key from environment variable or .env file."""
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


def get_image_files(folder: str, extensions: tuple = (".jpg", ".jpeg", ".png")) -> list[str]:
    """Return sorted list of image files from folder."""
    folder_path = Path(folder)
    if not folder_path.exists():
        raise FileNotFoundError(f"Folder not found: {folder}")

    files = [
        f.name
        for f in folder_path.iterdir()
        if f.suffix.lower() in extensions
    ]
    return sorted(files)


def load_processed(output_file: str) -> set[str]:
    """Load already processed filenames to support resume."""
    processed = set()
    output_path = Path(output_file)
    if output_path.exists():
        for line in output_path.read_text(encoding="utf-8").splitlines():
            if ": " in line:
                filename = line.split(": ", 1)[0]
                processed.add(filename)
    return processed


def analyze_frame(model, img_path: str, prompt: str) -> str:
    """Upload image and get description from Gemini."""
    uploaded = genai.upload_file(path=img_path)
    try:
        response = model.generate_content([uploaded, prompt])
        return response.text
    finally:
        # Clean up uploaded file from Google servers
        try:
            genai.delete_file(uploaded.name)
        except Exception:
            pass


def analyze_video_frames(
    folder: str,
    output_file: str,
    prompt: str,
    delay: float = 4.0,
    resume: bool = True,
) -> None:
    """
    Analyze all image frames in a folder using Gemini and save descriptions.

    Args:
        folder: Path to folder containing screenshots
        output_file: Path to output text file
        prompt: Prompt to send with each image
        delay: Seconds to wait between API calls (default 4s = ~15 req/min)
        resume: Skip already processed files if output file exists
    """
    api_key = load_api_key()
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    files = get_image_files(folder)
    if not files:
        print(f"No image files found in: {folder}")
        return

    processed = load_processed(output_file) if resume else set()
    remaining = [f for f in files if f not in processed]

    print(f"Total frames: {len(files)}")
    print(f"Already processed: {len(processed)}")
    print(f"To process: {len(remaining)}")
    print("-" * 50)

    with open(output_file, "a", encoding="utf-8") as out:
        for i, filename in enumerate(remaining, 1):
            img_path = os.path.join(folder, filename)
            print(f"[{i}/{len(remaining)}] Processing: {filename}")

            try:
                description = analyze_frame(model, img_path, prompt)
                result = f"{filename}: {description}\n"
                out.write(result)
                out.flush()
                print(f"  ✓ Done")
            except Exception as e:
                error_line = f"{filename}: ERROR - {e}\n"
                out.write(error_line)
                out.flush()
                print(f"  ✗ Error: {e}")

            if i < len(remaining):
                time.sleep(delay)

    print("-" * 50)
    print(f"Analysis complete. Results saved to: {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description="Analyze video frames using Google Gemini API"
    )
    parser.add_argument(
        "folder",
        help="Path to folder containing screenshot images"
    )
    parser.add_argument(
        "-o", "--output",
        default="video_analysis.txt",
        help="Output file path (default: video_analysis.txt)"
    )
    parser.add_argument(
        "-p", "--prompt",
        default="Обширно опиши, что происходит на этом кадре видео.",
        help="Prompt to use for each frame analysis"
    )
    parser.add_argument(
        "-d", "--delay",
        type=float,
        default=4.0,
        help="Delay in seconds between API calls (default: 4.0)"
    )
    parser.add_argument(
        "--no-resume",
        action="store_true",
        help="Reprocess all frames even if output file exists"
    )

    args = parser.parse_args()

    analyze_video_frames(
        folder=args.folder,
        output_file=args.output,
        prompt=args.prompt,
        delay=args.delay,
        resume=not args.no_resume,
    )


if __name__ == "__main__":
    main()

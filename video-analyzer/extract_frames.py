"""
Optional utility: extract frames from a video file using OpenCV.
Usage: python extract_frames.py video.mp4 --output frames/ --interval 1
"""

import os
import argparse
from pathlib import Path


def extract_frames(video_path: str, output_folder: str, interval: float = 1.0) -> int:
    """
    Extract frames from a video at a given interval.

    Args:
        video_path: Path to the video file
        output_folder: Folder to save extracted frames
        interval: Interval in seconds between frames (default: 1.0)

    Returns:
        Number of frames extracted
    """
    try:
        import cv2
    except ImportError:
        raise ImportError(
            "OpenCV is required for frame extraction. "
            "Install it with: pip install opencv-python"
        )

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video file: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps if fps > 0 else 0

    print(f"Video: {video_path}")
    print(f"FPS: {fps:.2f}, Duration: {duration:.1f}s, Total frames: {total_frames}")

    output_path = Path(output_folder)
    output_path.mkdir(parents=True, exist_ok=True)

    frame_interval = int(fps * interval)
    frame_count = 0
    saved_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_count % frame_interval == 0:
            second = frame_count / fps
            filename = f"frame_{second:08.2f}s.jpg"
            filepath = output_path / filename
            cv2.imwrite(str(filepath), frame)
            saved_count += 1

        frame_count += 1

    cap.release()
    print(f"Extracted {saved_count} frames to: {output_folder}")
    return saved_count


def main():
    parser = argparse.ArgumentParser(
        description="Extract frames from a video file"
    )
    parser.add_argument("video", help="Path to video file")
    parser.add_argument(
        "-o", "--output",
        default="frames",
        help="Output folder for frames (default: frames/)"
    )
    parser.add_argument(
        "-i", "--interval",
        type=float,
        default=1.0,
        help="Interval in seconds between frames (default: 1.0)"
    )

    args = parser.parse_args()
    extract_frames(args.video, args.output, args.interval)


if __name__ == "__main__":
    main()

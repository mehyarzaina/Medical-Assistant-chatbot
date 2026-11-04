"""Turn the recorded GIF clips and the narration MP3s into one demo video.

narration-script.md splits every clip into screens: a range of GIF frames
and the line spoken over them. Each clip's MP3 is one ElevenLabs take of
all its lines with a 1.5 s pause between them; the pauses are found again
here to cut the audio back into lines. Each screen is then held for exactly
as long as its line takes to say, so the voice always matches the picture.

Needs Pillow and imageio-ffmpeg (which bundles ffmpeg):
    python build_video.py               # build out/clip_NN.mp4 and the full video
    python build_video.py --print-text  # the text to paste into ElevenLabs
"""

import argparse
import glob
import os
import re
import subprocess
import tempfile

import imageio_ffmpeg
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
DOWNLOADS = os.path.expanduser("~/Downloads")
AUDIO_DIR = os.path.join(HERE, "audio")
OUT_DIR = os.path.join(HERE, "out")
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

WIDTH, HEIGHT = 1568, 662  # even sizes for H.264; clips are 1568x661-718
BOTTOM_CROP = 8  # px; the GIF recorder draws an orange progress bar along the bottom
LEAD = 0.35  # seconds a screen shows before its line starts
TAIL = 0.55  # seconds it stays after the line ends
PAUSE = "1.5s"  # ElevenLabs break between lines
MIN_GAP = 0.9  # shortest silence counted as a break between lines


def run(args):
    subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", *args], check=True)


def read_scenes():
    """{clip number: [(first_frame, last_frame, text)]} from the script."""
    text = open(os.path.join(HERE, "narration-script.md"), encoding="utf-8").read()
    clips = {}
    for section in re.split(r"^## ", text, flags=re.M)[1:]:
        number = int(section.split(".", 1)[0])
        clips[number] = [
            (int(a), int(b), line.strip())
            for a, b, line in re.findall(r"^- `(\d+)-(\d+)` (.+)$", section, re.M)
        ]
    return clips


def speech_spans(audio, count):
    """Splits a take into `count` (start, end) spans of speech at its longest pauses."""
    probe = subprocess.run(
        [FFMPEG, "-hide_banner", "-i", audio, "-af", f"silencedetect=noise=-40dB:d={MIN_GAP}", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", probe).groups()
    duration = int(h) * 3600 + int(m) * 60 + float(s)
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", probe)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", probe)]
    silences = list(zip(starts, ends + [duration] * (len(starts) - len(ends))))
    # Silence touching either end of the file is lead-in or tail, not a break.
    speech_start = silences[0][1] if silences and silences[0][0] < 0.05 else 0.0
    speech_end = silences[-1][0] if silences and silences[-1][1] > duration - 0.05 else duration
    gaps = [g for g in silences if g[0] > speech_start and g[1] < speech_end]
    if len(gaps) < count - 1:
        raise SystemExit(f"{os.path.basename(audio)}: found {len(gaps)} pauses, need {count - 1}")
    gaps = sorted(sorted(gaps, key=lambda g: g[1] - g[0], reverse=True)[: count - 1])
    bounds = [speech_start] + [x for g in gaps for x in g] + [speech_end]
    return list(zip(bounds[::2], bounds[1::2]))


def gif_frames(path, workdir):
    """Saves every frame as PNG; returns [(png_path, original_seconds)]."""
    frames = []
    with Image.open(path) as im:
        index = 0
        while True:
            png = os.path.join(workdir, f"f{index:03d}.png")
            im.convert("RGB").save(png)
            frames.append((png, im.info.get("duration", 100) / 1000))
            index += 1
            try:
                im.seek(index)
            except EOFError:
                break
    return frames


def build_clip(number, gif, audio, scenes, out_path):
    spans = speech_spans(audio, len(scenes))
    with tempfile.TemporaryDirectory() as work:
        frames = gif_frames(gif, work)
        listing = os.path.join(work, "frames.txt")
        audio_parts, timeline = [], []
        with open(listing, "w", encoding="utf-8") as f:
            for i, ((first, last, _), (start, end)) in enumerate(zip(scenes, spans)):
                length = LEAD + (end - start) + TAIL
                shown = frames[first : last + 1]
                scale = length / sum(seconds for _, seconds in shown)
                for png, seconds in shown:
                    f.write(f"file '{png.replace(os.sep, '/')}'\nduration {seconds * scale:.3f}\n")
                audio_parts.append(
                    f"[1:a]atrim={start:.3f}:{end:.3f},asetpts=PTS-STARTPTS,"
                    f"adelay={LEAD * 1000:.0f}:all=1,apad=whole_dur={length:.3f}[a{i}]"
                )
                timeline.append(length)
            # The concat demuxer ignores the last duration unless the file repeats.
            f.write(f"file '{frames[scenes[-1][1]][0].replace(os.sep, '/')}'\n")
        total = sum(timeline)
        joined = "".join(f"[a{i}]" for i in range(len(scenes)))
        run([
            "-f", "concat", "-safe", "0", "-i", listing,
            "-i", audio,
            "-filter_complex",
            # Trim the recorder's progress bar off the bottom edge first.
            f"[0:v]crop=iw:ih-{BOTTOM_CROP}:0:0,"
            f"scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=decrease,"
            f"pad={WIDTH}:{HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=white,fps=30,format=yuv420p[v];"
            + ";".join(audio_parts)
            + f";{joined}concat=n={len(scenes)}:v=0:a=1,aresample=44100[a]",
            "-map", "[v]", "-map", "[a]", "-t", f"{total:.3f}",
            "-c:v", "libx264", "-preset", "medium", "-crf", "20",
            "-c:a", "aac", "-b:a", "160k", "-ac", "2",
            out_path,
        ])
    print(f"clip {number:02d}: {len(scenes)} screens, {total:.1f}s -> {os.path.basename(out_path)}")
    return total


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--print-text", action="store_true", help="print each clip's ElevenLabs text and stop")
    parser.add_argument("--only", type=int, help="build just this clip")
    args = parser.parse_args()
    clips = read_scenes()

    if args.print_text:
        for number, scenes in clips.items():
            print(f"--- {number:02d} ---")
            print(f' <break time="{PAUSE}" /> '.join(text for *_, text in scenes))
            print()
        return

    os.makedirs(OUT_DIR, exist_ok=True)
    built = []
    for number, scenes in clips.items():
        out_path = os.path.join(OUT_DIR, f"clip_{number:02d}.mp4")
        built.append(out_path)
        if args.only and args.only != number:
            continue
        gifs = glob.glob(os.path.join(DOWNLOADS, f"{number:02d}_*.gif"))
        if not gifs:
            raise SystemExit(f"Missing ~/Downloads/{number:02d}_*.gif")
        audio = os.path.join(AUDIO_DIR, f"{number:02d}.mp3")
        if not os.path.exists(audio):
            raise SystemExit(f"Missing {audio}")
        build_clip(number, gifs[0], audio, scenes, out_path)
    if args.only:
        return

    listing = os.path.join(OUT_DIR, "clips.txt")
    with open(listing, "w", encoding="utf-8") as f:
        for clip in built:
            f.write(f"file '{clip.replace(os.sep, '/')}'\n")
    final = os.path.join(OUT_DIR, "zaina-medical-demo.mp4")
    run(["-f", "concat", "-safe", "0", "-i", listing, "-c", "copy", final])
    os.remove(listing)
    print(f"done: {final}")


if __name__ == "__main__":
    main()

"""Rigenera il video degli asset correnti; non esegue o modifica il gioco."""
from pathlib import Path
from PIL import Image
import hashlib
import json
import subprocess

root = Path(__file__).resolve().parents[1]
cycle_path = root / 'previews/hellscape_ciclo.png'
cycle = Image.open(cycle_path).convert('RGB')
viewport_width = 1448
height = cycle.height
period = cycle.width
frames = 985
fps = 30
wrapped = Image.new('RGB', (period + viewport_width, height))
wrapped.paste(cycle, (0, 0))
wrapped.paste(cycle.crop((0, 0, viewport_width, height)), (period, 0))
output = root / 'previews/anteprima_scorrimento.mp4'
command = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pixel_format', 'rgb24', '-video_size', f'{viewport_width}x{height}', '-framerate', str(fps), '-i', '-', '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(output)]
process = subprocess.Popen(command, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
try:
    for frame in range(frames):
        x = int(frame * period / frames)
        process.stdin.write(wrapped.crop((x, 0, x + viewport_width, height)).tobytes())
    process.stdin.close()
    process.stdin = None
    _, stderr = process.communicate()
except Exception:
    process.kill()
    process.wait()
    raise
if process.returncode:
    raise RuntimeError(stderr.decode(errors='replace'))
probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,nb_frames,avg_frame_rate,duration', '-of', 'json', str(output)], check=True, capture_output=True, text=True)
metadata = json.loads(probe.stdout)
stream = metadata['streams'][0]
assert stream['width'] == viewport_width and stream['height'] == height
assert int(stream['nb_frames']) == frames
report = {'purpose': 'Anteprima di scorrimento dei soli asset accostati, non registrazione del runtime del gioco.', 'source': cycle_path.relative_to(root).as_posix(), 'source_sha256': hashlib.sha256(cycle_path.read_bytes()).hexdigest(), 'period_pixels': period, 'viewport': [viewport_width, height], 'frames': frames, 'fps': fps, 'duration_seconds': frames/fps, 'processing': 'Ritaglio mobile alla scala 1:1 del ciclo, con riavvolgimento sui pixel di A. Nessuna dissolvenza o interpolazione tra fondali; compressione video H.264.', 'ffprobe': metadata, 'video_sha256': hashlib.sha256(output.read_bytes()).hexdigest(), 'bytes': output.stat().st_size}
(root / 'provenance/anteprima_scorrimento.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'video': str(output), 'viewport': report['viewport'], 'duration_seconds': report['duration_seconds'], 'bytes': report['bytes']}, indent=2))

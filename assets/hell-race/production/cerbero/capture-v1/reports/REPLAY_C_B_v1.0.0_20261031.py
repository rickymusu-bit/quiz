"""Reproduce C-B diagnostics with external sprites-post; no generation or atlas."""
import argparse
import importlib.util
import json
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
from PIL import Image

p = argparse.ArgumentParser()
p.add_argument('--repo', type=Path, required=True)
p.add_argument('--tool-root', type=Path, required=True)
p.add_argument('--out', type=Path, required=True)
args = p.parse_args()
tool = args.tool_root / 'scripts/sprite_postprocess.py'
spec = importlib.util.spec_from_file_location('sprites_post', tool)
mod = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = mod
spec.loader.exec_module(mod)
base = args.repo / 'assets/hell-race/production/cerbero'
canonical_path = base / 'run-stabilized-v1/frames/008.png'
raw_path = base / 'capture-v1/candidates/001_C_B_raw_v1.0.0_20261031.png'
canon = Image.open(canonical_path).convert('RGBA')
raw = Image.open(raw_path).convert('RGBA')
source = [(795, 640), (747, 573), (832, 718)]
target = [(340, 275 + 1/3), (319, 247 + 1/3), (358, 308 + 1/3)]
transform, fit = mod.fit_landmarks(source, target, [1, 1, 1], allow_scale=True)
sprites = [mod.Sprite(canon, (0, 0, *canon.size)), mod.Sprite(raw, (0, 0, *raw.size))]
frames, transforms = mod.render(sprites, [(1, 0, 0), transform], padding=16, canvas=(600, 554))
args.out.mkdir(parents=True, exist_ok=False)
frames[0].save(args.out / '008_common_canvas.png')
frames[1].save(args.out / '001_C_B_aligned_v1.0.0_20261031.png')
gif = mod.save_gif(frames, args.out / '008_C_B_flip_v1.0.0_20261031.gif', 500)
mod.onion_frames(frames, .25)[1].save(args.out / '008_C_B_onion_v1.0.0_20261031.png')
scale = 221 / 500
small = [im.resize((round(im.width * scale), round(im.height * scale)), Image.Resampling.LANCZOS) for im in frames]
mod.save_gif(small, args.out / '008_C_B_adapter_scale_v1.0.0_20261031.gif', 500)
names = ['shoulder_mass_center', 'upper_thorax', 'lower_thorax']
report = {
    'version': '1.0.0',
    'updated_at': datetime.now(ZoneInfo('Europe/Rome')).isoformat(),
    'tool': {'repository': 'rickymusu-bit/sprites-post', 'revision': '870e1274aee5fd42ede786cff7eec944087c7771', 'module_sha256': mod.digest(tool), 'api': ['fit_landmarks', 'render', 'save_gif', 'onion_frames']},
    'input_sha256': {'canonical': mod.digest(canonical_path), 'raw': mod.digest(raw_path)},
    'source_landmarks_raw': dict(zip(names, source)),
    'canonical_landmarks': dict(zip(names, target)),
    'canonical_landmark_source': 'run-stabilized-v1/landmarks.json frame 8, transformed by reports/alignment-original.json frame 8',
    'annotation': 'Candidate points manually estimated from viewed PNG, medium confidence; uncertainty about 19 raw px (8 canonical px). Historical points have about 8 px uncertainty. Not precision anatomy measurements.',
    'fit': fit,
    'raw_to_canonical_before_padding': transform,
    'final_transforms': transforms,
    'canvas': [600, 554],
    'padding_reason': 'Common canvas preserves even faint alpha pixels without clipping. Original canonical file remains immutable. Initial 584x554 proposal was rejected by tool clipping guard (required width 588); no image was produced by that failed export.',
    'rotation_degrees': 0,
    'resampling': 'One whole-frame uniform scale and translation, bicubic from raw; no regional transform or warp.',
    'intentional_motion': 'Central neck reach and jaw opening preserved; same airborne stride. No temporal interpolation.',
    'gif': gif,
    'diagnostic_scale': {'adapter_scale': scale, 'logical_size': list(small[0].size), 'not_runtime': True},
    'status': 'candidate; registration uses estimated landmarks, artistic approval pending',
}
(args.out / 'ALIGNMENT_C_B_v1.0.0_20261031.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'transforms': transforms, 'fit': fit, 'canvas': report['canvas']}))

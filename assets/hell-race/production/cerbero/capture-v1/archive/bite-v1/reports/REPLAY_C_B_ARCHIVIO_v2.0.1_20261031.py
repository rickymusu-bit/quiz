"""Replay archived approved C-B with pinned external sprites-post APIs. Cleanup wrapper 2.0.1."""
import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
from PIL import Image, ImageChops

p = argparse.ArgumentParser()
p.add_argument('--repo', type=Path, required=True)
p.add_argument('--tool-root', type=Path, required=True)
p.add_argument('--out', type=Path, required=True)
args = p.parse_args()
sys.path.insert(0, str(args.tool_root / 'scripts'))
import sprite_postprocess as core
import sprite_edits
from sprite_patches import raster, registration, verification

base = args.repo / 'assets/hell-race/production/cerbero/capture-v1/archive/bite-v1'
original_path = args.repo / 'assets/hell-race/production/cerbero/run-stabilized-v1/frames/008.png'
raw_path = base / 'candidates/002_C_B_raw_v1.0.1_20261031.png'
mask_path = base / 'references/002_C_B_heads_effective_mask_v1.0.1_20261031.png'
original, raw = Image.open(original_path).convert('RGBA'), Image.open(raw_path).convert('RGBA')
mask = Image.open(mask_path).convert('L')
args.out.mkdir(parents=True, exist_ok=False)
# Transparent extension only: preserve every original raw pixel, including hidden RGB.
expanded = sprite_edits.expanded(core.Sprite(raw, (0, 0, *raw.size)), (0, 0, 1400, 1300)).image
settings = {'input_mapping': {'mode': 'uniform', 'scale': .4, 'offset': [4, 10]}, 'allow_scale': False, 'allow_rotation': False, 'nearest': False, 'feather_px': 1.5}
registered, mapping = registration.register(expanded, mask, settings)
snapshot = core.Sprite(original, (0, 0, *original.size))
refinement = json.loads((base / 'reports/MASK_REFINEMENT_C_B_v1.0.1_20261031.json').read_text())
op = {'type': 'patch', 'patch_version': '1.1.0', 'id': '002_C_B_v1.0.1', 'name': 'Three heads reach, original anatomy order', 'enabled': True, 'package_id': 'capture-C-B-1.0.1', 'crop_box': [0, 0, *original.size], 'base_pixels_sha256': raster.pixels(original, snapshot.box), 'mask_outline': refinement['polygon'], 'mask_png': raster.encode(mask), 'patch_png': raster.encode(registered), 'feather_px': 1.5, 'transform': mapping, 'approval': 'pending_visual_review'}
working, checks = sprite_edits.apply_all([snapshot], [[op]])
final = working[0].image
report = verification.compare(original, final, mask)
final.save(args.out / '002_C_B_masked_v1.0.1_20261031.png')
gif = core.save_gif([original, final], args.out / '008_C_B_flip_v1.0.1_20261031.gif', 500)
core.onion_frames([original, final], .25)[1].save(args.out / '008_C_B_onion_v1.0.1_20261031.png')
small = [im.resize((244, 231), Image.Resampling.LANCZOS) for im in [original, final]]
core.save_gif(small, args.out / '008_C_B_adapter_scale_v1.0.1_20261031.gif', 500)
small[1].save(args.out / 'C_B_adapter_scale.png')
# Anatomical body landmarks outside mask remain exact because all RGBA bytes are preserved.
points = {'shoulder_mass_center': [340, 275.3333333333], 'upper_thorax': [319, 247.3333333333], 'lower_thorax': [358, 308.3333333333]}
for point in points.values():
    assert mask.getpixel(tuple(round(v) for v in point)) == 0
assert report['outside_mask_changed_pixels'] == 0
report.update({'version': '1.0.1', 'updated_at': datetime.now(ZoneInfo('Europe/Rome')).isoformat(), 'source_sha256': core.digest(original_path), 'raw_sha256': core.digest(raw_path), 'mask_sha256': core.digest(mask_path), 'final_sha256': core.digest(args.out / '002_C_B_masked_v1.0.1_20261031.png'), 'tool_revision': '870e1274aee5fd42ede786cff7eec944087c7771', 'tool_modules': {name: core.digest(args.tool_root / 'scripts' / name) for name in ['sprite_edits.py', 'sprite_patches/raster.py', 'sprite_patches/registration.py', 'sprite_patches/verification.py']}, 'registration': mapping, 'registration_basis': 'Body ROI (260,250,64,48) photometric search initialized uniform scale/translation; manual selection 0.4,+4,+10 after visual framing check. Photometric score is not anatomical precision. Raw-to-context geometry remains provisional; final body registration is exact identity.', 'transparent_extension': {'original_size': list(raw.size), 'padded_size': list(expanded.size), 'offset': [0, 0], 'reason': 'Explicit transparent context at right/bottom covers frozen mask; no synthesis, cropping or alteration of raw pixels.'}, 'global_alignment': {'matrix': [1, 0, 0, 0, 1, 0], 'stable_body_landmarks': points, 'residual_px': 0, 'basis': 'Exact RGBA preservation outside mask, including all three body landmarks; not a fitted/raw-landmark precision claim.'}, 'canvas': list(final.size), 'mask_application': checks, 'gif': gif, 'timing': '500ms per diagnostic exposure; not production timing or complete animation', 'status': 'candidate_awaiting_visual_approval'})
(args.out / 'VERIFICATION_C_B_v1.0.1_20261031.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
(args.out / 'RECIPE_C_B_v1.0.1_20261031.json').write_text(json.dumps({'version': '1.0.1', 'frames': [{'edits': [op]}]}, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k: report[k] for k in ['outside_mask_changed_pixels', 'inside_mask_changed_pixels', 'canvas', 'final_sha256']}))

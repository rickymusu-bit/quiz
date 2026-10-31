"""Rebuild single C-C and B/C diagnostics with pinned external sprites-post."""
import argparse
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
sys.path.insert(0, str(args.tool_root / 'scripts'))
import sprite_postprocess as core
import sprite_edits
from sprite_patches import raster, registration, verification

base = args.repo / 'assets/hell-race/production/cerbero/capture-v1'
before_path = base / 'candidates/002_C_B_masked_v1.0.1_20261031.png'
raw_path = base / 'candidates/003_C_C_raw_v1.1.0_20261031.png'
mask_path = base / 'references/003_C_C_mask_v1.1.0_20261031.png'
before, raw = Image.open(before_path).convert('RGBA'), Image.open(raw_path).convert('RGBA')
mask = Image.open(mask_path).convert('L')
preflight = json.loads((base / 'reports/PREFLIGHT_C_C_v1.1.0_20261031.json').read_text())
settings = {'input_mapping': {'mode': 'uniform', 'scale': .414, 'offset': [3, 5]}, 'allow_scale': False, 'allow_rotation': False, 'nearest': False}
registered, mapping = registration.register(raw, mask, settings)
snapshot = core.Sprite(before, (0, 0, *before.size))
op = {'type': 'patch', 'patch_version': '1.1.0', 'id': '003_C_C_v1.1.0', 'name': 'Initial central bite and forelimb support reach', 'enabled': True, 'package_id': 'capture-C-C-1.1.0', 'crop_box': [0, 0, *before.size], 'base_pixels_sha256': raster.pixels(before, snapshot.box), 'mask_outline': preflight['mask']['polygons'][0], 'mask_polygons': preflight['mask']['polygons'], 'mask_png': raster.encode(mask), 'patch_png': raster.encode(registered), 'feather_px': 1, 'transform': mapping, 'approval': 'pending_visual_review'}
working, checks = sprite_edits.apply_all([snapshot], [[op]])
final = working[0].image
report = verification.compare(before, final, mask)
args.out.mkdir(parents=True, exist_ok=False)
final.save(args.out / '003_C_C_masked_v1.1.0_20261031.png')
gif = core.save_gif([before, final], args.out / 'C_B_C_C_flip_v1.1.0_20261031.gif', 500)
core.onion_frames([before, final], .25)[1].save(args.out / 'C_B_C_C_onion_v1.1.0_20261031.png')
small = [im.resize((244, 231), Image.Resampling.LANCZOS) for im in [before, final]]
core.save_gif(small, args.out / 'C_B_C_C_adapter_scale_v1.1.0_20261031.gif', 500)
small[1].save(args.out / 'C_C_adapter_scale.png')
points = {'pelvis_mass_center': [190, 285], 'shoulder_mass_center': [340, 275.3333333333], 'upper_thorax': [319, 247.3333333333]}
for point in points.values():
    assert mask.getpixel(tuple(round(v) for v in point)) == 0
assert report['outside_mask_changed_pixels'] == 0
report.update({'version': '1.1.0', 'updated_at': datetime.now(ZoneInfo('Europe/Rome')).isoformat(), 'source_sha256': core.digest(before_path), 'raw_sha256': core.digest(raw_path), 'mask_sha256': core.digest(mask_path), 'final_sha256': core.digest(args.out / '003_C_C_masked_v1.1.0_20261031.png'), 'tool_revision': '870e1274aee5fd42ede786cff7eec944087c7771', 'tool_modules': {name: core.digest(args.tool_root / 'scripts' / name) for name in ['sprite_edits.py', 'sprite_patches/raster.py', 'sprite_patches/registration.py', 'sprite_patches/verification.py']}, 'registration': mapping, 'registration_basis': 'Pinned core.match_region photometric initialization on stable thorax ROI (260,250,64,40), scales 0.400..0.440 in 0.002 steps; selected best score 8.89935 at 0.414,+3,+5. Photometric score is not anatomical precision. Final stable-body registration is identity because protected RGBA is preserved.', 'global_alignment': {'matrix': [1, 0, 0, 0, 1, 0], 'stable_landmarks': points, 'residual_px': 0, 'basis': 'Exact unchanged RGBA outside mask; landmark coordinates manually estimated, not raw fitted points.'}, 'canvas': list(final.size), 'mask_application': checks, 'gif': gif, 'timing': 'Two 500ms diagnostic exposures; no production timing or physical contact certification.', 'status': 'candidate_awaiting_visual_approval'})
(args.out / 'VERIFICATION_C_C_v1.1.0_20261031.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
(args.out / 'RECIPE_C_C_v1.1.0_20261031.json').write_text(json.dumps({'version': '1.1.0', 'frames': [{'edits': [op]}]}, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k: report[k] for k in ['outside_mask_changed_pixels', 'inside_mask_changed_pixels', 'final_sha256']}))

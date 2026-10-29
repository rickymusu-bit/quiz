"""Wait for the native iframe resize before advancing a virtual browser clock."""
from playwright.sync_api import expect


def set_viewport(page, view, width, height):
    page.set_viewport_size({'width': width, 'height': height})
    # CDP can acknowledge the outer viewport before the iframe receives its resize.
    expect(view.locator('html')).to_have_js_property('clientWidth', width)
    expect(view.locator('html')).to_have_js_property('clientHeight', height)
    gate = view.locator('#orientation-note')
    stage = view.locator('#viewport-stage')
    if width <= height:
        expect(gate).to_be_visible()
        expect(stage).to_be_hidden()
    else:
        expect(gate).to_be_hidden()
        expect(stage).to_be_visible()

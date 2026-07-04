"""
Generate Sus Score icons — detective magnifying glass.
Zero dependencies, pure Python stdlib.
"""
import struct, zlib, math, os

def make_png(size):
    w = h = size
    s = size
    def sc(v): return v * s / 128

    # ── Colors ────────────────────────────────────────────────────────────────
    BG_DARK   = (15,  25,  40,  255)   # deep navy
    RING_COL  = (47,  128, 192, 255)   # mist blue border
    MAG_COL   = (248, 250, 252, 255)   # white magnifier circle
    HANDLE    = (126, 200, 227, 255)   # cyan handle
    GLASS_COL = (126, 200, 227, 255)   # cyan lenses
    LENS_FILL = (47,  128, 192, 60 )   # subtle blue fill inside lenses
    GLINT     = (255, 255, 255, 200)

    # ── Geometry ──────────────────────────────────────────────────────────────
    cx, cy = s / 2, s / 2
    bg_r = s / 2 - 1

    # Magnifying glass — upper right
    mag_cx, mag_cy = sc(72), sc(50)
    mag_r  = sc(24)
    mag_sw = max(1.5, sc(5.5))

    # Handle
    hx1, hy1 = sc(90), sc(68)
    hx2, hy2 = sc(108), sc(90)
    hsw = max(1.5, sc(7))

    # Glasses — lower portion
    gy     = sc(82)
    gl_cx  = sc(36)
    gr_cx  = sc(64)
    g_r    = sc(15)
    g_sw   = max(1.0, sc(4))
    # arms
    lax1, lay1, lax2, lay2 = sc(21), gy, sc(13), sc(76)
    rax1, ray1, rax2, ray2 = sc(79), gy, sc(90), sc(76)

    # Glint
    glt_cx, glt_cy, glt_r = sc(64), sc(43), max(1, sc(4))

    # ── Helpers ───────────────────────────────────────────────────────────────
    def dist(x, y, px, py):
        return math.sqrt((x-px)**2 + (y-py)**2)

    def in_ring(x, y, pcx, pcy, r, sw):
        d = dist(x, y, pcx, pcy)
        return abs(d - r) <= sw / 2

    def in_circle(x, y, pcx, pcy, r):
        return dist(x, y, pcx, pcy) <= r

    def on_seg(x, y, x1, y1, x2, y2, sw):
        dx, dy = x2-x1, y2-y1
        length = math.sqrt(dx*dx + dy*dy)
        if length < 0.001:
            return dist(x, y, x1, y1) <= sw/2
        t = max(0, min(1, ((x-x1)*dx + (y-y1)*dy) / (length*length)))
        return dist(x, y, x1+t*dx, y1+t*dy) <= sw/2

    def mix(fg, bg, a):
        f = a / 255
        return (
            min(255, int(fg[0]*f + bg[0]*(1-f))),
            min(255, int(fg[1]*f + bg[1]*(1-f))),
            min(255, int(fg[2]*f + bg[2]*(1-f))),
            255
        )

    rows = []
    for row in range(h):
        row_bytes = []
        for col in range(w):
            x, y = col + 0.5, row + 0.5
            r, g, b, a = 0, 0, 0, 0  # transparent default

            # Background circle
            if in_circle(x, y, cx, cy, bg_r):
                r, g, b, a = BG_DARK

            # Border ring
            if in_ring(x, y, cx, cy, bg_r, max(1.5, sc(3))):
                r, g, b, a = RING_COL

            # Magnifier lens fill (subtle)
            if in_circle(x, y, mag_cx, mag_cy, mag_r - mag_sw/2):
                base = (r, g, b, a)
                fg = LENS_FILL
                r, g, b, a = mix(fg, base, fg[3])

            # Magnifier circle stroke
            if in_ring(x, y, mag_cx, mag_cy, mag_r, mag_sw):
                r, g, b, a = MAG_COL

            # Handle
            if on_seg(x, y, hx1, hy1, hx2, hy2, hsw):
                r, g, b, a = HANDLE

            # Glasses left lens fill
            if in_circle(x, y, gl_cx, gy, g_r - g_sw/2):
                base = (r, g, b, a)
                fg = LENS_FILL
                r, g, b, a = mix(fg, base, fg[3])

            # Glasses right lens fill
            if in_circle(x, y, gr_cx, gy, g_r - g_sw/2):
                base = (r, g, b, a)
                fg = LENS_FILL
                r, g, b, a = mix(fg, base, fg[3])

            # Glasses left ring
            if in_ring(x, y, gl_cx, gy, g_r, g_sw):
                r, g, b, a = GLASS_COL

            # Glasses right ring
            if in_ring(x, y, gr_cx, gy, g_r, g_sw):
                r, g, b, a = GLASS_COL

            # Bridge between lenses
            if on_seg(x, y, gl_cx + g_r, gy, gr_cx - g_r, gy, g_sw * 0.8):
                r, g, b, a = GLASS_COL

            # Left arm
            if on_seg(x, y, lax1, lay1, lax2, lay2, g_sw * 0.9):
                r, g, b, a = GLASS_COL

            # Right arm
            if on_seg(x, y, rax1, ray1, rax2, ray2, g_sw * 0.9):
                r, g, b, a = GLASS_COL

            # Glint inside magnifier
            if in_circle(x, y, glt_cx, glt_cy, glt_r):
                r, g, b, a = GLINT

            row_bytes.extend([r, g, b, a])
        rows.append(bytes(row_bytes))

    return _encode_png(w, h, rows)


def _encode_png(w, h, rows):
    def chunk(name, data):
        c = name + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xFFFFFFFF)

    sig  = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>II', w, h) + bytes([8, 6, 0, 0, 0]))
    raw  = b''.join(b'\x00' + r for r in rows)
    idat = chunk(b'IDAT', zlib.compress(raw, 9))
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend


out = os.path.dirname(os.path.abspath(__file__))
for size in [16, 48, 128]:
    data = make_png(size)
    path = os.path.join(out, f'icon{size}.png')
    with open(path, 'wb') as f:
        f.write(data)
    print(f'✓ icon{size}.png  ({size}×{size}, {len(data):,} bytes)')

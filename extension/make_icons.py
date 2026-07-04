"""
Generate Dark Pattern Detector extension icons as PNG files.
Draws a minimalist detective magnifying glass icon.
Uses only Python stdlib (no external deps).
"""
import struct, zlib, math, os

def make_png(size):
    """Create a PNG from scratch — no Pillow needed."""
    w, h = size, size
    pixels = []

    # Colors (RGBA)
    BG       = (10,  10,  15,  255)   # #0a0a0f
    TRANSP   = (0,   0,   0,   0)
    BLUE     = (47,  128, 192, 255)   # #2f80c0 accent
    CYAN     = (126, 200, 227, 255)   # #7ec8e3 accent-light
    WHITE    = (248, 250, 252, 200)   # slight transparency

    def dist(x, y, cx, cy):
        return math.sqrt((x - cx)**2 + (y - cy)**2)

    def in_ring(x, y, cx, cy, r, thickness):
        d = dist(x, y, cx, cy)
        return r - thickness <= d <= r

    def on_line(x, y, x1, y1, x2, y2, thickness):
        """Check if (x,y) is within `thickness/2` pixels of segment (x1,y1)-(x2,y2)."""
        dx, dy = x2 - x1, y2 - y1
        length = math.sqrt(dx*dx + dy*dy)
        if length == 0:
            return dist(x, y, x1, y1) <= thickness / 2
        t = max(0, min(1, ((x - x1)*dx + (y - y1)*dy) / (length*length)))
        proj_x = x1 + t * dx
        proj_y = y1 + t * dy
        return dist(x, y, proj_x, proj_y) <= thickness / 2

    def blend(fg, bg, alpha):
        a = alpha / 255
        return (
            int(fg[0]*a + bg[0]*(1-a)),
            int(fg[1]*a + bg[1]*(1-a)),
            int(fg[2]*a + bg[2]*(1-a)),
            255
        )

    s = size
    # Scaled coordinates (designed for 128x128, scale to `s`)
    def sc(v): return v * s / 128

    # Key geometry
    mag_cx, mag_cy, mag_r = sc(72), sc(52), sc(22)
    mag_stroke = max(2, sc(5))
    handle_x1, handle_y1 = sc(88), sc(68)
    handle_x2, handle_y2 = sc(106), sc(90)
    handle_stroke = max(2, sc(6))

    glasses_y    = sc(76)
    glass_l_cx   = sc(38)
    glass_r_cx   = sc(66)
    glass_r_val  = sc(13)
    glass_stroke = max(1, sc(4))
    arm_stroke   = max(1, sc(3.5))
    # bridge
    bx1, by1 = sc(51), glasses_y
    bx2, by2 = sc(51), glasses_y
    # left arm
    lax1, lay1 = sc(25), glasses_y
    lax2, lay2 = sc(15), sc(71)
    # right arm
    rax1, ray1 = sc(79), glasses_y
    rax2, ray2 = sc(92), sc(71)

    # glint
    glint_cx, glint_cy, glint_r = sc(65), sc(45), max(1, sc(3))

    for row in range(h):
        row_pixels = []
        for col in range(w):
            x, y = col + 0.5, row + 0.5

            # Start with transparent
            r, g, b, a = TRANSP

            # Background circle
            if dist(x, y, s/2, s/2) <= s/2 - sc(1):
                r, g, b, a = BG

            # Outer border ring
            if in_ring(x, y, s/2, s/2, s/2 - sc(1), sc(3)):
                r, g, b, a = BLUE

            # Magnifying glass circle
            if in_ring(x, y, mag_cx, mag_cy, mag_r, mag_stroke):
                r, g, b, a = CYAN

            # Handle
            if on_line(x, y, handle_x1, handle_y1, handle_x2, handle_y2, handle_stroke):
                r, g, b, a = CYAN

            # Glasses left lens
            if in_ring(x, y, glass_l_cx, glasses_y, glass_r_val, glass_stroke):
                r, g, b, a = BLUE

            # Glasses right lens
            if in_ring(x, y, glass_r_cx, glasses_y, glass_r_val, glass_stroke):
                r, g, b, a = BLUE

            # Bridge (dot between lenses)
            if on_line(x, y, sc(51), glasses_y - sc(0.5), sc(51), glasses_y + sc(0.5), glass_stroke * 2):
                r, g, b, a = BLUE

            # Left arm
            if on_line(x, y, lax1, lay1, lax2, lay2, arm_stroke):
                r, g, b, a = BLUE

            # Right arm
            if on_line(x, y, rax1, ray1, rax2, ray2, arm_stroke):
                r, g, b, a = BLUE

            # Glint inside magnifying glass
            if dist(x, y, glint_cx, glint_cy) <= glint_r:
                r, g, b, a = WHITE

            row_pixels.extend([r, g, b, a])
        pixels.append(bytes(row_pixels))

    return encode_png(w, h, pixels)

def encode_png(w, h, rows):
    def chunk(name, data):
        c = name + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)  # 8-bit RGBA = type 6
    # Actually use type 6 = RGBA
    ihdr_data = struct.pack('>II', w, h) + bytes([8, 6, 0, 0, 0])
    ihdr = chunk(b'IHDR', ihdr_data)

    raw = b''
    for row in rows:
        raw += b'\x00' + row  # filter type None for each row

    idat = chunk(b'IDAT', zlib.compress(raw, 9))
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend

out_dir = os.path.dirname(os.path.abspath(__file__))
for size in [16, 48, 128]:
    data = make_png(size)
    path = os.path.join(out_dir, f'icon{size}.png')
    with open(path, 'wb') as f:
        f.write(data)
    print(f'Created {path} ({len(data)} bytes)')

print('Done.')

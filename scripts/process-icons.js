/**
 * Script xử lý icon gốc (icon-goc.jpg) bằng Sharp:
 * - Tự động tìm bounding-box khít của icon
 * - Flood-fill từ 4 góc để tách chính xác nền trắng bên ngoài (không ảnh hưởng chi tiết trắng bên trong)
 * - Xuất Phiên bản A (Full-bleed #9ECAF2 cho iOS/Android/PWA)
 * - Xuất Phiên bản B (Nền trong suốt cho Favicon & Logo Web)
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const INPUT_PATH = path.join(__dirname, '..', 'icon-goc.jpg');
const OUT_DIR = path.join(__dirname, '..', 'assets', 'icons');

async function run() {
  if (!fs.existsSync(INPUT_PATH)) {
    throw new Error(`Không tìm thấy file ảnh gốc tại: ${INPUT_PATH}`);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Đọc ảnh gốc dạng RGBA raw buffer
  const { data, info } = await sharp(INPUT_PATH)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const totalPixels = width * height;

  // 1. Flood-fill từ 4 cạnh ngoài để tìm chính xác vùng nền trắng bên ngoài đường viền xanh đậm
  const isExterior = new Uint8Array(totalPixels);
  const visited = new Uint8Array(totalPixels);
  const queue = new Int32Array(totalPixels);
  let head = 0;
  let tail = 0;

  const isNearWhite = (idx) => {
    const off = idx * channels;
    const r = data[off];
    const g = data[off + 1];
    const b = data[off + 2];
    // Ngưỡng nhận diện nền trắng JPEG (có thể hơi nhiễu ~235-255)
    return r >= 232 && g >= 232 && b >= 232;
  };

  const enqueue = (x, y) => {
    const idx = y * width + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    if (isNearWhite(idx)) {
      isExterior[idx] = 1;
      queue[tail++] = idx;
    }
  };

  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (head < tail) {
    const idx = queue[head++];
    const x = idx % width;
    const y = (idx - x) / width;

    if (x > 0) enqueue(x - 1, y);
    if (x < width - 1) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y < height - 1) enqueue(x, y + 1);
  }

  // 2. Tìm bounding-box khít của phần icon (tất cả pixel không phải nền ngoài)
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!isExterior[idx]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;
  console.log(`Original: ${width}x${height} | Tight Bounding Box: x=${minX}, y=${minY}, w=${boxW}, h=${boxH}`);

  // =========================================================================
  // PHIÊN BẢN B: Nền trong suốt (cho Favicon 64x64 & Logo Web 128x128)
  // =========================================================================
  const transparentBuf = Buffer.from(data);
  for (let i = 0; i < totalPixels; i++) {
    const off = i * 4;
    if (isExterior[i]) {
      transparentBuf[off + 3] = 0;
    } else {
      // Khử viền trắng mờ (anti-aliased fringe) ở các pixel tiếp giáp vùng exterior
      const x = i % width;
      const y = (i - x) / width;
      let touchesExterior = false;
      if (x > 0 && isExterior[i - 1]) touchesExterior = true;
      else if (x < width - 1 && isExterior[i + 1]) touchesExterior = true;
      else if (y > 0 && isExterior[i - width]) touchesExterior = true;
      else if (y < height - 1 && isExterior[i + width]) touchesExterior = true;

      if (touchesExterior) {
        const lum = (transparentBuf[off] + transparentBuf[off + 1] + transparentBuf[off + 2]) / 3;
        if (lum > 195) {
          transparentBuf[off + 3] = Math.max(0, Math.round((232 - lum) * 4));
        }
      }
    }
  }

  const baseTransparent = sharp(transparentBuf, { raw: { width, height, channels: 4 } })
    .extract({ left: minX, top: minY, width: boxW, height: boxH });

  await baseTransparent.clone().resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(OUT_DIR, 'favicon.png'));

  await baseTransparent.clone().resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(OUT_DIR, 'logo-web.png'));

  console.log('✓ Đã xuất Phiên bản B (nền trong suốt): favicon.png (64x64), logo-web.png (128x128)');

  // =========================================================================
  // PHIÊN BẢN A: Full-bleed Square (lấp 4 góc bằng #9ECAF2 + zoom nhẹ ~4%)
  // =========================================================================
  const fullBleedBuf = Buffer.from(data);
  for (let i = 0; i < totalPixels; i++) {
    if (isExterior[i]) {
      const off = i * 4;
      fullBleedBuf[off] = 158;     // #9E
      fullBleedBuf[off + 1] = 202; // #CA
      fullBleedBuf[off + 2] = 242; // #F2
      fullBleedBuf[off + 3] = 255;
    }
  }

  // Crop vào sát ~4% từ bounding box để loại bỏ hoàn toàn viền trắng và giữ icon đầy đặn khi iOS/Android bo góc
  const insetX = Math.round(boxW * 0.04);
  const insetY = Math.round(boxH * 0.04);
  const cropLeft = minX + insetX;
  const cropTop = minY + insetY;
  const cropW = boxW - insetX * 2;
  const cropH = boxH - insetY * 2;

  const baseFullBleed = sharp(fullBleedBuf, { raw: { width, height, channels: 4 } })
    .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH });

  await baseFullBleed.clone().resize(180, 180, { fit: 'cover' })
    .png()
    .toFile(path.join(OUT_DIR, 'apple-touch-icon.png'));

  await baseFullBleed.clone().resize(192, 192, { fit: 'cover' })
    .png()
    .toFile(path.join(OUT_DIR, 'icon-192.png'));

  await baseFullBleed.clone().resize(512, 512, { fit: 'cover' })
    .png()
    .toFile(path.join(OUT_DIR, 'icon-512.png'));

  console.log('✓ Đã xuất Phiên bản A (full-bleed #9ECAF2): apple-touch-icon.png (180x180), icon-192.png (192x192), icon-512.png (512x512)');
}

run().catch((err) => {
  console.error('Lỗi xử lý icon:', err);
  process.exit(1);
});

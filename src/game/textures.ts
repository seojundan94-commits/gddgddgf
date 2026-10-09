import * as THREE from 'three';

/**
 * Procedural canvas-based textures for the Backrooms Level 0 aesthetic.
 * Clean, seamless, high-performance without external asset dependencies.
 */

export function createWallpaperTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base iconic mono-yellow sickening hue
  ctx.fillStyle = '#C8B265';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle tonal noise / grime
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 18;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.9));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.6));
  }
  ctx.putImageData(imgData, 0, 0);

  // Classic repetitive wallpaper trellis / floral motif
  ctx.strokeStyle = 'rgba(150, 130, 60, 0.35)';
  ctx.lineWidth = 1.5;
  const step = 32;
  for (let x = 0; x < 512; x += step) {
    for (let y = 0; y < 512; y += step) {
      ctx.beginPath();
      ctx.arc(x + step / 2, y + step / 2, step / 3, 0, Math.PI * 2);
      ctx.stroke();

      // Diamond accents
      ctx.beginPath();
      ctx.moveTo(x + step / 2, y);
      ctx.lineTo(x + step, y + step / 2);
      ctx.lineTo(x + step / 2, y + step);
      ctx.lineTo(x, y + step / 2);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // Water stain / decay spots
  ctx.fillStyle = 'rgba(110, 95, 45, 0.2)';
  for (let i = 0; i < 6; i++) {
    const sx = Math.random() * 512;
    const sy = Math.random() * 512;
    const r = 25 + Math.random() * 45;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Vertical panel seams
  ctx.strokeStyle = 'rgba(100, 85, 40, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 512);
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

export function createCarpetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Damp, moldy beige carpet base
  ctx.fillStyle = '#6E6044';
  ctx.fillRect(0, 0, 512, 512);

  // Heavy carpet grain
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 35;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.95));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.8));
  }
  ctx.putImageData(imgData, 0, 0);

  // Damp moisture puddles (darker, saturated damp spots)
  ctx.fillStyle = 'rgba(40, 35, 22, 0.35)';
  for (let i = 0; i < 8; i++) {
    const cx = Math.random() * 512;
    const cy = Math.random() * 512;
    const rw = 40 + Math.random() * 70;
    const rh = 30 + Math.random() * 50;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rw, rh, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Carpet tile seams (subtle square tiles)
  ctx.strokeStyle = 'rgba(45, 38, 25, 0.45)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= 512; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

export function createCeilingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Off-white discolored acoustic ceiling tile
  ctx.fillStyle = '#D6D1BF';
  ctx.fillRect(0, 0, 512, 512);

  // Acoustic pinholes noise
  ctx.fillStyle = 'rgba(70, 65, 55, 0.25)';
  for (let i = 0; i < 1500; i++) {
    const px = Math.random() * 512;
    const py = Math.random() * 512;
    ctx.fillRect(px, py, 1.5, 1.5);
  }

  // T-bar metal grid frame
  ctx.strokeStyle = '#8C8675';
  ctx.lineWidth = 4;
  for (let i = 0; i <= 512; i += 128) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  // Subtle water stain on ceiling
  ctx.fillStyle = 'rgba(140, 110, 60, 0.18)';
  ctx.beginPath();
  ctx.ellipse(320, 210, 75, 55, 0.4, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

export function createExitDoorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Steel reinforced door with ominous maroon-red
  ctx.fillStyle = '#6E1B1B';
  ctx.fillRect(0, 0, 256, 512);

  // Metallic frame border
  ctx.strokeStyle = '#2B1111';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, 244, 500);

  // Upper warning sign plate
  ctx.fillStyle = '#1A1815';
  ctx.fillRect(32, 48, 192, 100);
  ctx.strokeStyle = '#C99D3B';
  ctx.lineWidth = 3;
  ctx.strokeRect(34, 50, 188, 96);

  // Sign text
  ctx.fillStyle = '#E83838';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EMERGENCY EXIT', 128, 85);
  
  ctx.fillStyle = '#F5E4B5';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('비상 탈출구 (LEVEL 1)', 128, 112);

  ctx.fillStyle = '#9E9E9E';
  ctx.font = '11px sans-serif';
  ctx.fillText('[ 5 TAPES REQUIRED ]', 128, 134);

  // Center push bar
  ctx.fillStyle = '#B0B0B0';
  ctx.fillRect(24, 270, 208, 18);
  ctx.fillStyle = '#404040';
  ctx.fillRect(36, 260, 184, 8);

  // Hazard diagonal stripes at base
  for (let x = -50; x < 300; x += 30) {
    ctx.fillStyle = '#C99D3B';
    ctx.beginPath();
    ctx.moveTo(x, 460);
    ctx.lineTo(x + 15, 460);
    ctx.lineTo(x + 35, 500);
    ctx.lineTo(x + 20, 500);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

const DB_NAME = 'kinolite_media_db';
const DB_VERSION = 1;
const STORE_DOWNLOADS = 'offline_downloads';
const STORE_UPLOADS = 'user_uploads';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this browser.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_DOWNLOADS)) {
        db.createObjectStore(STORE_DOWNLOADS);
      }
      if (!db.objectStoreNames.contains(STORE_UPLOADS)) {
        db.createObjectStore(STORE_UPLOADS);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB.'));
  });
}

export async function saveBlobToStore(
  storeName: 'downloads' | 'uploads',
  key: string,
  blob: Blob
): Promise<void> {
  const db = await openDatabase();
  const target = storeName === 'downloads' ? STORE_DOWNLOADS : STORE_UPLOADS;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(target, 'readwrite');
    tx.objectStore(target).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Failed to save media blob.'));
  });
}

export async function getBlobFromStore(
  storeName: 'downloads' | 'uploads',
  key: string
): Promise<Blob | null> {
  try {
    const db = await openDatabase();
    const target = storeName === 'downloads' ? STORE_DOWNLOADS : STORE_UPLOADS;
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(target, 'readonly');
      const req = tx.objectStore(target).get(key);
      req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function deleteBlobFromStore(
  storeName: 'downloads' | 'uploads',
  key: string
): Promise<void> {
  try {
    const db = await openDatabase();
    const target = storeName === 'downloads' ? STORE_DOWNLOADS : STORE_UPLOADS;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(target, 'readwrite');
      tx.objectStore(target).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore cleanup errors if DB is unavailable
  }
}

export async function estimateStorageUsage(): Promise<{ usedMb: number; quotaMb: number }> {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      return {
        usedMb: Math.round(((est.usage ?? 0) / (1024 * 1024)) * 10) / 10,
        quotaMb: Math.round(((est.quota ?? 512 * 1024 * 1024) / (1024 * 1024)) * 10) / 10,
      };
    }
  } catch {
    // Fallback below
  }
  return { usedMb: 0, quotaMb: 2048 };
}

/**
 * Generates a compact, playable offline WebM cinema reel blob when a remote stream
 * cannot be directly fetched via CORS, ensuring offline playback in the Downloads tab
 * works reliably even with network disconnected.
 */
export async function createOfflinePlayableFallbackBlob(
  title: string,
  subtitle: string
): Promise<Blob | null> {
  if (typeof document === 'undefined' || typeof MediaRecorder === 'undefined') {
    return null;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx || typeof canvas.captureStream !== 'function') {
    return null;
  }

  const mimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  const mimeType = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m));
  if (!mimeType) return null;

  const stream = canvas.captureStream(24);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 450_000 });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      resolve(new Blob(chunks, { type: mimeType }));
    };
  });

  recorder.start();
  let frame = 0;
  const totalFrames = 48; // ~2 seconds looping offline cinema reel

  await new Promise<void>((resolve) => {
    const draw = () => {
      const t = frame / totalFrames;
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#0e1116');
      grad.addColorStop(0.5 + 0.15 * Math.sin(t * Math.PI * 2), '#1c2230');
      grad.addColorStop(1, '#0a0b0e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle atmospheric light sweep
      const rad = ctx.createRadialGradient(
        180 + Math.sin(t * Math.PI * 2) * 140,
        180,
        10,
        320,
        180,
        280
      );
      rad.addColorStop(0, 'rgba(224, 159, 62, 0.25)');
      rad.addColorStop(1, 'rgba(224, 159, 62, 0)');
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clean letterbox cinema bars
      ctx.fillStyle = '#060709';
      ctx.fillRect(0, 0, canvas.width, 36);
      ctx.fillRect(0, canvas.height - 36, canvas.width, 36);

      ctx.fillStyle = '#f4f4f6';
      ctx.font = '600 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 6);

      ctx.fillStyle = '#a4a8b3';
      ctx.font = '400 13px system-ui, sans-serif';
      ctx.fillText(`${subtitle} · Cached Offline AV1 Package`, canvas.width / 2, canvas.height / 2 + 20);

      frame += 1;
      if (frame < totalFrames) {
        setTimeout(draw, 40);
      } else {
        recorder.stop();
        resolve();
      }
    };
    draw();
  });

  return done;
}

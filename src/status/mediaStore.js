const DATABASE = "rentbridge-status-media";
const STORE = "media";
const objectUrls = new Map();

function openDatabase() {
  if (!window.indexedDB) return Promise.reject(new Error("Media storage is unavailable."));
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open media storage."));
  });
}

export async function saveStatusMedia(file) {
  const db = await openDatabase();
  const id = `status-media-${window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).put({ id, file });
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error("Could not save media."));
    transaction.onabort = () => reject(transaction.error || new Error("Media saving was cancelled."));
  });
  db.close();
  return id;
}

export async function getStatusMediaUrl(id) {
  if (!id) return null;
  if (objectUrls.has(id)) return objectUrls.get(id);
  const db = await openDatabase();
  const file = await new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
    request.onsuccess = () => resolve(request.result?.file || null);
    request.onerror = () => reject(request.error || new Error("Could not read media."));
  });
  db.close();
  if (!file) return null;
  const url = URL.createObjectURL(file);
  objectUrls.set(id, url);
  return url;
}

export async function deleteStatusMedia(id) {
  if (!id) return;
  const db = await openDatabase();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).delete(id);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error("Could not remove media."));
  });
  db.close();
  const url = objectUrls.get(id);
  if (url) URL.revokeObjectURL(url);
  objectUrls.delete(id);
}

export async function resolveStatusMedia(post) {
  const mediaUrl = post.mediaId ? await getStatusMediaUrl(post.mediaId).catch(() => null) : null;
  return { ...post, mediaUrl: mediaUrl || post.imageUrl || "", mediaType: post.mediaType || "image" };
}

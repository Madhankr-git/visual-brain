// IndexedDB Storage Engine for Visual Brain
// Provides robust, zero-dependency local browser persistence capable of storing
// high-resolution image data without the restrictive 5MB quota of localStorage.

import { SAMPLE_IMAGES } from "./sampleData";

const DB_NAME = "VisualBrainDB";
const DB_VERSION = 1;
const STORE_NAME = "images";

function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this browser"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("title", "title", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const StorageService = {
  // Initialize storage with sample data if first time
  async init() {
    try {
      const images = await this.getAllImages();
      if (!images || images.length === 0) {
        await this.seedSampleData();
        return await this.getAllImages();
      }
      return images;
    } catch (err) {
      console.warn("IndexedDB init failed, falling back to localStorage", err);
      return this.fallbackInit();
    }
  },

  async seedSampleData() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      SAMPLE_IMAGES.forEach((item) => store.put(item));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getAllImages() {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => {
          // Sort by creation date descending
          const result = request.result || [];
          result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          resolve(result);
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return this.fallbackGetAll();
    }
  },

  async getImageById(id) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return this.fallbackGetById(id);
    }
  },

  async saveImage(imageData) {
    const newImage = {
      ...imageData,
      id: imageData.id || `vb-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: imageData.createdAt || new Date().toISOString()
    };

    try {
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(newImage);
        request.onsuccess = () => resolve(newImage);
        request.onerror = () => reject(request.error);
      });
      return newImage;
    } catch {
      return this.fallbackSave(newImage);
    }
  },

  async updateImage(id, updates) {
    try {
      const existing = await this.getImageById(id);
      if (!existing) throw new Error("Image not found");
      const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(updated);
        request.onsuccess = () => resolve(updated);
        request.onerror = () => reject(request.error);
      });
      return updated;
    } catch {
      return this.fallbackUpdate(id, updates);
    }
  },

  async deleteImage(id) {
    try {
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      return true;
    } catch {
      return this.fallbackDelete(id);
    }
  },

  async resetData() {
    try {
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      await this.seedSampleData();
      return await this.getAllImages();
    } catch {
      localStorage.removeItem("visual_brain_images");
      return this.fallbackInit();
    }
  },

  // Fallbacks for non-IndexedDB environments
  fallbackGetAll() {
    try {
      const data = localStorage.getItem("visual_brain_images");
      return data ? JSON.parse(data) : [];
    } catch {
      return [...SAMPLE_IMAGES];
    }
  },

  fallbackInit() {
    const existing = this.fallbackGetAll();
    if (!existing || existing.length === 0) {
      localStorage.setItem("visual_brain_images", JSON.stringify(SAMPLE_IMAGES));
      return [...SAMPLE_IMAGES];
    }
    return existing;
  },

  fallbackGetById(id) {
    const all = this.fallbackGetAll();
    return all.find((item) => item.id === id);
  },

  fallbackSave(item) {
    const all = this.fallbackGetAll();
    const updated = [item, ...all.filter((x) => x.id !== item.id)];
    try {
      localStorage.setItem("visual_brain_images", JSON.stringify(updated));
    } catch (e) {
      console.warn("Storage quota exceeded in fallback", e);
    }
    return item;
  },

  fallbackUpdate(id, updates) {
    const all = this.fallbackGetAll();
    const item = all.find((x) => x.id === id);
    if (!item) return null;
    const updated = { ...item, ...updates };
    const list = all.map((x) => (x.id === id ? updated : x));
    localStorage.setItem("visual_brain_images", JSON.stringify(list));
    return updated;
  },

  fallbackDelete(id) {
    const all = this.fallbackGetAll();
    const filtered = all.filter((x) => x.id !== id);
    localStorage.setItem("visual_brain_images", JSON.stringify(filtered));
    return true;
  }
};

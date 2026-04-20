"use client";

import { createClient } from "@/lib/supabase/client";

export type ImageBucket =
  | "avatars"
  | "shop-images"
  | "post-images"
  | "covers"
  | "rec-shops";

/**
 * Resize an image using canvas. Keeps aspect ratio, max dimension `maxSize`,
 * re-encodes as JPEG at given quality.
 */
async function resizeImage(
  file: File,
  maxSize = 1200,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("読み込みに失敗"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("画像の解析に失敗"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height / width) * maxSize);
            width = maxSize;
          } else {
            width = Math.round((width / height) * maxSize);
            height = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("画像の変換に失敗"));
            resolve(blob);
          },
          "image/jpeg",
          quality
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an image to a Supabase Storage bucket and return the public URL.
 * Files are stored at `${userId}/${timestamp}-${rand}.jpg`.
 */
export async function uploadImage(
  bucket: ImageBucket,
  file: File,
  userId: string,
  options?: { maxSize?: number; quality?: number }
): Promise<{ url: string | null; error: string | null }> {
  try {
    const blob = await resizeImage(
      file,
      options?.maxSize ?? 1200,
      options?.quality ?? 0.85
    );
    const timestamp = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    const path = `${userId}/${timestamp}-${rand}.jpg`;

    const supabase = createClient();
    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      contentType: "image/jpeg",
      upsert: false,
    });

    if (error) {
      console.error("uploadImage error:", error.message);
      return { url: null, error: error.message };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("uploadImage exception:", msg);
    return { url: null, error: msg };
  }
}

/**
 * Delete an image from a bucket given its public URL.
 * Best-effort; ignores errors.
 */
export async function deleteImage(bucket: ImageBucket, url: string) {
  try {
    const marker = `/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return;
    const path = url.slice(idx + marker.length);
    const supabase = createClient();
    await supabase.storage.from(bucket).remove([path]);
  } catch {
    // ignore
  }
}

import { supabase } from '@/lib/supabase';

/**
 * A file_url stored in the database may be either:
 * 1. A storage path (e.g. "user-id/timestamp.jpg") — the preferred format
 * 2. A full signed URL from a previous version — we detect and extract the path
 * 3. An external URL (https://...) — returned as-is
 *
 * For private bucket files stored as paths, we generate a fresh signed URL
 * that won't expire for a long time (useful for previews/downloads).
 */

const PUBLIC_BUCKETS = ['profile-images'];

/** Extract the storage bucket + path from a stored file_url value. */
function parseStorageRef(fileUrl: string): { bucket: string; path: string } | null {
  // Signed URL: https://xxx.supabase.co/storage/v1/object/sign/{bucket}/{path}?token=...
  const signedMatch = fileUrl.match(/\/storage\/v1\/object\/sign\/([^/]+)\/(.+?)(\?|$)/);
  if (signedMatch) return { bucket: signedMatch[1], path: signedMatch[2] };

  // Public URL: https://xxx.supabase.co/storage/v1/object/public/{bucket}/{path}
  const publicMatch = fileUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
  if (publicMatch) return { bucket: publicMatch[1], path: publicMatch[2] };

  return null;
}

/**
 * Given a stored file_url and a bucket name, return a usable URL for the browser.
 * - If it's already a full http(s) URL that isn't a Supabase signed URL, return as-is.
 * - If it's a storage path, generate a signed URL (private bucket) or public URL (public bucket).
 * - Falls back to constructing a signed URL from the parsed ref.
 */
export async function resolveFileUrl(
  fileUrl: string | null,
  bucket: string,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!fileUrl) return null;

  // Never open temporary development or preview URLs as stored files.
  if (/localhost|127\.0\.0\.1|0\.0\.0\.0|webcontainer|bolt\.new/i.test(fileUrl)) return null;

  // Already a full external URL (not a Supabase storage URL)
  if (fileUrl.startsWith('http') && !fileUrl.includes('/storage/v1/object/')) {
    return fileUrl;
  }

  // It's a storage path (no leading http)
  if (!fileUrl.startsWith('http')) {
    if (PUBLIC_BUCKETS.includes(bucket)) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileUrl);
      return data.publicUrl;
    }
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(fileUrl, expiresIn);
    if (error) return null;
    return data.signedUrl;
  }

  // It's a full Supabase storage URL — parse it
  const ref = parseStorageRef(fileUrl);
  if (ref) {
    if (PUBLIC_BUCKETS.includes(ref.bucket)) {
      const { data } = supabase.storage.from(ref.bucket).getPublicUrl(ref.path);
      return data.publicUrl;
    }
    const { data, error } = await supabase.storage.from(ref.bucket).createSignedUrl(ref.path, expiresIn);
    if (error) return null;
    return data.signedUrl;
  }

  return fileUrl;
}

/**
 * Synchronous version for cases where we know the bucket is public.
 * Returns a public URL without any async call.
 */
export function resolvePublicUrl(fileUrl: string | null, bucket: string): string | null {
  if (!fileUrl) return null;
  if (fileUrl.startsWith('http') && !fileUrl.includes('/storage/v1/object/')) return fileUrl;
  if (!fileUrl.startsWith('http')) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileUrl);
    return data.publicUrl;
  }
  const ref = parseStorageRef(fileUrl);
  if (ref) {
    const { data } = supabase.storage.from(ref.bucket).getPublicUrl(ref.path);
    return data.publicUrl;
  }
  return fileUrl;
}

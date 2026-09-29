import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { publicEnv } from "@/config/public-env";
import { getServerEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";
import { generateToken } from "@/lib/security/tokens";

/*
 * Object storage for images, backed by Supabase Storage.
 *
 * Uploads always go through the server: the file is validated first, the object key is
 * generated here, and the browser never gets write access to the bucket. With
 * SUPABASE_SECRET_KEY set the bucket can stay closed to anonymous writes entirely.
 */

let client: SupabaseClient | undefined;

function getStorageClient(): SupabaseClient {
  if (client) return client;

  const env = getServerEnv();
  const key = env.SUPABASE_SECRET_KEY ?? publicEnv.supabase.publishableKey;
  if (!publicEnv.supabase.url || !key) {
    throw new AppError("UNAVAILABLE", "Image uploads are not configured yet.");
  }

  client = createClient(publicEnv.supabase.url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}

function bucketName() {
  return getServerEnv().SUPABASE_STORAGE_BUCKET;
}

export interface StoredObject {
  path: string;
  publicUrl: string;
}

/**
 * Stores an image under a random, unguessable name inside the given folder.
 * Folders are always derived from ids on the server, for example `organizations/<id>`.
 */
export async function uploadPublicImage(
  folder: string,
  image: { bytes: Uint8Array; contentType: string; extension: string },
): Promise<StoredObject> {
  const storage = getStorageClient().storage.from(bucketName());
  const path = `${folder}/${Date.now()}-${generateToken(9)}.${image.extension}`;

  const { error } = await storage.upload(path, image.bytes, {
    contentType: image.contentType,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    logger.error("storage upload failed", { path, error: error.message });
    throw new AppError("UNAVAILABLE", "We couldn't upload that image. Please try again.");
  }

  const { data } = storage.getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

/** Best effort: a failed cleanup should never fail the user's request. */
export async function deleteStoredObject(path: string | null | undefined): Promise<void> {
  if (!path) return;
  try {
    const { error } = await getStorageClient().storage.from(bucketName()).remove([path]);
    if (error) logger.warn("storage delete failed", { path, error: error.message });
  } catch (error) {
    logger.warn("storage delete failed", { path, error });
  }
}

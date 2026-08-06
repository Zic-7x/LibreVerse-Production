import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const rawUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!rawUrl || !key) {
    return null;
  }

  // Sanitize URL if ending with /rest/v1 or trailing slashes
  const baseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

  supabaseInstance = createClient(baseUrl, key, {
    auth: { persistSession: false },
  });

  return supabaseInstance;
}

export async function uploadToSupabaseBucket(
  bucket: string,
  path: string,
  fileData: Buffer | ArrayBuffer | Blob,
  contentType: string
): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.storage
    .from(bucket)
    .upload(path, fileData, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error(`Supabase Storage upload error [${bucket}/${path}]:`, error.message);
    return null;
  }

  const { data: urlData } = client.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}

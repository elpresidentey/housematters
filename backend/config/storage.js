/**
 * Property image storage.
 *
 * Serverless filesystems are read-only and wiped between invocations, so a local
 * `uploads/` directory only works for local development. When Supabase Storage is
 * configured the bytes go to a real bucket and the stored URL points at the public
 * object endpoint. Without it we fall back to local disk so `npm run dev` still works.
 */

const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'property-images';

const useSupabase = Boolean(supabaseUrl && serviceRoleKey);

let client = null;
if (useSupabase) {
  // Required lazily so local dev without Supabase never touches the dependency.
  const { createClient } = require('@supabase/supabase-js');
  client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const LOCAL_DIR = process.env.LOCAL_UPLOAD_DIR || path.join(__dirname, '..', 'uploads');

function ensureLocalDir() {
  if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true });
}

function publicUrl(key) {
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${key}`;
}

/**
 * Persist an image buffer.
 * @param {Buffer} buffer raw image bytes
 * @param {string} key storage key, unique per image
 * @param {string} contentType MIME type used for the stored object
 * @returns {Promise<{url: string, key: string, storage: 'supabase'|'local'}>}
 */
async function putImage(buffer, key, contentType) {
  if (!useSupabase) {
    // Serverless disks are read-only, so writing there always fails. Say so
    // plainly instead of surfacing an fs error from deep inside multer.
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      throw new Error(
        'Image storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
      );
    }
    ensureLocalDir();
    fs.writeFileSync(path.join(LOCAL_DIR, key), buffer);
    return { url: `/uploads/${key}`, key, storage: 'local' };
  }

  const { error } = await client.storage.from(bucket).upload(key, buffer, {
    contentType,
    upsert: false,
    cacheControl: '31536000',
  });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  return { url: publicUrl(key), key, storage: 'supabase' };
}

/** Remove a stored image. Returns true when something was deleted. */
async function deleteImage(key) {
  if (!useSupabase) {
    const filePath = path.join(LOCAL_DIR, path.basename(key));
    if (!fs.existsSync(filePath)) return false;
    fs.unlinkSync(filePath);
    return true;
  }

  const { error } = await client.storage.from(bucket).remove([key]);
  if (error) throw new Error(`Storage delete failed: ${error.message}`);
  return true;
}

module.exports = { putImage, deleteImage, useSupabase, bucket, LOCAL_DIR };
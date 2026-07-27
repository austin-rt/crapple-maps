import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from './supabase';

// Resize + compress on-device before upload (keeps storage small + uploads fast).
async function compress(uri: string): Promise<string> {
  try {
    const ctx = ImageManipulator.manipulate(uri).resize({ width: 1440 });
    const rendered = await ctx.renderAsync();
    const out = await rendered.saveAsync({ compress: 0.6, format: SaveFormat.JPEG });
    return out.uri;
  } catch {
    return uri; // fall back to original if manipulation fails
  }
}

// Pick up to `max` photos from the library. Returns local URIs (empty if cancelled).
export async function pickLogPhotos(max = 4): Promise<string[]> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: max,
    quality: 0.7,
  });
  if (res.canceled) return [];
  return res.assets.map((a) => a.uri);
}

// Upload local URIs to the log-photos bucket and insert matching `photos` rows.
// Auto-approved for MVP (no moderation pipeline yet). Returns the count uploaded.
export async function uploadLogPhotos(logId: string, userId: string, uris: string[]): Promise<number> {
  const rows: any[] = [];
  for (let i = 0; i < uris.length; i++) {
    const compressed = await compress(uris[i]);
    const arraybuffer = await fetch(compressed).then((r) => r.arrayBuffer());
    const path = `${userId}/${logId}/${Date.now()}_${i}.jpg`;
    const { error } = await supabase.storage
      .from('log-photos')
      .upload(path, arraybuffer, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('log-photos').getPublicUrl(path);
    rows.push({
      owner_type: 'log',
      owner_id: logId,
      uploaded_by: userId,
      url: data.publicUrl,
      visibility: 'friends',
      moderation_status: 'approved',
    });
  }
  if (rows.length) {
    const { error } = await supabase.from('photos').insert(rows);
    if (error) throw error;
  }
  return rows.length;
}

// Fetch photo URLs for a set of logs, grouped by log id.
export async function fetchLogPhotos(logIds: string[]): Promise<Record<string, string[]>> {
  if (!logIds.length) return {};
  const { data } = await supabase
    .from('photos')
    .select('owner_id,url,created_at')
    .eq('owner_type', 'log')
    .in('owner_id', logIds)
    .order('created_at', { ascending: true });
  const out: Record<string, string[]> = {};
  for (const p of data ?? []) (out[p.owner_id] ??= []).push(p.url);
  return out;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Minimal Supabase Data API client for the public bedtime guestbook.
 * Only the publishable key is used in the browser. Row-level security is the
 * database's security boundary; no service-role or secret key belongs here.
 */

export interface BedtimeThoughtRow {
  id: string;
  name: string;
  thought: string;
  stamp: string;
  created_at: string;
}

export interface NewBedtimeThought {
  name: string;
  thought: string;
  stamp: string;
}

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
const publishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl.startsWith('https://') &&
    supabaseUrl.includes('.supabase.co') &&
    publishableKey.startsWith('sb_publishable_')
  );
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured for this deployment.');
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: publishableKey,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    // Keep raw database/server details out of the user-facing interface.
    throw new Error(`Supabase request failed with status ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

export async function listBedtimeThoughts(limit = 50): Promise<BedtimeThoughtRow[]> {
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));
  return request<BedtimeThoughtRow[]>(
    `bedtime_thoughts?select=id,name,thought,stamp,created_at&order=created_at.desc&limit=${safeLimit}`
  );
}

export async function submitBedtimeThought(
  thought: NewBedtimeThought
): Promise<BedtimeThoughtRow> {
  const rows = await request<BedtimeThoughtRow[]>('bedtime_thoughts?select=id,name,thought,stamp,created_at', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      name: thought.name.trim(),
      thought: thought.thought.trim(),
      stamp: thought.stamp,
    }),
  });

  if (!rows[0]) {
    throw new Error('Supabase did not return the saved bedtime thought.');
  }
  return rows[0];
}

export function formatBedtimeThoughtTimestamp(value: string, now = Date.now()): string {
  const createdAt = Date.parse(value);
  if (!Number.isFinite(createdAt)) return 'Just now';

  const minutes = Math.max(0, Math.floor((now - createdAt) / 60_000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return new Date(createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

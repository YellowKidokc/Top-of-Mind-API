import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { scheduleSync } from '@/lib/sync';

interface Clip {
  id: string;
  content: string;
  title?: string;
  tags: string[];
  categories?: string[];
  pinned: boolean;
  slot?: number | null;
  ts?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

const CLIPS_STORAGE_KEY = 'pof2828_clips';

function normalizeClip(clip: Partial<Clip>): Clip {
  const now = new Date().toISOString();
  const created = clip.created_at || clip.createdAt || clip.ts || now;
  const updated = clip.updated_at || clip.updatedAt || created;
  return {
    id: clip.id || `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    content: clip.content || '',
    title: clip.title || '',
    tags: Array.isArray(clip.tags) ? clip.tags : [],
    categories: Array.isArray(clip.categories) ? clip.categories : [],
    pinned: !!clip.pinned,
    slot: clip.slot ?? null,
    ts: clip.ts || created,
    created_at: created,
    updated_at: updated,
    createdAt: created,
    updatedAt: updated,
  };
}

function readLocalClips(): Clip[] {
  try {
    const raw = localStorage.getItem(CLIPS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeClip) : [];
  } catch {
    return [];
  }
}

function writeLocalClips(clips: Clip[]): void {
  try {
    localStorage.setItem(CLIPS_STORAGE_KEY, JSON.stringify(clips.map(normalizeClip)));
    scheduleSync();
  } catch {
    // localStorage unavailable or full
  }
}

export function useClipsAPI() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClips = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<Clip[]>('/clips?limit=2000');
      if (Array.isArray(data)) {
        const normalized = data.map(normalizeClip);
        setClips(normalized);
        writeLocalClips(normalized);
      }
    } catch {
      const local = readLocalClips();
      if (local.length) setClips(local);
    }
    setLoading(false);
  }, []);

  const createClip = useCallback(async (clip: Partial<Clip>) => {
    const id = clip.id || `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const full = normalizeClip({ id, content: '', tags: [], pinned: false, ts: now, created_at: now, updated_at: now, ...clip });

    const applyLocal = () => {
      setClips(prev => {
        const next = [full, ...prev.filter(c => c.id !== full.id)];
        writeLocalClips(next);
        return next;
      });
    };

    try {
      await apiPost('/clips', full);
      applyLocal();
    } catch {
      applyLocal();
    }
    return id;
  }, []);

  const updateClip = useCallback(async (id: string, updates: Partial<Clip>) => {
    try {
      await apiPut(`/clips/${id}`, updates);
    } catch {}
    setClips(prev => {
      const next = prev.map(c => c.id === id ? normalizeClip({ ...c, ...updates, updated_at: new Date().toISOString() }) : c);
      writeLocalClips(next);
      return next;
    });
  }, []);

  const deleteClip = useCallback(async (id: string) => {
    try {
      await apiDelete(`/clips/${id}`);
    } catch {}
    setClips(prev => {
      const next = prev.filter(c => c.id !== id);
      writeLocalClips(next);
      return next;
    });
  }, []);

  return { clips, loading, fetchClips, createClip, updateClip, deleteClip };
}

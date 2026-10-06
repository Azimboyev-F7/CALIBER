import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { getServiceClient } from './supabaseServer';

export type UsageEvent = 'session_active' | 'activity_saved' | 'honor_saved' |
  'analysis_requested' | 'recommendations_requested' | 'activity_optimized';

const recentDevicePings = new Map<string, number>();

export function isValidDeviceId(deviceId: unknown): deviceId is string {
  if (typeof deviceId !== 'string') return false;
  const trimmed = deviceId.trim();
  if (trimmed.length < 8 || trimmed.length > 120) return false;
  if (trimmed.startsWith('account:')) return false;
  return /^[a-zA-Z0-9_-]+$/.test(trimmed);
}

export async function recordDeviceVisit(deviceId: string): Promise<boolean> {
  if (!isValidDeviceId(deviceId)) return false;
  const sanitized = deviceId.trim();

  // Deduplicate in memory (at most 1 database update per 15 minutes per device)
  const nowMs = Date.now();
  const lastTime = recentDevicePings.get(sanitized);
  if (lastTime && nowMs - lastTime < 15 * 60 * 1000) {
    return true;
  }
  recentDevicePings.set(sanitized, nowMs);

  if (recentDevicePings.size > 10000) {
    const cutoff = nowMs - 30 * 60 * 1000;
    for (const [id, ts] of recentDevicePings.entries()) {
      if (ts < cutoff) recentDevicePings.delete(id);
    }
  }

  try {
    const client = getServiceClient();
    if (!client) return false;
    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    const { data: existing, error: selErr } = await client
      .from('analytics_device_activity')
      .select('event_count')
      .eq('device_id', sanitized)
      .maybeSingle();

    if (selErr) throw selErr;

    if (!existing) {
      const { error: insErr } = await client.from('analytics_device_activity').insert({
        device_id: sanitized,
        first_active_at: now,
        last_active_at: now,
        event_count: 1
      });
      if (insErr) throw insErr;
    } else {
      const { error: updErr } = await client.from('analytics_device_activity').update({
        last_active_at: now,
        event_count: (Number(existing.event_count) || 0) + 1
      }).eq('device_id', sanitized);
      if (updErr) throw updErr;
    }

    const { data: dailyExisting, error: dailySelErr } = await client
      .from('analytics_daily_device_activity')
      .select('event_count')
      .eq('activity_date', today)
      .eq('device_id', sanitized)
      .maybeSingle();

    if (dailySelErr) throw dailySelErr;

    if (!dailyExisting) {
      const { error: dailyInsErr } = await client.from('analytics_daily_device_activity').insert({
        activity_date: today,
        device_id: sanitized,
        event_count: 1
      });
      if (dailyInsErr) throw dailyInsErr;
    } else {
      const { error: dailyUpdErr } = await client.from('analytics_daily_device_activity').update({
        event_count: (Number(dailyExisting.event_count) || 0) + 1
      }).eq('activity_date', today).eq('device_id', sanitized);
      if (dailyUpdErr) throw dailyUpdErr;
    }

    return true;
  } catch (err) {
    console.warn('[Analytics] Failed to record device visit:', err);
    return false;
  }
}

export async function recordUsage(userId: string, event: UsageEvent, deviceId?: string): Promise<boolean> {
  try {
    const client = getServiceClient();
    if (!client) return false;
    const validDeviceId = isValidDeviceId(deviceId) ? deviceId.trim() : null;
    const dedupeKey = event === 'session_active' ? String(Math.floor(Date.now() / 1_800_000)) : randomUUID();
    const { error } = await client.rpc('record_usage_event', {
      p_user_id: userId, p_event_name: event,
      p_device_id: validDeviceId,
      // Repeat visits/tabs within a 30 minute UTC bucket count as one presence event.
      p_dedupe_key: dedupeKey,
    });
    if (error && validDeviceId) {
      // Keep analytics from breaking during the brief rollout window before the
      // device-aware Supabase migration has been applied.
      const legacy = await client.rpc('record_usage_event', {
        p_user_id: userId, p_event_name: event, p_dedupe_key: dedupeKey,
      });
      if (legacy.error) throw error;
    } else if (error) {
      throw error;
    }
    if (validDeviceId) {
      void recordDeviceVisit(validDeviceId);
    }
    return true;
  } catch {
    console.warn('[Analytics] Event could not be recorded');
    return false;
  }
}

const successfulActions: Record<string, UsageEvent> = {
  '/student/activities': 'activity_saved', '/student/honors': 'honor_saved',
  '/analyze-profile': 'analysis_requested', '/recommend-colleges': 'recommendations_requested',
  '/optimize-activity': 'activity_optimized',
};

export function trackSuccessfulAction(req: Request, res: Response, next: NextFunction) {
  const event = req.method === 'POST' ? successfulActions[req.path] : undefined;
  if (event && res.locals.userId) {
    const userId = res.locals.userId;
    const deviceId = req.header('x-device-id') || undefined;
    res.once('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) void recordUsage(userId, event, deviceId);
    });
  }
  next();
}

import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { getServiceClient } from './supabaseServer';

export type UsageEvent = 'session_active' | 'activity_saved' | 'honor_saved' |
  'analysis_requested' | 'recommendations_requested' | 'activity_optimized';

export async function recordUsage(userId: string, event: UsageEvent, deviceId?: string): Promise<boolean> {
  try {
    const client = getServiceClient();
    if (!client) return false;
    const { error } = await client.rpc('record_usage_event', {
      p_user_id: userId, p_event_name: event,
      p_device_id: deviceId || null,
      // Repeat visits/tabs within a 30 minute UTC bucket count as one presence event.
      p_dedupe_key: event === 'session_active' ? String(Math.floor(Date.now() / 1_800_000)) : randomUUID(),
    });
    if (error) throw error;
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

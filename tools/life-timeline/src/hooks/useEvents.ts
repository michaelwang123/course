// src/hooks/useEvents.ts
// Event CRUD operations hook with 5000 limit check and offline detection
// 优化：使用 ref 避免 addEvent 闭包频繁重建，添加重试逻辑，安全类型映射

import { useState, useEffect, useCallback, useRef } from 'react';
import type { EventNode, EventNodeInput, EventCategory, EventSentiment } from '@/types/event';
import { MAX_EVENTS_PER_USER } from '@/types/event';
import { QUERY_TIMEOUT_MS } from '@/types/timeline';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export interface UseEventsReturn {
  events: EventNode[];
  isLoading: boolean;
  error: string | null;
  eventCount: number;
  isAtLimit: boolean;
  addEvent: (input: EventNodeInput) => Promise<EventNode>;
  updateEvent: (id: string, input: Partial<EventNodeInput>) => Promise<EventNode>;
  deleteEvent: (id: string) => Promise<void>;
  refreshEvents: () => Promise<void>;
}

/** Valid category values for runtime validation */
const VALID_CATEGORIES: Set<string> = new Set([
  'education', 'work', 'life', 'achievement', 'health', 'travel', 'other',
]);

/** Valid sentiment values for runtime validation */
const VALID_SENTIMENTS: Set<string> = new Set(['positive', 'neutral', 'negative']);

/**
 * Map snake_case DB row to camelCase EventNode with runtime validation.
 * Throws if critical fields are missing/invalid.
 */
function mapRowToEventNode(row: Record<string, unknown>): EventNode {
  const id = row.id;
  const userId = row.user_id;
  const title = row.title;
  const eventDate = row.event_date;
  const category = row.category as string;
  const sentiment = row.sentiment as string;
  const createdAt = row.created_at;
  const updatedAt = row.updated_at;

  if (typeof id !== 'string' || typeof userId !== 'string' || typeof title !== 'string') {
    throw new Error(`Invalid event row: missing id/user_id/title`);
  }
  if (typeof eventDate !== 'string') {
    throw new Error(`Invalid event row: missing event_date`);
  }
  if (!VALID_CATEGORIES.has(category)) {
    throw new Error(`Invalid category: ${category}`);
  }
  if (!VALID_SENTIMENTS.has(sentiment)) {
    throw new Error(`Invalid sentiment: ${sentiment}`);
  }

  return {
    id,
    userId,
    title,
    description: typeof row.description === 'string' ? row.description : '',
    eventDate,
    category: category as EventCategory,
    sentiment: sentiment as EventSentiment,
    createdAt: typeof createdAt === 'string' ? createdAt : new Date().toISOString(),
    updatedAt: typeof updatedAt === 'string' ? updatedAt : new Date().toISOString(),
  };
}

/** Map camelCase EventNodeInput to snake_case DB columns */
function mapInputToRow(input: EventNodeInput | Partial<EventNodeInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.title !== undefined) row.title = input.title;
  if (input.description !== undefined) row.description = input.description;
  if (input.eventDate !== undefined) row.event_date = input.eventDate;
  if (input.category !== undefined) row.category = input.category;
  if (input.sentiment !== undefined) row.sentiment = input.sentiment;
  return row;
}

/** Max retry attempts for initial data fetch */
const MAX_RETRIES = 3;
/** Base delay for exponential backoff (ms) */
const RETRY_BASE_DELAY = 1000;

/**
 * 事件 CRUD Hook
 * - 初次加载获取全部事件（最多5000条），查询超时5秒，失败自动重试最多3次
 * - 创建时检查5000上限，达上限拒绝创建
 * - 写操作时检查在线状态，离线时抛出网络错误
 * - 事件按 event_date DESC 排序
 */
export function useEvents(): UseEventsReturn {
  const [events, setEvents] = useState<EventNode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { isOnline } = useOnlineStatus();
  const { user } = useAuth();

  // Use refs for values accessed in callbacks to avoid stale closures
  const eventsRef = useRef(events);
  const isOnlineRef = useRef(isOnline);
  const userRef = useRef(user);

  useEffect(() => { eventsRef.current = events; }, [events]);
  useEffect(() => { isOnlineRef.current = isOnline; }, [isOnline]);
  useEffect(() => { userRef.current = user; }, [user]);

  const eventCount = events.length;
  const isAtLimit = eventCount >= MAX_EVENTS_PER_USER;

  const refreshEvents = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    let lastError: string | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS);

      try {
        const { data, error: queryError } = await supabase
          .from('life_timeline_events')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('event_date', { ascending: false })
          .limit(MAX_EVENTS_PER_USER)
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (queryError) {
          lastError = queryError.message;
          // Retry on server errors
          if (attempt < MAX_RETRIES - 1) {
            await new Promise(r => setTimeout(r, RETRY_BASE_DELAY * Math.pow(2, attempt)));
            continue;
          }
          break;
        }

        const mappedEvents = (data ?? []).map(mapRowToEventNode);
        setEvents(mappedEvents);
        setIsLoading(false);
        return; // Success — exit retry loop
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === 'AbortError') {
          lastError = '数据加载超时，请稍后重试';
        } else {
          lastError = err instanceof Error ? err.message : '加载事件数据失败';
        }

        if (attempt < MAX_RETRIES - 1) {
          await new Promise(r => setTimeout(r, RETRY_BASE_DELAY * Math.pow(2, attempt)));
          continue;
        }
      }
    }

    // All retries exhausted
    setError(lastError);
    setIsLoading(false);
  }, []);  // No deps — uses refs for current user

  const addEvent = useCallback(async (input: EventNodeInput): Promise<EventNode> => {
    if (!isOnlineRef.current) {
      const msg = '网络连接已断开，无法执行此操作';
      setError(msg);
      return Promise.reject(new Error(msg));
    }

    if (eventsRef.current.length >= MAX_EVENTS_PER_USER) {
      const msg = '事件数量已达上限 (5000)';
      setError(msg);
      return Promise.reject(new Error(msg));
    }

    const currentUser = userRef.current;
    if (!currentUser) {
      const msg = '用户未登录';
      setError(msg);
      return Promise.reject(new Error(msg));
    }

    try {
      const row = mapInputToRow(input);
      row.user_id = currentUser.id;

      const { data, error: insertError } = await supabase
        .from('life_timeline_events')
        .insert(row)
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return Promise.reject(new Error(insertError.message));
      }

      const newEvent = mapRowToEventNode(data);
      setEvents(prev => [newEvent, ...prev].sort((a, b) =>
        b.eventDate.localeCompare(a.eventDate)
      ));
      setError(null);
      return newEvent;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '保存事件失败';
      setError(msg);
      return Promise.reject(new Error(msg));
    }
  }, []);  // Stable — uses refs

  const updateEvent = useCallback(async (id: string, input: Partial<EventNodeInput>): Promise<EventNode> => {
    if (!isOnlineRef.current) {
      const msg = '网络连接已断开，无法执行此操作';
      setError(msg);
      return Promise.reject(new Error(msg));
    }

    const currentUser = userRef.current;
    if (!currentUser) {
      const msg = '用户未登录';
      setError(msg);
      return Promise.reject(new Error(msg));
    }

    try {
      const row = mapInputToRow(input);

      const { data, error: updateError } = await supabase
        .from('life_timeline_events')
        .update(row)
        .eq('id', id)
        .eq('user_id', currentUser.id)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
        return Promise.reject(new Error(updateError.message));
      }

      const updatedEvent = mapRowToEventNode(data);
      setEvents(prev =>
        prev
          .map(e => (e.id === id ? updatedEvent : e))
          .sort((a, b) => b.eventDate.localeCompare(a.eventDate))
      );
      setError(null);
      return updatedEvent;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '更新事件失败';
      setError(msg);
      return Promise.reject(new Error(msg));
    }
  }, []);  // Stable — uses refs

  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    if (!isOnlineRef.current) {
      const msg = '网络连接已断开，无法执行此操作';
      setError(msg);
      return Promise.reject(new Error(msg));
    }

    const currentUser = userRef.current;
    if (!currentUser) {
      const msg = '用户未登录';
      setError(msg);
      return Promise.reject(new Error(msg));
    }

    try {
      const { error: deleteError } = await supabase
        .from('life_timeline_events')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);

      if (deleteError) {
        setError(deleteError.message);
        return Promise.reject(new Error(deleteError.message));
      }

      setEvents(prev => prev.filter(e => e.id !== id));
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '删除事件失败';
      setError(msg);
      return Promise.reject(new Error(msg));
    }
  }, []);  // Stable — uses refs

  // Load events on mount and when user changes
  useEffect(() => {
    refreshEvents();
  }, [refreshEvents, user]);  // Re-fetch when user changes

  return {
    events,
    isLoading,
    error,
    eventCount,
    isAtLimit,
    addEvent,
    updateEvent,
    deleteEvent,
    refreshEvents,
  };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { listOrders } from '../api/mockApi';
import type { OrderPage, OrderStatus } from '../types';

export const AUTO_REFRESH_MS = 60_000;

export function useOrders(status: OrderStatus | 'all') {
  const [page, setPage] = useState<OrderPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  // Cursor that produced the current page (null == first page).
  const currentCursor = useRef<{ cursor: string | null; direction: 'next' | 'prev' }>({
    cursor: null,
    direction: 'next',
  });
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (cursor: string | null, direction: 'next' | 'prev') => {
      const id = ++requestId.current;
      setLoading(true);
      setError(null);
      try {
        const res = await listOrders({ status, cursor, direction });
        if (id !== requestId.current) return; // stale response
        currentCursor.current = { cursor, direction };
        setPage(res);
        setLastFetchedAt(new Date());
      } catch (e) {
        if (id !== requestId.current) return;
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [status],
  );

  // Reset to first page whenever the filter changes.
  useEffect(() => {
    fetchPage(null, 'next');
  }, [fetchPage]);

  // Silent auto-refresh. No push from the server – we just re-fetch.
  useEffect(() => {
    const t = setInterval(() => {
      const { cursor, direction } = currentCursor.current;
      fetchPage(cursor, direction);
    }, AUTO_REFRESH_MS);
    return () => clearInterval(t);
  }, [fetchPage]);

  const next = useCallback(() => {
    if (page?.nextCursor) fetchPage(page.nextCursor, 'next');
  }, [page, fetchPage]);

  const prev = useCallback(() => {
    if (page?.prevCursor) fetchPage(page.prevCursor, 'prev');
  }, [page, fetchPage]);

  const refresh = useCallback(() => {
    const { cursor, direction } = currentCursor.current;
    fetchPage(cursor, direction);
  }, [fetchPage]);

  return { page, loading, error, lastFetchedAt, next, prev, refresh };
}

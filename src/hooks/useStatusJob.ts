import { useCallback, useEffect, useRef, useState } from 'react';
import { getJob, requestStatusChange } from '../api/mockApi';
import type { JobState, Order, OrderStatus } from '../types';

export type JobPhase =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'polling'; jobId: string; job: JobState }
  | { kind: 'done'; order: Order }
  | { kind: 'failed'; reason: string };

/**
 * Wraps the async status-change job: submit, then poll /jobs/:id
 * until it is done or failed. The server offers no push channel.
 */
export function useStatusJob(onDone?: (order: Order) => void) {
  const [phase, setPhase] = useState<JobPhase>({ kind: 'idle' });
  const timer = useRef<number | null>(null);

  const stop = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => stop, []);

  const poll = useCallback(
    async (jobId: string) => {
      try {
        const job = await getJob(jobId);
        if (job.state === 'done') {
          setPhase({ kind: 'done', order: job.order });
          onDone?.(job.order);
          return;
        }
        if (job.state === 'failed') {
          setPhase({ kind: 'failed', reason: job.reason });
          return;
        }
        setPhase({ kind: 'polling', jobId, job });
        timer.current = window.setTimeout(() => poll(jobId), 700);
      } catch (e) {
        setPhase({ kind: 'failed', reason: e instanceof Error ? e.message : 'Poll failed' });
      }
    },
    [onDone],
  );

  const submit = useCallback(
    async (orderId: string, next: OrderStatus) => {
      stop();
      setPhase({ kind: 'submitting' });
      try {
        const { jobId } = await requestStatusChange(orderId, next);
        setPhase({ kind: 'polling', jobId, job: { state: 'queued' } });
        poll(jobId);
      } catch (e) {
        setPhase({ kind: 'failed', reason: e instanceof Error ? e.message : 'Request failed' });
      }
    },
    [poll],
  );

  const reset = useCallback(() => {
    stop();
    setPhase({ kind: 'idle' });
  }, []);

  return { phase, submit, reset };
}

import type { OrderStatus } from '../types';

// v1: engineering only differentiated the "bad" states.
export function StatusBadge({ status }: { status: OrderStatus }) {
  const cls =
    status === 'cancelled' || status === 'refunded' ? 'badge badge-danger' : 'badge';
  return <span className={cls}>{status}</span>;
}

import { useEffect, useState } from 'react';
import { ALLOWED_TRANSITIONS, getOrder } from '../api/mockApi';
import { useStatusJob } from '../hooks/useStatusJob';
import type { Order, OrderStatus } from '../types';
import { money } from '../format';
import { StatusBadge } from './StatusBadge';

interface Props {
  orderId: string;
  onClose: () => void;
  onOrderUpdated: (o: Order) => void;
}

export function OrderDrawer({ orderId, onClose, onOrderUpdated }: Props) {
  const [order, setOrder] = useState<Order | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus | ''>('');

  const { phase, submit, reset } = useStatusJob((updated) => {
    setOrder(updated);
    setNextStatus('');
    onOrderUpdated(updated);
  });

  useEffect(() => {
    let alive = true;
    setOrder(null);
    setErr(null);
    reset();
    getOrder(orderId)
      .then((o) => alive && setOrder(o))
      .catch((e) => alive && setErr(e.message));
    return () => {
      alive = false;
    };
  }, [orderId, reset]);

  const busy = phase.kind === 'submitting' || phase.kind === 'polling';
  const options = order ? ALLOWED_TRANSITIONS[order.status] : [];

  return (
    <aside className="drawer">
      <div className="drawer-head">
        <strong>{orderId}</strong>
        <button onClick={onClose}>X</button>
      </div>

      {err && <p className="error">{err}</p>}
      {!order && !err && <p className="muted">Loading...</p>}

      {order && (
        <div className="drawer-body">
          <p>
            <StatusBadge status={order.status} />
          </p>

          <h4>Customer</h4>
          <p>
            {order.customer.name}
            <br />
            {order.customer.email}
          </p>

          <h4>Ship to</h4>
          <p>
            {order.shippingAddress.line1}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.country}
          </p>

          <h4>Items</h4>
          <table className="items">
            <tbody>
              {order.items.map((it, i) => (
                <tr key={i}>
                  <td className="mono">{it.sku}</td>
                  <td>{it.name}</td>
                  <td className="num">x{it.qty}</td>
                  <td className="num">{money(it.qty * it.unitPriceCents)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3}>Shipping</td>
                <td className="num">{money(600)}</td>
              </tr>
              <tr>
                <td colSpan={3}>
                  <strong>Total</strong>
                </td>
                <td className="num">
                  <strong>{money(order.totalCents)}</strong>
                </td>
              </tr>
            </tbody>
          </table>

          {order.notes && (
            <>
              <h4>Notes</h4>
              <p>{order.notes}</p>
            </>
          )}

          <h4>Timestamps</h4>
          <p className="mono small">
            created: {order.createdAt}
            <br />
            updated: {order.updatedAt}
          </p>

          <h4>Change status</h4>
          {options.length === 0 ? (
            <p className="muted">No further transitions available.</p>
          ) : (
            <div className="status-form">
              <select
                value={nextStatus}
                disabled={busy}
                onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
              >
                <option value="">-- select --</option>
                {options.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                disabled={!nextStatus || busy}
                onClick={() => nextStatus && submit(order.id, nextStatus)}
              >
                {busy ? 'Working...' : 'Update'}
              </button>
            </div>
          )}

          {phase.kind === 'polling' && (
            <p className="muted small">job {phase.jobId}: {phase.job.state}</p>
          )}
          {phase.kind === 'done' && <p className="ok small">Status updated.</p>}
          {phase.kind === 'failed' && <p className="error small">{phase.reason}</p>}
        </div>
      )}
    </aside>
  );
}

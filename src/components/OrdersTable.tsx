import type { Order } from '../types';
import { StatusBadge } from './StatusBadge';
import { money } from '../format';

interface Props {
  orders: Order[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function OrdersTable({ orders, loading, selectedId, onSelect }: Props) {
  return (
    <div className="table-wrap">
      <table className="orders">
        <thead>
          <tr>
            <th>Order</th>
            <th>Created</th>
            <th>Customer</th>
            <th>Email</th>
            <th>Ship to</th>
            <th>Items</th>
            <th>Status</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr
              key={o.id}
              className={o.id === selectedId ? 'selected' : ''}
              onClick={() => onSelect(o.id)}
            >
              <td className="mono">{o.id}</td>
              <td className="mono">{o.createdAt}</td>
              <td>{o.customer.name}</td>
              <td>{o.customer.email}</td>
              <td>
                {o.shippingAddress.city}, {o.shippingAddress.country}
              </td>
              <td>{o.items.reduce((s, i) => s + i.qty, 0)}</td>
              <td>
                <StatusBadge status={o.status} />
              </td>
              <td className="num">{money(o.totalCents)}</td>
            </tr>
          ))}
          {orders.length === 0 && !loading && (
            <tr>
              <td colSpan={8}>No results</td>
            </tr>
          )}
        </tbody>
      </table>
      {loading && <div className="loading-overlay">Loading...</div>}
    </div>
  );
}

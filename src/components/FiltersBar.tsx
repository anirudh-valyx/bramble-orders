import { useState } from 'react';
import { ORDER_STATUSES, type OrderStatus } from '../types';

interface Props {
  status: OrderStatus | 'all';
  onStatusChange: (s: OrderStatus | 'all') => void;
  onSearch: (id: string) => void;
  onRefresh: () => void;
  lastFetchedAt: Date | null;
  loading: boolean;
}

export function FiltersBar({ status, onStatusChange, onSearch, onRefresh, lastFetchedAt, loading }: Props) {
  const [q, setQ] = useState('');
  return (
    <div className="filters">
      <label>
        Status:{' '}
        <select value={status} onChange={(e) => onStatusChange(e.target.value as OrderStatus | 'all')}>
          <option value="all">all</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <form
        className="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) onSearch(q);
        }}
      >
        <input
          placeholder="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit">Go</button>
      </form>

      <div className="spacer" />

      <span className="muted small">
        {lastFetchedAt ? `Last updated ${lastFetchedAt.toISOString()}` : ''}
      </span>
      <button onClick={onRefresh} disabled={loading}>
        Refresh
      </button>
    </div>
  );
}

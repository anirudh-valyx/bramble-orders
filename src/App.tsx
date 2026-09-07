import { useCallback, useEffect, useState } from 'react';
import { __simulateExternalChange } from './api/mockApi';
import { FiltersBar } from './components/FiltersBar';
import { OrderDrawer } from './components/OrderDrawer';
import { OrdersTable } from './components/OrdersTable';
import { Pager } from './components/Pager';
import { useOrders } from './hooks/useOrders';
import type { Order, OrderStatus } from './types';

export default function App() {
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { page, loading, error, lastFetchedAt, next, prev, refresh } = useOrders(status);

  // Other staff and the storefront change orders in the background.
  // The client is not notified; it only sees changes on the next fetch.
  useEffect(() => {
    const t = setInterval(__simulateExternalChange, 20_000);
    return () => clearInterval(t);
  }, []);

  const handleOrderUpdated = useCallback((_o: Order) => {
    // The list may now be stale (e.g. the order no longer matches the
    // filter). v1 just re-fetches the whole page.
    refresh();
  }, [refresh]);

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">Bramble</span>
        <nav>
          <a className="active">Orders</a>
          <a>Products</a>
          <a>Customers</a>
          <a>Settings</a>
        </nav>
      </header>

      <main className="content">
        <h2>Orders</h2>

        <FiltersBar
          status={status}
          onStatusChange={setStatus}
          onSearch={(id) => setSelectedId(id.trim())}
          onRefresh={refresh}
          lastFetchedAt={lastFetchedAt}
          loading={loading}
        />

        {error && <p className="error">Error: {error}</p>}

        <OrdersTable
          orders={page?.items ?? []}
          loading={loading}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <Pager
          hasPrev={!!page?.prevCursor}
          hasNext={!!page?.nextCursor}
          count={page?.items.length ?? 0}
          loading={loading}
          onPrev={prev}
          onNext={next}
        />
      </main>

      {selectedId && (
        <OrderDrawer
          orderId={selectedId}
          onClose={() => setSelectedId(null)}
          onOrderUpdated={handleOrderUpdated}
        />
      )}
    </div>
  );
}

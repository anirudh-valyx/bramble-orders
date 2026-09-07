interface Props {
  hasPrev: boolean;
  hasNext: boolean;
  count: number;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
}

// The API has no total count and no page numbers – cursor only.
export function Pager({ hasPrev, hasNext, count, loading, onPrev, onNext }: Props) {
  return (
    <div className="pager">
      <button onClick={onPrev} disabled={!hasPrev || loading}>
        &lt; Prev
      </button>
      <span className="muted small">Showing {count} orders</span>
      <button onClick={onNext} disabled={!hasNext || loading}>
        Next &gt;
      </button>
    </div>
  );
}

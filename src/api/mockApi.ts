/**
 * MOCK BACKEND
 * ------------
 * This file simulates the real Orders API. The constraints here are
 * deliberate and mirror what the real backend can and cannot do.
 * Do not "fix" them in the UI by working around them – the point of the
 * exercise is to design *with* them. See INTERVIEWER.md for the list.
 */
import type {
  JobState,
  ListOrdersParams,
  Order,
  OrderPage,
  OrderStatus,
} from '../types';

// ---------- deterministic seed data ----------

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

const FIRST = ['Aarav', 'Maya', 'Liam', 'Sofia', 'Noah', 'Priya', 'Ethan', 'Zara', 'Lucas', 'Hana', 'Omar', 'Elena', 'Kai', 'Ines', 'Rohan', 'Chloe', 'Mateo', 'Yuki', 'Amara', 'Felix'];
const LAST = ['Patel', 'Nguyen', 'Garcia', 'Okafor', 'Kim', 'Rossi', 'Schmidt', 'Silva', 'Haddad', 'Novak', 'Tanaka', 'Mensah', 'Lindqvist', 'Iyer', 'Dubois', 'Costa', 'Moreau', 'Ahmed', 'Brennan', 'Sato'];
const CITIES: Array<[string, string]> = [
  ['Austin', 'US'], ['Berlin', 'DE'], ['Bengaluru', 'IN'], ['Toronto', 'CA'], ['Lisbon', 'PT'],
  ['Sydney', 'AU'], ['Nairobi', 'KE'], ['Tokyo', 'JP'], ['São Paulo', 'BR'], ['Dublin', 'IE'],
];
const PRODUCTS: Array<[string, string, number]> = [
  ['BR-MUG-01', 'Stoneware Mug', 1800],
  ['BR-TEE-BLK', 'Organic Tee – Black', 3200],
  ['BR-TEE-WHT', 'Organic Tee – White', 3200],
  ['BR-CNDL-VN', 'Vanilla Soy Candle', 2400],
  ['BR-NB-A5', 'Dotted Notebook A5', 1400],
  ['BR-TOTE', 'Canvas Tote', 2200],
  ['BR-PSTR-01', 'Print – Morning Light (A3)', 4500],
  ['BR-HOOD-GRY', 'Fleece Hoodie – Grey', 6800],
  ['BR-SOCK-3', 'Wool Socks (3-pack)', 2100],
  ['BR-BOTTLE', 'Insulated Bottle 750ml', 3900],
];
const STATUS_WEIGHTS: Array<[OrderStatus, number]> = [
  ['pending', 8], ['paid', 20], ['packed', 12], ['shipped', 25],
  ['delivered', 28], ['cancelled', 4], ['refunded', 3],
];
const NOTES = [
  undefined, undefined, undefined, undefined,
  'Gift – please remove price tag.',
  'Leave with concierge if no answer.',
  'Customer asked to combine with order from last week.',
  'Address confirmed by phone.',
];

function weightedStatus(): OrderStatus {
  const total = STATUS_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [s, w] of STATUS_WEIGHTS) {
    if ((r -= w) <= 0) return s;
  }
  return 'paid';
}

function makeOrders(n: number): Order[] {
  const out: Order[] = [];
  const now = Date.now();
  for (let i = 0; i < n; i++) {
    const createdMs = now - Math.floor(rand() * 45 * 24 * 3600 * 1000);
    const updatedMs = createdMs + Math.floor(rand() * 5 * 24 * 3600 * 1000);
    const itemCount = 1 + Math.floor(rand() * 4);
    const items = Array.from({ length: itemCount }, () => {
      const [sku, name, unitPriceCents] = pick(PRODUCTS);
      return { sku, name, qty: 1 + Math.floor(rand() * 3), unitPriceCents };
    });
    const first = pick(FIRST);
    const last = pick(LAST);
    const [city, country] = pick(CITIES);
    out.push({
      id: `BR-${10000 + n - i}`,
      createdAt: new Date(createdMs).toISOString(),
      updatedAt: new Date(Math.min(updatedMs, now)).toISOString(),
      status: weightedStatus(),
      customer: {
        name: `${first} ${last}`,
        email: `${first}.${last}@example.com`.toLowerCase(),
      },
      shippingAddress: {
        line1: `${10 + Math.floor(rand() * 900)} ${pick(['Elm', 'Harbor', 'Station', 'Oak', 'Riverside', 'Market'])} ${pick(['St', 'Ave', 'Rd', 'Lane'])}`,
        city,
        country,
      },
      items,
      totalCents: items.reduce((s, it) => s + it.qty * it.unitPriceCents, 0) + 600,
      currency: 'USD',
      notes: pick(NOTES),
    });
  }
  // Newest first – this is the ONLY sort order the API supports.
  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return out;
}

let DB: Order[] = makeOrders(187);

// ---------- helpers ----------

const PAGE_SIZE = 25;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const latency = () => delay(350 + Math.random() * 500);

function encodeCursor(index: number) {
  return btoa(String(index));
}
function decodeCursor(cursor: string) {
  const n = Number(atob(cursor));
  if (!Number.isFinite(n) || n < 0) throw new Error('Invalid cursor');
  return n;
}

// ---------- public API ----------

/**
 * GET /orders
 *
 * Constraints:
 *  - Cursor pagination only. 25 per page. No page numbers, no total count.
 *  - Server-side filter: `status` only.
 *  - Sort: createdAt DESC only. No other sort keys.
 *  - No text search. To find a specific order use getOrder(id).
 */
export async function listOrders(params: ListOrdersParams = {}): Promise<OrderPage> {
  await latency();
  const filtered =
    !params.status || params.status === 'all'
      ? DB
      : DB.filter((o) => o.status === params.status);

  let start = 0;
  if (params.cursor) {
    const idx = decodeCursor(params.cursor);
    start = params.direction === 'prev' ? Math.max(0, idx - PAGE_SIZE) : idx;
  }
  const items = filtered.slice(start, start + PAGE_SIZE);
  const end = start + items.length;
  return {
    items: structuredClone(items),
    nextCursor: end < filtered.length ? encodeCursor(end) : null,
    prevCursor: start > 0 ? encodeCursor(start) : null,
  };
}

/**
 * GET /orders/:id
 * Exact-match lookup only. Case-sensitive. Returns 404 (throws) if missing.
 */
export async function getOrder(id: string): Promise<Order> {
  await latency();
  const o = DB.find((x) => x.id === id.trim());
  if (!o) throw new Error(`Order ${id} not found`);
  return structuredClone(o);
}

/**
 * POST /orders/:id/status  -> { jobId }
 *
 * Status changes are NOT synchronous. They are queued to a worker that
 * talks to the warehouse system. Typical completion 3–6s. ~10% of jobs fail
 * (warehouse rejected the transition) and must be retried by a human.
 * The order is locked while a job is in flight – a second request for the
 * same order will be rejected (409).
 *
 * Allowed transitions are enforced server-side – see ALLOWED_TRANSITIONS.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['packed', 'cancelled', 'refunded'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

const jobs = new Map<string, JobState>();
const lockedOrders = new Set<string>();

export async function requestStatusChange(
  id: string,
  next: OrderStatus,
): Promise<{ jobId: string }> {
  await latency();
  const o = DB.find((x) => x.id === id);
  if (!o) throw new Error(`Order ${id} not found`);
  if (lockedOrders.has(id)) throw new Error('409: a status change is already in progress for this order');
  if (!ALLOWED_TRANSITIONS[o.status].includes(next)) {
    throw new Error(`422: cannot move order from "${o.status}" to "${next}"`);
  }

  const jobId = `job_${Math.random().toString(36).slice(2, 10)}`;
  jobs.set(jobId, { state: 'queued' });
  lockedOrders.add(id);

  // Simulate the worker.
  (async () => {
    await delay(800 + Math.random() * 700);
    jobs.set(jobId, { state: 'running' });
    await delay(2000 + Math.random() * 3000);
    lockedOrders.delete(id);
    if (Math.random() < 0.1) {
      jobs.set(jobId, {
        state: 'failed',
        reason: 'Warehouse system rejected the transition (WMS-503). Try again.',
      });
      return;
    }
    o.status = next;
    o.updatedAt = new Date().toISOString();
    jobs.set(jobId, { state: 'done', order: structuredClone(o) });
  })();

  return { jobId };
}

/**
 * GET /jobs/:jobId
 * Poll this. There are no webhooks / websockets available to the web client.
 */
export async function getJob(jobId: string): Promise<JobState> {
  await delay(150 + Math.random() * 200);
  const j = jobs.get(jobId);
  if (!j) throw new Error(`Job ${jobId} not found`);
  return j;
}

/**
 * Test hook: simulate other staff / the storefront changing data in the
 * background. The web client does NOT get notified – it only sees changes
 * when it re-fetches.
 */
export function __simulateExternalChange() {
  const candidates = DB.filter((o) => ALLOWED_TRANSITIONS[o.status].length > 0);
  if (candidates.length === 0) return;
  const o = candidates[Math.floor(Math.random() * candidates.length)];
  o.status = ALLOWED_TRANSITIONS[o.status][0];
  o.updatedAt = new Date().toISOString();
}

export function __reset() {
  DB = makeOrders(187);
  jobs.clear();
  lockedOrders.clear();
}

export const API_PAGE_SIZE = PAGE_SIZE;

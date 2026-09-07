# Bramble Admin – Orders (v1)

Bramble is a small direct-to-consumer shop. This is the internal admin tool
the ops team uses to manage orders. Engineering shipped this v1 last sprint
so the team could stop using a spreadsheet. It works, but nobody has designed it.

## Try it

Live version, no setup needed:

**https://anirudh-valyx.github.io/bramble-orders/**

Note: the backend is simulated in your browser, so any changes you make
reset when you reload the page.

If you would rather run it locally (optional):

```bash
npm install
npm run dev
```

Open the URL Vite prints.

## What it does today

- Lists orders, newest first, 25 at a time, with Prev / Next.
- Filter by order status.
- Look up a single order by its exact ID (e.g. `BR-10120`).
- Click a row to open the order and change its status.
- The list quietly refreshes itself every 60 seconds.

Everything is backed by a simulated API in `src/api/mockApi.ts`. It behaves
like the real backend, including its latency, its limits, and its failures.

## Who uses it

Two ops staff, working simultaneously, mostly on laptops, occasionally on a
phone from the warehouse floor. On a busy day they touch 150–200 orders.

## Your task

Take about 45 minutes. You are the designer joining this team.

1. Use the tool for a few minutes. Try changing an order's status a couple of
   times. Note what frustrates you.
2. Propose how you would redesign the Orders screen. Sketches, a Figma
   frame, or annotations on screenshots are all fine. Focus on the flows, not
   the polish.
3. Then we will talk through it together with an engineer's perspective on
   what the backend can and cannot do, and iterate.

There is no single right answer. We care more about how you reason, what you
ask, and how you adapt than about the first proposal.

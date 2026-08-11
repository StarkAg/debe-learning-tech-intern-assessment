# Submission — Debe Learning Tech Intern Assessment

## Part 1 — GitHub Portfolio Walkthrough

**GitHub profile:** https://github.com/StarkAg

### 1. [Ribil](https://github.com/StarkAg/Ribil) — Karnataka Land Records & Village Maps

**Problem it solves:** Karnataka's official land-records portal requires drilling down through District → Taluk → Hobli → Village to pull a single village map PDF, and the underlying government site is slow and awkward to use directly. Ribil wraps that flow in a fast, searchable Next.js interface so people can find and download the right document without fighting the source portal.

**What I built:** Solo project, end to end — the Next.js 14 App Router frontend with cascading location dropdowns over 24k+ villages, an Express + Puppeteer backend that drives the government portal headlessly to generate the PDFs, and an in-memory caching layer that cut repeat-fetch latency from ~10–16s (cold Puppeteer run) down to ~50ms on a cache hit. Also handled the VPS deployment myself: HTTPS/cert setup, Cloudflare cache invalidation, and a same-origin single-container deploy after hitting CORS/404 issues running frontend and API separately.

**One thing I'd do differently:** The PDF cache is in-process memory, not a shared store. That means every deploy or crash restart cold-starts the cache, so the first request after any redeploy always pays the full 10–16s Puppeteer cost again, and the cache can't be shared across more than one instance if the app ever needs to scale horizontally. I'd move it to Redis (or similar) so the cache survives restarts and scales independently of the web process.

### 2. [VentArc](https://github.com/StarkAg/VentArc) — Event Management Platform + CertVault

**Problem it solves:** Event organizers need to run registration/management for an event and issue participation certificates that attendees (or anyone else) can independently verify later, without depending on a separate third-party certificate-verification vendor.

**What I built:** Solo project — React + Vite frontend, a Node/Express backend, Convex as the datastore, and Cloudinary for certificate PDF hosting. The CertVault module (certificate issuance + public verification lookup) is the part I'm most proud of. Deployment went through the same kind of hardening as Ribil: I initially had auth logic split between client and server in a way that trusted the client too much, and fixed it by moving to `service_role`-scoped Supabase auth calls happening only on the server, plus fixing an SPA-fallback bug where non-asset 404s were serving HTML instead of a proper 404.

**One thing I'd do differently:** I'd write the auth/permissions model down explicitly before writing the routes, instead of discovering the client-trust issue via a bug fix later. It worked out because I caught it during the same build, but that's the kind of thing that's much cheaper to get right the first time than to patch after routes already exist.

*(Commit history for both is real, incremental, per-feature/per-fix history — not a single squashed commit. Happy to walk through either live in the interview.)*

---

## Part 2 — Debugging Round

See [`part2-debug/original.ts`](./part2-debug/original.ts) and [`part2-debug/fixed.ts`](./part2-debug/fixed.ts).

Four distinct bugs, fixed with an explanatory comment directly above each fix in `fixed.ts`:

1. **Logic bug** — the double-booking check queried `teacherRef.collection("bookings")`, but the actual booking was written to a completely separate top-level `bookings` collection. The check and the write never touched the same location, so the duplicate-slot guard could never catch anything in production — the same slot could be double-booked indefinitely.
2. **Async/await bug** — the handler wasn't `async`, and neither the existence-check `.get()` nor the final `.add()` was awaited. `existing` was a pending `Promise`, not a `QuerySnapshot`, so `existing.docs` was `undefined` and reading `.length` off it would throw on every single call.
3. **Typing bug** — `data: BookingRequest` is a compile-time-only annotation; Firebase never validates the incoming payload against it at runtime. The original code trusted the shape blindly, so a malformed or malicious payload would flow straight into a Firestore write. Fixed with a `zod` schema validated at the boundary.
4. **Security bug** — no `context.auth` check at all, so any caller (authenticated or not) could hit the endpoint and create a booking for any `studentId`/`teacherId`. Fixed by requiring `context.auth` and verifying the caller's `uid` matches the `studentId` on the booking.

---

## Part 3 — Session Reschedule Widget

See [`part3-reschedule-widget/`](./part3-reschedule-widget).

```bash
cd part3-reschedule-widget
npm install
npm run dev
```

- `src/app/page.tsx` — the widget page, shows the parent's next 3 sessions (mocked in `src/lib/mock-sessions.ts`)
- `src/components/SessionList.tsx` — session list + per-session "Request Reschedule"
- `src/components/RescheduleForm.tsx` — the reschedule form (datetime picker + reason dropdown)
- `src/lib/requestReschedule.ts` — mock `requestReschedule` Cloud Function client (typed `{ success, error? }` response)
- `src/lib/datetime.ts` — the local-time ↔ UTC conversion helpers
- `src/types/reschedule.ts` — types shared between the frontend and the mock function

**Local-time / UTC:** `<input type="datetime-local">` is timezone-naive — whatever the parent types is implicitly *their* local time, with no offset attached. Per the JS `Date` spec, a date-time string with no timezone designator parses as local time when passed to `new Date(...)`, so `parseDatetimeLocalValue()` in `lib/datetime.ts` relies on exactly that to interpret the input correctly, then `toUtcIso()` converts to UTC once, right at the point the value leaves the browser in `RescheduleForm`'s submit handler. Everything downstream — the mock function, and a real Firestore write in production — only ever deals with UTC, so comparisons and storage stay unambiguous no matter which timezone the parent, student, or teacher are actually in.

The one deliberate trap I called out in a comment: computing the `min` attribute for the datetime-local input with `date.toISOString().slice(0, 16)` looks correct but is wrong, because `toISOString()` is always UTC — outside a UTC+0 timezone it would silently set the wrong local cutoff. `toDatetimeLocalValue()` builds the string from the `Date` object's local getters (`getFullYear`, `getHours`, etc.) instead.

**2-hour lockout:** Enforced twice — once in the UI, via the `min` attribute on the datetime-local input (computed as `now + 2h` in local time), and again inside `requestReschedule()` itself. The UI check is a client-side attribute, not a security boundary — the same lesson as the missing-validation bug in Part 2 — so the mock function re-derives and re-checks the same 2-hour window independently of what the form allowed the parent to submit.

---

## Part 4 — Explain-It-Yourself Video

*(To be recorded — link goes here before submitting.)*

**Video link:** _TODO — paste your Loom/screen-recording link here_

Suggested flow for the recording (4–7 min, unedited, live — no reading from notes):
1. Open `part3-reschedule-widget/`, walk through `SessionList` → `RescheduleForm` → `requestReschedule`, in that order.
2. Say out loud, in your own words: why `datetime-local` needs the local-time parsing trick in `lib/datetime.ts`, and why the `min` attribute alone isn't enough for the 2-hour lockout (tie it back to the Part 2 security bug — same "don't trust the client" idea).
3. Break something on camera — e.g. comment out the `toUtcIso(localDate)` conversion in `RescheduleForm.handleSubmit` and send the raw local-time string instead — then explain what breaks (a parent in a timezone west of UTC would have their reschedule silently interpreted as a different absolute time than the one they picked) and why.

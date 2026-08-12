# Debe Learning — Full Stack Development Intern Assessment

## Part 1 — GitHub Portfolio Walkthrough

**GitHub profile:** https://github.com/StarkAg

### 1. [Ribil](https://github.com/StarkAg/Ribil) — Karnataka Land Records & Village Maps

**Problem it solves:** Karnataka's official land-records portal makes users go through District → Taluk → Hobli → Village just to get one village map PDF, and the site itself is slow and frustrating to use. Ribil makes that process faster and easier through a searchable web interface.

**What I built:** I built this solo, end to end. It has a Next.js 14 frontend with cascading dropdowns across 24k+ villages, an Express + Puppeteer backend that fetches the PDFs from the government portal, and an in-memory cache that brought repeat requests down from roughly 10–16 seconds to about 50ms on a cache hit. I also handled deployment myself, including HTTPS setup, Cloudflare cache invalidation, and fixing CORS/404 issues by moving to a same-origin single-container deployment.

**One thing I'd do differently:** Right now the PDF cache lives in process memory. That means a restart or redeploy clears it, and it also would not scale well across multiple instances. If I revisited it, I would move that cache to Redis or another shared store.

### 2. [VentArc](https://github.com/StarkAg/VentArc) — Event Management Platform + CertVault

**Problem it solves:** VentArc helps organizers manage events and also issue certificates that can be verified later without depending on a separate certificate-verification service.

**What I built:** I built this solo as well. It uses React + Vite on the frontend, Node/Express on the backend, Convex as the datastore, and Cloudinary for certificate PDF hosting. The CertVault part — certificate issuance plus public verification — is the piece I am most proud of. During deployment and cleanup, I also fixed an auth design issue where the client was being trusted too much by moving sensitive auth operations fully to the server, and I fixed an SPA fallback issue where non-asset 404s were returning HTML instead of a proper 404 response.

**One thing I'd do differently:** I would define the auth and permission model more explicitly before writing the routes. I caught the client-trust problem while building, but it would have been better to design that part more deliberately from the start.

*(The commit history for both projects is incremental and per-feature/per-fix, not a single dumped commit.)*

---

## Part 2 — Debugging Round

See [`part2-debug/original.ts`](./part2-debug/original.ts) and [`part2-debug/fixed.ts`](./part2-debug/fixed.ts).

I fixed four separate issues in `fixed.ts`, with a short comment above each one:

1. **Logic bug** — the code checked for existing bookings in `teacherRef.collection("bookings")`, but wrote new bookings to a separate top-level `bookings` collection. Because the read and write paths did not match, the duplicate-booking check would never actually work.
2. **Async/await bug** — the handler was not `async`, and the Firestore calls were not awaited. That meant `existing` was still a pending Promise, so trying to read `existing.docs.length` would fail at runtime.
3. **Typing bug** — `data: BookingRequest` only helps at compile time. Firebase does not validate incoming payloads against that interface at runtime, so the original function was trusting input it had not actually validated. I fixed that by validating the request with `zod`.
4. **Security bug** — there was no `context.auth` check, so even an unauthenticated caller could hit the function. I fixed that by requiring auth and verifying that the caller's `uid` matches the `studentId` in the request.

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

This widget shows a parent's upcoming sessions and lets them request a new time for one of them.

**Local time and UTC:** the browser's `datetime-local` input gives back a local date/time with no timezone attached. So in `lib/datetime.ts`, I parse that value as local time first, then convert it to UTC before sending it onward in `RescheduleForm`. That way the user can pick a time in their own timezone, but the stored value is still one consistent format underneath.

One small trap here is that `date.toISOString().slice(0, 16)` looks like an easy way to fill the datetime input, but it is wrong for this case because `toISOString()` is always UTC. I used local date getters instead when building the `min` value for the input.

**2-hour lockout:** I enforced the 2-hour rule in two places: first in the UI through the input `min`, and then again inside `requestReschedule()`. The UI check is only for user experience. The real validation still has to happen in the function itself, because client-side checks can always be bypassed.

---

## Part 4 — Explain-It-Yourself Video

**Video link:** https://youtu.be/E_2wRjPNP7k

In the video, I walk through `SessionList` → `RescheduleForm` → `requestReschedule`, explain why the app converts local time to UTC, explain why the 2-hour rule is checked both in the form and in the function, and then briefly show what goes wrong if the UTC conversion step is removed.

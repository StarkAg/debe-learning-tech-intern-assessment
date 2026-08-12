# Part 3 — Session Reschedule Widget

Small Next.js widget for the Debe assessment.

## What it does

- shows a parent their next tutoring sessions
- lets them request a reschedule for a session
- converts the selected local time to UTC before sending it onward
- re-checks the 2-hour policy in the mock server function, not just in the form

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Main files

- `src/app/page.tsx` — page shell
- `src/components/SessionList.tsx` — list of sessions + reschedule trigger
- `src/components/RescheduleForm.tsx` — modal form for picking a new slot and reason
- `src/lib/datetime.ts` — local-time / UTC helpers
- `src/lib/requestReschedule.ts` — mock backend validation
- `src/lib/mock-sessions.ts` — sample session data

## Notes

The important implementation detail in this task is timezone handling:
`<input type="datetime-local">` gives a local wall-clock value with no timezone attached, so the form parses it as local time and converts it to UTC before storing/sending it.

The 2-hour lockout is enforced twice:
- once in the UI through the input `min`
- once again in `requestReschedule()` as the real validation layer

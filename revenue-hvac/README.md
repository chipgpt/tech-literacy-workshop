# Revenue Project: HVAC Lead Intake + Booking Sprint

## Goal
Close 1–2 pilot clients for the **AI Lead Intake + Booking** offer in the Forney/Rockwall area.

## Files
- `leads.csv` — pipeline tracking
- `email_templates.md` — outreach + follow-ups + audit template

## Status values
Suggested: `New`, `Contacted`, `Responded`, `AuditSent`, `ProposalSent`, `ClosedWon`, `ClosedLost`

## Operating rules (project conventions)

### Lead completeness (definition of done)
A lead is considered **complete** when it has:
- `Phone` in **E.164** format (e.g. `+12145551234`), and
- **either** a usable `Email`/`ContactEmail` **or** a `ContactFormUrl`.

### Source of truth for verification
- **Google Maps is the source of truth** for `Phone`, `Website`, and physical location.
- Record Maps address in `Notes` as: `MapsAddress: <address>`.
- If Maps does not show a value, record in `Notes` as: `MapsMissing: <field(s)>`.

### Duplicate handling
Treat entries as duplicates when:
- Same `Phone` **and** same website **domain**.

Default action:
- Keep the earlier row (unless there’s a clear reason not to) and remove the duplicate.

### Batch/audit artifacts
When sending outreach in batches, save what was sent for auditability:
- `send_batch_YYYY-MM-DD/` (manifest + exact bodies used)

## Next step
Populate `leads.csv` with targets from Google Maps, then run outreach and update rows daily.

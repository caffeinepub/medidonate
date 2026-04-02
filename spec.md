# MediDonate

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Donation entity: id, donor name, medicine name, quantity, expiry date, status (pending/accepted/delivered), notes, created_at
- CRUD operations: create donation, read all donations, read single donation, update donation (edit fields + status), delete donation
- Authentication: login/logout, role-based access (admin vs donor)
- Dashboard: summary stats (total donations, pending, delivered)
- Donation list view with filtering by status
- Donation detail/edit form
- Create donation form

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Select authorization component
2. Generate Motoko backend with Donation type and CRUD methods
3. Frontend: auth flow (login/register), dashboard with stats, donation list, create/edit/delete forms

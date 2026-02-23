# EverydayDo Frontend

React + TypeScript + Vite frontend for the EverydayDo task planning system.

## Main Features

- Authentication: register, login, auto-load current user.
- Today: list tasks by date, generate daily plan, add/edit/delete task, update task status.
- Templates: create/edit/delete recurring templates, enable/disable template, set active range and default start time.
- Hourly checkins: submit current window checkin, add ad-hoc records, edit/delete history checkins.
- Stats: weekly/monthly/yearly completion summary and checkin review pagination.
- Holiday calendar: view date ranges and set custom holiday/workday overrides.

## Dev

```bash
npm install
npm run dev
```

The frontend sends API calls to `/api`.

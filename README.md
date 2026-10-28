# Fix-It Repair Website

Monorepo for the Fix-It repair booking / service website.

| Area | Path | Notes |
|------|------|--------|
| Frontend | [`frontend/`](frontend/) | Web UI |
| Backend | [`backend/`](backend/) | API and data models (Python) |

## Links

- **GitHub:** [Wesh2003/Fix-It-Repair-website](https://github.com/Wesh2003/Fix-It-Repair-website)
- **Jira:** FixItApp (`SCRUM`) on [wendomuriithi.atlassian.net](https://wendomuriithi.atlassian.net)

## Run locally

The app has a Django REST API and a Vite/React frontend. Use two PowerShell
terminals from the repository root.

For a one-command Windows start, run this from the repository root in
PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-fixit.ps1
```

It installs missing dependencies, applies database migrations, starts both
servers in separate PowerShell windows, waits for them to respond, and opens
the site in Google Chrome when available (otherwise it uses the default
browser). Python and Node.js/npm must be installed on the computer.

### 1. Set up and start the backend

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py createsuperuser
.\.venv\Scripts\python.exe manage.py runserver
```

The API is available at `http://127.0.0.1:8000/api/`; the health check is
`http://127.0.0.1:8000/api/health/`. The local SQLite database is created on
the first migration, along with starter repair categories.

### 2. Set up and start the frontend

In a second terminal:

```powershell
Set-Location frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://127.0.0.1:5173/`).

Students can create an account, log in, post a repair request, and view their
request statuses. To use a different API URL, set `VITE_API_URL` in
`frontend/.env.local` (for example `VITE_API_URL=http://127.0.0.1:8000/api`).

Maintenance staff can register and log in from the staff portal to view only
their assigned repairs, start work, and mark repairs resolved. Administrators
can review all repair reports, assign active staff, monitor progress, and
activate or deactivate user accounts.

Administrator self-registration requires a server-side key. Set it in the
backend terminal before starting Django; do not put it in frontend environment
variables or commit it:

```powershell
$env:FIXIT_ADMIN_SIGNUP_KEY = "use-a-long-random-value"
.\.venv\Scripts\python.exe manage.py runserver
```

When this setting is empty, the administrator registration page remains
available but the API rejects account creation. Staff and student registration
do not require this key.

### Checks

```powershell
.\.venv\Scripts\python.exe manage.py test backend
Set-Location frontend
npm run build
```

## Contributing

1. Branch from `main`.
2. Reference Jira keys in commits/PRs when applicable (e.g. `SCRUM-12`).
3. Open a PR; CI will run once workflows are added under `.github/workflows/`.

## Quick starter code: to be executed on the main project source branch terminal
```powershell
powershell -ExecutionPolicy Bypass -File .\start-fixit.ps1
```
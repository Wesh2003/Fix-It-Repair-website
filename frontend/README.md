# Fix-It frontend

React single-page app built with Vite. From this directory, install dependencies
and start the development server:

```powershell
npm install
npm run dev
```

The app expects the Django API at `http://127.0.0.1:8000/api` by default. Override
this with `VITE_API_URL` in a `.env.local` file when needed.

Build a production bundle with `npm run build`.

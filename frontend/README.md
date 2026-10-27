# FixIt Frontend — Standalone Demo

This is a plain HTML, CSS and JavaScript demo. It does **not** require Django, a backend server, npm or a build step. User accounts, sample reports and uploaded images are stored in this browser's `localStorage` for demonstration only.

## Run it

1. Extract this ZIP file.
2. Open a terminal in the `frontend` folder.
3. Run `python -m http.server 5173` (on Windows, `py -m http.server 5173` also works).
4. Visit `http://localhost:5173/` in your browser.

## Demo accounts

Use any of these on the Login page:

| Role | Username | Password |
|---|---|---|
| Student | `student` | `student123` |
| Staff | `staff` | `staff123` |
| Admin | `admin` | `admin123` |

You can also register new demo accounts. The demo login is not secure authentication and must not be used for real accounts or sensitive data.

## Photo upload

Students can attach an optional image to an issue report. The form previews the image, accepts image files up to 2 MB, and displays the saved image on student, staff and admin report cards. Images are stored locally in this browser and are not uploaded to a server.

## Important limitations

- Data is local to the current browser and computer. It is not shared with classmates or other devices.
- Clearing browser site data removes the demo data.
- Passwords are stored in browser storage for demo purposes only. Do not enter real passwords.
- The integration developer can later replace `js/api.js` with calls to the Django API. The other page scripts continue using the same `api` method names. The photo field will need backend support (for example, a Django image field and multipart upload) for real server uploads.

# ShareShelf Flask application

The Flask app serves the frontend and provides signup, login, persistent
listings, and interest requests that owners can accept or decline. It stores
data in `instance/shareshelf.sqlite3`, created
automatically the first time the app starts. The old Node/Supabase backend is not
needed to run this Flask version.

## Run on Windows

From the ShareShelf project root (the folder containing `app.py`):

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
py app.py
```

Open <http://127.0.0.1:8000>. The health endpoint is
<http://127.0.0.1:8000/api/health>.

From the login screen, choose **Explore the demo marketplace** to open the
interactive sample shelf without an account. Demo changes are saved only in the
current browser.

For deployment, set `SHARESHELF_SECRET_KEY` to a long random value and run with
debug mode disabled. Keep the `instance` directory on persistent storage so
accounts and listings survive restarts.

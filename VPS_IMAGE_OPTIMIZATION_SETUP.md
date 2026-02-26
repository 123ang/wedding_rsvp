# VPS Setup: Auto Image Optimization (jsang-psong-wedding.com)

Your API **automatically runs** `optimize-images.py --new` in the background after:
- **Single photo upload** (photographer portal)
- **ZIP upload** (photographer portal)

So you don’t need to run the script manually. One-time setup on the VPS is below.

---

## One-time setup on your VPS

SSH into the server and run from the project root (e.g. `/root/projects/wedding_rsvp`).

### 1. Install Python dependencies

```bash
cd /root/projects/wedding_rsvp/api/scripts
pip3 install -r requirements.txt
```

If `pip3` is missing:

```bash
apt-get update && apt-get install -y python3-pip
pip3 install -r requirements.txt
```

### 2. Run database migration (if not done yet)

```bash
cd /root/projects/wedding_rsvp
mysql -u root -p wedding_rsvp < database/migration_add_thumbnails.sql
```

### 3. Create thumbnails directory

```bash
mkdir -p /root/projects/wedding_rsvp/uploads/photos/thumbnails
chmod 755 /root/projects/wedding_rsvp/uploads/photos/thumbnails
```

### 4. Restart the API

So it loads the new code that triggers optimization:

```bash
pm2 restart wedding-api
# or however you run the API, e.g. systemctl restart wedding-api
```

---

## How it works

- Upload (single or ZIP) → API saves files and DB → API sends success response.
- Right after that, the API starts `python3 scripts/optimize-images.py --new` in the **background** (detached).
- The script only processes rows that don’t have `thumbnail_url` yet, creates thumbnails, and updates the DB.
- Upload response is not delayed; optimization runs after the response.

---

## Verify it’s working

1. **Logs**  
   After an upload you should see:
   ```text
   [Photo Optimize] Triggered background optimization (optimize-images.py --new)
   ```

2. **Thumbnails on disk**
   ```bash
   ls -la /root/projects/wedding_rsvp/uploads/photos/thumbnails/
   ```

3. **Database**
   ```bash
   mysql -u root -p wedding_rsvp -e "
     SELECT COUNT(*) as total,
            SUM(thumbnail_url IS NOT NULL) as with_thumbnail
     FROM photographer_photo;
   "
   ```

---

## If optimization doesn’t run

- **“Script not found”**  
  Ensure the repo on the VPS has `api/scripts/optimize-images.py` and you restarted the API after pulling.

- **Python/Pillow errors**  
  Run by hand to see the error:
  ```bash
  cd /root/projects/wedding_rsvp/api
  python3 scripts/optimize-images.py --new
  ```

- **DB/permissions**  
  Same as local: correct `DB_*` in `api/.env`, and that the DB user can `UPDATE photographer_photo` and the app can write to `uploads/photos/thumbnails/`.

---

## Paths on your VPS (from nginx config)

- Site root: `/var/www/jsang-psong-wedding.com`
- Uploads (nginx): `alias /root/projects/wedding_rsvp/uploads`
- API: Node on port 3002  
So the project root used here is **`/root/projects/wedding_rsvp`**. All commands above assume that path; if yours is different, replace it.

Once the one-time setup is done, uploads from the photographer portal will auto-run optimization on your VPS.

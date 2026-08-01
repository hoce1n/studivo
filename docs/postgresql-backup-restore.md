# PostgreSQL Docker Backup & Restore Runbook

## Purpose

This document explains how to:

* Create a backup of a PostgreSQL database running inside a Docker container on a Linux server.
* Verify that the backup is valid.
* Transfer the backup to a local Windows machine.
* Restore it into a local PostgreSQL instance.
* Troubleshoot common problems.

---

# Requirements

## Server

* Linux
* Docker
* PostgreSQL running inside a Docker container
* SSH access

## Local Machine

* PostgreSQL Client Tools installed (`psql`, `pg_dump`, `pg_restore`)
* PATH configured correctly

Verify installation:

```bash
psql --version
pg_dump --version
pg_restore --version
```

---

# Step 1 — Find the PostgreSQL container

```bash
docker ps
```

Example:

```text
CONTAINER ID   IMAGE         NAME
abc123         postgres:16   postgres
```

Assume the container name is:

```
postgres
```

---

# Step 2 — List available databases

```bash
docker exec -it postgres psql -U postgres -l
```

Example:

```
postgres
studivo
template0
template1
```

Verify the database you want to back up exists.

---

# Step 3 — Verify the database contains data

Connect:

```bash
docker exec -it postgres psql -U postgres -d studivo
```

List tables:

```sql
\dt
```

If tables are listed, the database is correct.

Exit:

```sql
\q
```

---

# Step 4 — Create the backup

Use PostgreSQL Custom Format.

```bash
docker exec -i postgres \
pg_dump \
-U postgres \
-d studivo \
-Fc \
> ~/backup.dump
```

This creates:

```
~/backup.dump
```

---

# Step 5 — Verify the backup

**Always verify before downloading.**

```bash
pg_restore -l ~/backup.dump | head
```

Expected output:

```text
Archive created at ...
dbname: studivo
Format: CUSTOM
TABLE public.user
TABLE public.studyhall
...
```

If this command prints nothing or reports an error, the backup is invalid.

Do **not** download it.

---

# Step 6 — Download the backup

Run on the local Windows machine:

```powershell
scp username@server-ip:~/backup.dump C:\Users\YourUser\
```

Example:

```powershell
scp hocein@123.123.123.123:~/backup.dump C:\Users\Iranian\
```

---

# Step 7 — Verify the downloaded backup

```powershell
pg_restore -l "C:\Users\Iranian\backup.dump"
```

Expected output:

```
TABLE ...
SEQUENCE ...
INDEX ...
```

If nothing is printed, the file is corrupted or incomplete.

---

# Step 8 — Create the local database

If it does not already exist:

```powershell
createdb -U postgres studivo
```

Verify:

```powershell
psql -U postgres -l
```

---

# Step 9 — Restore the backup

```powershell
pg_restore `
-U postgres `
-d studivo `
--clean `
--if-exists `
"C:\Users\Iranian\backup.dump"
```

Explanation:

* `--clean` drops existing objects before recreating them.
* `--if-exists` prevents errors if objects do not exist.

---

# Step 10 — Verify the restore

Connect:

```powershell
psql -U postgres -d studivo
```

List tables:

```sql
\dt
```

Expected:

```
account
attendance
user
studyhall
membership
...
```

Check data:

```sql
SELECT COUNT(*) FROM "user";
```

Example:

```sql
SELECT * FROM studyhall LIMIT 5;
```

Exit:

```sql
\q
```

---

# Common Problems

## pg_restore completes but no tables exist

Cause:

* Invalid backup file
* Wrong backup file downloaded

Check:

```bash
pg_restore -l backup.dump
```

If no output appears, recreate the backup.

---

## "psql is not recognized"

PostgreSQL tools are not in PATH.

Verify:

```powershell
psql --version
```

If not found, add:

```
D:\Program Files\PostgreSQL\18\bin
```

to the Windows PATH.

Restart PowerShell.

---

## Permission denied

Ensure the PostgreSQL user has permission to connect.

Verify credentials:

```bash
docker exec -it postgres psql -U postgres
```

---

## Wrong database restored

Verify available databases:

```bash
docker exec -it postgres psql -U postgres -l
```

Always double-check the database name before running `pg_dump`.

---

# Best Practices

✔ Always use Custom Format (`-Fc`).

✔ Always verify the backup before downloading.

✔ Restore into a separate local database instead of overwriting another database.

✔ Keep at least one previous backup.

✔ Test the restore after every important production backup.

---

# Quick Reference

### Backup

```bash
docker exec -i postgres \
pg_dump -U postgres -d studivo -Fc \
> ~/backup.dump
```

### Verify

```bash
pg_restore -l ~/backup.dump | head
```

### Download

```powershell
scp username@server-ip:~/backup.dump C:\Users\Iranian\
```

### Restore

```powershell
pg_restore `
-U postgres `
-d studivo `
--clean `
--if-exists `
"C:\Users\Iranian\backup.dump"
```

### Verify Restore

```sql
\dt
SELECT COUNT(*) FROM "user";
```

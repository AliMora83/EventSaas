# VPS Setup — eventsaas.namka.cloud

One-time setup on the Hostinger VPS. After this, every push to `main` auto-deploys.

---

## 1. SSH into the VPS

```bash
ssh root@<your-vps-ip>
```

---

## 2. Install nginx + Certbot

```bash
apt update && apt install -y nginx certbot python3-certbot-nginx
```

---

## 3. Create web root + set permissions

```bash
mkdir -p /var/www/eventsaas
chown -R www-data:www-data /var/www/eventsaas
```

---

## 4. Copy nginx config

```bash
# From repo: nginx/eventsaas.conf → VPS
cp nginx/eventsaas.conf /etc/nginx/sites-available/eventsaas
ln -s /etc/nginx/sites-available/eventsaas /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

## 5. Issue SSL certificate

```bash
certbot --nginx -d eventsaas.namka.cloud
```

Follow the prompts — Certbot auto-updates your nginx config.

---

## 6. Allow nginx through firewall

```bash
ufw allow 'Nginx Full'
```

---

## 7. GitHub Secrets to add

Go to: **GitHub → AliMora83/EventSaas → Settings → Secrets → Actions**

Add these secrets:

| Secret name | Value |
|---|---|
| `VPS_HOST` | Your VPS IP or `eventsaas.namka.cloud` |
| `VPS_USER` | `root` (or your deploy user) |
| `VPS_SSH_KEY` | Private SSH key (paste full key incl header) |
| `VITE_FIREBASE_API_KEY` | `AIzaSyCqXu7wDoIUDgHSwzrr-NYhDOuvezqWkn0` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `eventsaas-da125.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `eventsaas-da125` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `eventsaas-da125.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `609722024070` |
| `VITE_FIREBASE_APP_ID` | `1:609722024070:web:913cd0c7b37827be881107` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-RDWCKJ8GW8` |

---

## 8. Generate deploy SSH key pair

On your **local machine** (not VPS):

```bash
ssh-keygen -t ed25519 -C "eventsaas-deploy" -f ~/.ssh/eventsaas_deploy
```

Add the **public key** to VPS:
```bash
cat ~/.ssh/eventsaas_deploy.pub >> ~/.ssh/authorized_keys   # run on VPS
```

Add the **private key** (`~/.ssh/eventsaas_deploy`) as `VPS_SSH_KEY` in GitHub Secrets.

---

## 9. Deploy!

Push anything to `main`:
```bash
git push origin main
```

Watch it go: **GitHub → Actions tab** → "Deploy to Hostinger VPS"

`eventsaas.namka.cloud` updates in ~90 seconds.

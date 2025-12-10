---
description: Build and Deploy Dexter (Web + Backend)
---

This workflow handles the deployment of the Dexter application. It pushes changes to GitHub, deploys the backend to Railway, and the frontend to Vercel.

# Prerequisites
- [ ] Authenticated with `gh` (GitHub CLI)
- [ ] Authenticated with `railway` CLI
- [ ] Authenticated with `vercel` CLI

# Steps

1. **Commit and Push to GitHub**
   ```bash
   git add .
   git commit -m "Auto-deploy update"
   git push origin main
   ```

2. **Deploy Backend (Railway)**
   ```bash
   // turbo
   railway up --detach
   ```

3. **Deploy Frontend (Vercel)**
   ```bash
   cd web
   // turbo
   vercel --prod
   ```

4. **Verify Deployment**
   - Check the output URLs from Railway and Vercel.

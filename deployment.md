# Deployment Guide - CentSentry

Follow this guide to deploy CentSentry to cloud hosting platforms.

---

## 1. Backend Deployment (Render)

Render is ideal for deploying Python FastAPI web apps and hosting PostgreSQL databases.

### Step 1.1: Deploy PostgreSQL Database on Render

1. Log in to [Render Console](https://dashboard.render.com).
2. Click **New +** and select **PostgreSQL**.
3. Fill in the database details:
   - **Name**: `centsentry-db`
   - **Database**: `centsentry`
   - **User**: `centsentry_user`
   - **Region**: Choose a region close to your users
4. Select the **Free Tier** (or preferred tier) and click **Create Database**.
5. Once active, copy the **External Database URL**. It will look similar to:
   `postgres://centsentry_user:password@dpg-xxx-a.oregon-postgres.render.com/centsentry`

---

### Step 1.2: Deploy FastAPI Web Service

1. Push your code repository to GitHub (or GitLab).
2. On Render Dashboard, click **New +** and select **Web Service**.
3. Connect your repository.
4. Configure the Web Service:
   - **Name**: `centsentry-api`
   - **Region**: Choose the same region as the database
   - **Root Directory**: `backend`
   - **Language**: `Python 3`
   - **Build Command**:
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
5. Click **Advanced** to add Environment Variables:
   - `DATABASE_URL`: Paste the **External Database URL** copied from Step 1.1.
   - `JWT_SECRET`: A secure random string (e.g. `2d93b3f2...`).
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: `1440`
6. Click **Create Web Service**.
7. Once successfully deployed, copy the Render URL (e.g., `https://centsentry-api.onrender.com`). This will be your API endpoint.

---

## 2. Frontend Deployment (Vercel)

Vercel is optimized for deploying static Single Page Applications (SPAs).

### Step 2.1: Configure Production Build API Variable

Before deploying, configure your Vite app to use the Render backend endpoint:
- In Vercel, we will configure an environment variable named `VITE_API_URL` pointing to your deployed Render URL.

### Step 2.2: Deploying to Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** > **Project** and import your Git repository.
3. Configure project settings:
   - **Framework Preset**: `Vite` (automatically detected)
   - **Root Directory**: `frontend`
   - **Build and Output Settings**: Default settings (`npm run build` and `dist`) are appropriate.
4. Expand **Environment Variables** and add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://centsentry-api.onrender.com` (Your Render API URL)
5. **Configuring Router rewrites (Crucial for React Router)**:
   Because SPAs handle routing client-side, direct navigation to subpages (like `/expenses`) will trigger a 404 on page refresh unless rewrite rules are specified.
   Create a `vercel.json` file inside the root of your `frontend/` folder with the following content:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/" }
     ]
   }
   ```
6. Click **Deploy**. Vercel will build and host your frontend application.

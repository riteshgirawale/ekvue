# Deployment Guide: GitHub + Netlify with Automatic VS Code Deployments

This guide covers how to deploy your project to GitHub and Netlify, with automatic deployments whenever you push changes from VS Code.

---

## Part 1: Deploy Static HTML Files (Root Directory)

### Step 1: Prepare Your Files for Netlify
1. Create a `_redirects` file in the root directory (if using Single Page Application routing)
2. Ensure your HTML files are in the root directory

### Step 2: Create Empty GitHub Repository
1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right → "New repository"
3. Enter repository name (e.g., "my-website")
4. Select "Public" or "Private"
5. **IMPORTANT**: Do NOT check "Add a README file" - keep it completely empty
6. Click "Create repository"
7. You will see quick setup page - click the copy button next to the HTTPS URL
   (It will look like: https://github.com/riteshgirawale/my-website.git)

### Step 3: Push to GitHub
   
```
bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/riteshgirawale/YOUR_REPO.git
git push -u origin main

```

### Step 3: Deploy to Netlify
1. Go to [Netlify](https://www.netlify.com) and sign up/login
2. Click "Add new site" → "Import an existing project"
3. Click "GitHub" and authorize Netlify
4. Select your repository
5. Configure build settings:
   - **Build command**: Leave empty (for static HTML)
   - **Publish directory**: `.` (or your folder name)
6. Click "Deploy"

---

## Part 2: Deploy React App (my-app folder)

### Step 1: Update package.json
Make sure your `my-app/package.json` has the correct homepage:
```
json
{
  "homepage": "https://your-site-name.netlify.app",
  ...
}
```

### Step 2: Push to GitHub
1. Create a new repository on GitHub for the React app
2. In VS Code terminal:
   
```
bash
cd my-app
git init
git add .
git commit -m "Initial React app"
git remote add origin https://github.com/riteshgirawale/YOUR_REPO.git
git push -u origin main

```

### Step 3: Deploy to Netlify
1. Go to Netlify → "Add new site" → "Import an existing project"
2. Select your React app repository
3. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
4. Click "Deploy"

---

## Part 3: Automatic Deployments from VS Code

### How It Works:
Once you've connected GitHub to Netlify:
1. Make changes in VS Code
2. Commit and push your changes
3. Netlify automatically detects the changes and redeploys

### Step-by-Step:

1. **Make Changes in VS Code**
   - Edit your files normally

2. **Commit Your Changes**
   
```
bash
   git add .
   git commit -m "Your update description"
   
```

3. **Push to GitHub**
   
```
bash
   git push origin main
   
```

4. **Netlify Automatically Deploys**
   - Netlify will detect the push
   - Build your project
   - Deploy to your live URL
   - You'll see the deployment progress in Netlify dashboard

---

## Quick Commands Reference

```
bash
# Check git status
git status

# Add all changes
git add .

# Commit with message
git commit -m "Your message"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main
```

---

## Important Notes

1. **Netlify CLI (Optional - for local testing)**
   
```
bash
   npm install -g netlify-cli
   netlify login
   netlify dev  # Run locally
   
```

2. **Environment Variables**: If your app uses environment variables, add them in Netlify dashboard under "Site settings" → "Environment variables"

3. **Custom Domain**: You can connect a custom domain in Netlify under "Domain management"

4. **Branch Deploys**: Netlify can deploy different branches (useful for staging)

---

## Your Project Structure Summary

Based on your current project:
- **Static files** (dashboard.html, index.html, login.html, signup.html, styles.css, script.js) → Deploy as static site
- **my-app/** (React app) → Deploy with `npm run build` command

---

## Troubleshooting

- **Build fails**: Check the build logs in Netlify dashboard
- **404 errors**: Add a `_redirects` file with `/* /index.html 200`
- **CSS/JS not loading**: Check that the publish directory is correct
- **Git issues**: Make sure Git is properly configured with your GitHub account

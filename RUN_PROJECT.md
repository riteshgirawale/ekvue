# How to Run This Project - Step by Step

This project has two parts: **Static HTML pages** and a **React App**.

---

## Option 1: Run Static HTML Files from GitHub (Simplest)

### Step 1: Clone the Repository
Open Terminal/Command Prompt and run:
```
git clone https://github.com/riteshgirawale/ekvue.git
cd ekvue
```

### Step 2: Open HTML Files
Simply double-click any of these files to open in your browser:
- `index.html` - Main landing page (EkVue)
- `login.html` - Login page
- `signup.html` - Signup page
- `dashboard.html` - Dashboard page

Or use VS Code:
1. Open VS Code
2. File → Open Folder → Select the cloned `ekvue` folder
3. Right-click any HTML file → "Open with Live Server"

---

## Option 2: Run React App from GitHub

### Prerequisites
- **Node.js** must be installed (download from https://nodejs.org)

### Step 1: Clone the Repository
```
git clone https://github.com/riteshgirawale/ekvue.git
cd ekvue
```

### Step 2: Navigate to React App
```
cd my-app
```

### Step 3: Install Dependencies (First Time Only)
```
npm install
```

### Step 4: Start Development Server
```
npm start
```

### Step 5: View the App
The browser will automatically open to: **http://localhost:3000**

---

## Option 3: Deploy to Netlify (No Setup Required)

### Step 1: Go to Netlify
Visit https://app.netlify.com

### Step 2: Sign Up/Login
Sign up with your GitHub account

### Step 3: Import Repository
- Click "Add new site" → "Import an existing project"
- Select "GitHub" and choose the "ekvue" repository

### Step 4: Configure Build (For React App only)
- Build command: `npm run build` (if deploying my-app)
- Publish directory: `my-app/build` (if deploying my-app)
- For static HTML: leave both fields empty

### Step 5: Deploy
Click "Deploy" - your site will be live at a URL like `https://your-site.netlify.app`

---

## Quick Summary

| Method | Command | URL |
|--------|---------|-----|
| Clone & Open HTML | `git clone` + double-click | file://... |
| Clone & Run React | `git clone` + `npm start` | http://localhost:3000 |
| Netlify Deploy | Import from GitHub | https://app.netlify.com |

---

## Troubleshooting

**React won't start?**
- Make sure Node.js is installed: `node -v`
- Delete `node_modules` folder and run `npm install` again

**Port 3000 already in use?**
- Run: `taskkill /F /IM node.exe` to kill existing Node processes
- Then run `npm start` again

**HTML files not loading CSS?**
- Make sure all files (styles.css, script.js) are in the same folder as HTML files

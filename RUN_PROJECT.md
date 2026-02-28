# How to Run This Project - Step by Step

This project has two parts: **Static HTML pages** and a **React App**.

---

## Option 1: Run Static HTML Files (Simplest)

### Step 1: Navigate to Project Folder
Open File Explorer and go to: `c:/vs code/m project/`

### Step 2: Open HTML Files
Simply double-click any of these files to open in your browser:
- `index.html` - Main landing page (EkVue)
- `login.html` - Login page
- `signup.html` - Signup page
- `dashboard.html` - Dashboard page

Or use VS Code:
1. Open VS Code
2. File → Open Folder → Select `c:/vs code/m project`
3. Right-click any HTML file → "Open with Live Server" (if Live Server extension installed)

---

## Option 2: Run React App (my-app)

### Prerequisites
- **Node.js** must be installed (download from https://nodejs.org)

### Step 1: Open Terminal
Press `Win + R`, type `cmd`, press Enter

### Step 2: Navigate to React App
```
bash
cd c:/vs code/m project/my-app
```

### Step 3: Install Dependencies (First Time Only)
```
bash
npm install
```

### Step 4: Start Development Server
```
bash
npm start
```

### Step 5: View the App
The browser will automatically open to: **http://localhost:3000**

---

## Option 3: Run Both (Full Project)

### Part A: Run Static HTML Files
1. Double-click `index.html` in the project folder
2. This opens the EkVue landing page
3. Navigate to login/signup/dashboard by clicking links

### Part B: Run React App
1. Open a new terminal
2. Run: `cd c:/vs code/m project/my-app`
3. Run: `npm start`
4. Browser opens to http://localhost:3000

---

## Quick Summary

| Method | Command | URL |
|--------|---------|-----|
| Static HTML | Double-click file | file://... |
| React App | `npm start` | http://localhost:3000 |

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

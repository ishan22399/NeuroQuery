# GitHub Setup Guide for NeuroQuery

## Overview
This document guides you through pushing the NeuroQuery project to GitHub with automated individual file commits.

## What You'll Need

1. **GitHub Account** - https://github.com (yours: ishan22399)
2. **Personal Access Token** - For authentication
3. **Git Installed** - Download from https://git-scm.com/download/win
4. **Python 3.8+** - Should already be installed

## Step 1: Create a Personal Access Token

1. Go to https://github.com/settings/tokens/new
2. In the "Note" field, enter: `NeuroQuery Auto-Commit`
3. Under "Select scopes", check:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Actions and workflows)
4. Click "Generate token"
5. **IMPORTANT**: Copy the token immediately (you won't see it again!)
   - Save it somewhere safe (you'll need it in a moment)

## Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Enter:
   - **Repository name**: `NeuroQuery`
   - **Description**: `Professional RAG Chatbot with Azure OpenAI and MongoDB`
   - **Visibility**: Public ✅
   - **Initialize with**: Leave empty (we have code locally)
3. Click "Create repository"

## Step 3: Run the Auto-Commit Script

### Option A: Using Batch File (Recommended for Windows)
```cmd
Double-click: setup_github.bat
```

### Option B: Using PowerShell
```powershell
cd i:\APP
python auto_commit.py
```

### Option C: Using Command Prompt
```cmd
cd i:\APP
python auto_commit.py
```

## Step 4: When Script Prompts for Input

When you run the script, it will ask:

```
Enter your GitHub Personal Access Token: 
```

**Paste the token you copied in Step 1**
- The token will be hidden (shows dots)
- Press Enter

The script will then:
1. ✅ Initialize git repository
2. ✅ Create .gitignore file
3. ✅ Configure git user
4. ✅ Scan all project files
5. ✅ Commit each file individually with smart categories:
   - Backend files → "Backend: Add filename.py"
   - Frontend files → "Frontend: Add filename.js"
   - Config files → "Config: Update filename.json"
   - Style files → "Styles: Update filename.css"
   - Documentation → "Docs: Update filename.md"
6. ✅ Push all commits to GitHub
7. ✅ Display summary

## Expected Output

```
===================================
NeuroQuery GitHub Auto-Commit System
===================================

📝 Initializing repository...
✅ Git repository initialized

🔧 Creating .gitignore...
✅ .gitignore created

📁 Scanning files...
✅ Found 82 files to commit

📤 Committing files...
✅ Backend: Add server.py
✅ Config: Update requirements.txt
✅ Frontend: Add Chat.js
✅ Docs: Add README.md
... (one commit per file)

🚀 Pushing to GitHub...
✅ Push successful!

===================================
✅ Summary
===================================
Total commits: 82
Total files pushed: 82
Repository: https://github.com/ishan22399/NeuroQuery
```

## Verify Success

After the script completes:

1. **Visit your repository**: https://github.com/ishan22399/NeuroQuery
2. **Check commits**: Click "Commits" tab
   - Should see 82+ individual commits
   - Each file has its own commit with descriptive message
3. **Verify file structure**: Click "Code" tab
   - Should see folders: backend/, frontend/, tests/
   - Should see files: README.md, design_guidelines.json, etc.
4. **Check .gitignore**: 
   - Should see .gitignore file in root
   - Contains proper ignore rules

## What Files Are Ignored

The script automatically creates a .gitignore that ignores:
- `node_modules/` - npm dependencies (will rebuild on clone)
- `.env` - Environment files with secrets
- `__pycache__/` - Python cache
- `*.pyc` - Compiled Python files
- `.git/` - Git metadata
- `.DS_Store` - macOS files
- `yarn.lock`, `package-lock.json` - Lock files
- `dist/`, `build/` - Build artifacts

## Commit Categories

The script intelligently categorizes commits:

| File Type | Pattern | Commit Message |
|-----------|---------|-----------------|
| Backend | `*.py` | `Backend: Add filename.py` |
| Frontend | `*.js`, `*.jsx` | `Frontend: Add filename.js` |
| Config | `*.json`, `*.txt` | `Config: Update filename.json` |
| Styles | `*.css` | `Styles: Update filename.css` |
| Docs | `*.md` | `Docs: Update filename.md` |
| Frontend Config | `craco.config.js`, `tailwind.config.js` | `Frontend Config: Update filename.js` |
| Misc | Others | `Add: filename` |

## Common Issues

### "git: command not found"
**Solution**: Install Git from https://git-scm.com/download/win

### "python: command not found"
**Solution**: Install Python from https://www.python.org/downloads/

### "Token authentication failed"
**Solution**: 
- Verify token was copied completely (no spaces before/after)
- Token may have been wrong or expired
- Create a new token and try again

### "Repository already exists"
**Solution**:
- This means someone (or GitHub) already has ishan22399/NeuroQuery
- Either create a different repository name or delete the existing one

## What Happens Next

After successful push:

1. **Repository is public** - Anyone can view and clone it
2. **Code is safe** - `.env` and `node_modules` are in .gitignore
3. **Clean history** - Individual commits for each file
4. **Ready to share** - Can send link to collaborators
5. **Portfolio ready** - Can showcase on resume/portfolio

## Cloning the Repository

After pushing, others (or you on another computer) can clone with:

```bash
git clone https://github.com/ishan22399/NeuroQuery.git
cd NeuroQuery
pip install -r backend/requirements.txt
npm install --prefix frontend
```

## Troubleshooting

If something goes wrong:

1. **Check your token**: https://github.com/settings/tokens
2. **Verify git config**: `git config --global user.name` and `git config --global user.email`
3. **Check repository exists**: https://github.com/new
4. **Review logs**: The script shows detailed error messages

## Questions or Issues?

If you encounter problems:
1. Check the error message carefully
2. Verify token has correct scopes
3. Ensure repository was created on GitHub
4. Verify internet connection
5. Try running the script again

## Next Steps

Once successfully pushed:

1. ✅ Share repository link with team
2. ✅ Add collaborators if needed (Settings → Collaborators)
3. ✅ Enable Discussions for feedback
4. ✅ Add topics for discoverability (RAG, OpenAI, MongoDB, etc.)
5. ✅ Add repository to your portfolio

---

**Happy committing! 🚀**

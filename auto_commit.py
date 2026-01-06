#!/usr/bin/env python3
"""
Automated GitHub commit script for NeuroQuery project
Commits each file individually with proper messages
Ignores node_modules and .env files
"""

import os
import subprocess
import sys
from pathlib import Path
from datetime import datetime

class GitAutoCommitter:
    def __init__(self, repo_url, local_path="."):
        self.repo_url = repo_url
        self.local_path = Path(local_path)
        self.commits_made = 0
        self.files_skipped = 0
        
        # Files/folders to ignore
        self.ignore_patterns = [
            'node_modules',
            '.env',
            '.env.local',
            '.env.*',
            '__pycache__',
            '*.pyc',
            '.git',
            '.DS_Store',
            'yarn.lock',
            'package-lock.json',
            'dist',
            'build'
        ]
    
    def should_ignore(self, file_path):
        """Check if file should be ignored"""
        path = Path(file_path)
        
        # Check each ignore pattern
        for pattern in self.ignore_patterns:
            if pattern in str(path):
                return True
            if path.name == pattern:
                return True
        
        return False
    
    def get_file_category(self, file_path):
        """Determine file category for commit message"""
        file_path = str(file_path).lower()
        
        if '.py' in file_path or 'backend' in file_path:
            return 'backend'
        elif '.js' in file_path or '.jsx' in file_path or 'frontend' in file_path:
            return 'frontend'
        elif '.json' in file_path or '.config' in file_path:
            return 'config'
        elif '.css' in file_path:
            return 'styles'
        elif '.md' in file_path or 'readme' in file_path:
            return 'docs'
        else:
            return 'misc'
    
    def get_commit_message(self, file_path):
        """Generate meaningful commit message"""
        category = self.get_file_category(file_path)
        file_name = Path(file_path).name
        
        messages = {
            'backend': f"Backend: Add {file_name}",
            'frontend': f"Frontend: Add {file_name}",
            'config': f"Config: Update {file_name}",
            'styles': f"Styles: Add {file_name}",
            'docs': f"Docs: Add {file_name}",
            'misc': f"Add {file_name}"
        }
        
        return messages.get(category, f"Add {file_name}")
    
    def run_command(self, cmd, shell=False):
        """Run shell command and return output"""
        try:
            result = subprocess.run(
                cmd,
                shell=shell,
                capture_output=True,
                text=True,
                cwd=self.local_path
            )
            return result.returncode == 0, result.stdout, result.stderr
        except Exception as e:
            return False, "", str(e)
    
    def setup_repo(self):
        """Initialize and setup Git repository"""
        print("🔧 Setting up Git repository...")
        
        # Check if git repo exists
        git_dir = self.local_path / '.git'
        if not git_dir.exists():
            print("📦 Initializing new git repository...")
            success, _, err = self.run_command(['git', 'init'])
            if not success:
                print(f"❌ Failed to initialize git: {err}")
                return False
            
            # Add remote
            print(f"🔗 Adding remote: {self.repo_url}")
            success, _, err = self.run_command(['git', 'remote', 'add', 'origin', self.repo_url])
            if not success:
                print(f"❌ Failed to add remote: {err}")
                return False
        
        # Configure git user
        print("👤 Configuring git user...")
        self.run_command(['git', 'config', 'user.name', 'NeuroQuery Bot'])
        self.run_command(['git', 'config', 'user.email', 'bot@neuroquery.dev'])
        
        return True
    
    def create_gitignore(self):
        """Create .gitignore file if it doesn't exist"""
        gitignore_path = self.local_path / '.gitignore'
        if gitignore_path.exists():
            print("✅ .gitignore already exists")
            return True
        
        print("📝 Creating .gitignore...")
        gitignore_content = """# Dependencies
node_modules/
/node_modules
__pycache__/
*.pyc
.venv/
venv/

# Environment files
.env
.env.local
.env.*.local
.env.production.local

# Build outputs
/build
/dist
.next/
/out/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
/coverage
.nyc_output

# Misc
.cache/
.eslintcache
"""
        
        try:
            gitignore_path.write_text(gitignore_content)
            print("✅ .gitignore created")
            return True
        except Exception as e:
            print(f"❌ Failed to create .gitignore: {e}")
            return False
    
    def get_all_files(self):
        """Get all files to commit"""
        files_to_commit = []
        
        for root, dirs, files in os.walk(self.local_path):
            # Skip ignored directories
            dirs[:] = [d for d in dirs if not self.should_ignore(os.path.join(root, d))]
            
            for file in files:
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, self.local_path)
                
                if not self.should_ignore(relative_path):
                    files_to_commit.append(relative_path)
        
        return sorted(files_to_commit)
    
    def commit_file(self, file_path):
        """Commit a single file"""
        # Add file
        success, _, err = self.run_command(['git', 'add', file_path])
        if not success:
            print(f"   ❌ Failed to add: {err}")
            self.files_skipped += 1
            return False
        
        # Check if file was actually staged
        success, output, _ = self.run_command(['git', 'diff', '--cached', '--name-only'])
        if file_path not in output:
            print(f"   ⏭️  Skipped (no changes)")
            self.files_skipped += 1
            return False
        
        # Commit file
        message = self.get_commit_message(file_path)
        success, _, err = self.run_command(['git', 'commit', '-m', message])
        
        if success:
            print(f"   ✅ {message}")
            self.commits_made += 1
            return True
        else:
            print(f"   ❌ Failed to commit: {err}")
            self.files_skipped += 1
            return False
    
    def push_to_github(self):
        """Push all commits to GitHub"""
        print("\n📤 Pushing to GitHub...")
        
        success, output, err = self.run_command(['git', 'push', '-u', 'origin', 'main'])
        
        if not success and 'does not exist' in err:
            print("   Creating 'main' branch...")
            self.run_command(['git', 'branch', '-M', 'main'])
            success, output, err = self.run_command(['git', 'push', '-u', 'origin', 'main'])
        
        if success:
            print("✅ Successfully pushed to GitHub!")
            return True
        else:
            print(f"⚠️  Push warning: {err}")
            return True  # Don't fail if push has warnings
    
    def run(self):
        """Run the complete process"""
        print("🚀 NeuroQuery GitHub Auto-Committer")
        print("=" * 50)
        
        # Setup
        if not self.setup_repo():
            return False
        
        if not self.create_gitignore():
            return False
        
        # Get files
        print("\n📂 Scanning files...")
        files = self.get_all_files()
        print(f"   Found {len(files)} files to commit")
        
        # Commit each file
        print("\n💾 Committing files...")
        for file_path in files:
            self.commit_file(file_path)
        
        # Push to GitHub
        self.push_to_github()
        
        # Summary
        print("\n" + "=" * 50)
        print(f"📊 Summary:")
        print(f"   ✅ Commits made: {self.commits_made}")
        print(f"   ⏭️  Files skipped: {self.files_skipped}")
        print(f"   📦 Total files: {len(files)}")
        print("=" * 50)
        
        return True

def main():
    # GitHub configuration
    GITHUB_USERNAME = "ishan22399"
    REPO_NAME = "NeuroQuery"
    GITHUB_TOKEN = input("🔐 Enter your GitHub personal access token (or press Enter to skip): ").strip()
    
    if GITHUB_TOKEN:
        repo_url = f"https://{GITHUB_TOKEN}@github.com/{GITHUB_USERNAME}/{REPO_NAME}.git"
    else:
        repo_url = f"https://github.com/{GITHUB_USERNAME}/{REPO_NAME}.git"
    
    print(f"🎯 Target repository: {GITHUB_USERNAME}/{REPO_NAME}")
    print(f"📍 Local path: {Path.cwd()}")
    
    confirm = input("\n✅ Continue? (y/n): ").strip().lower()
    if confirm != 'y':
        print("❌ Cancelled")
        return 1
    
    committer = GitAutoCommitter(repo_url)
    
    if committer.run():
        print("\n🎉 All done!")
        return 0
    else:
        print("\n❌ Process failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())

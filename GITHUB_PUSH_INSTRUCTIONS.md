# Push to GitHub - Instructions

## Option 1: Create a New GitHub Repository (Recommended)

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name it: `muslim-sync` (or any name you prefer)
5. Choose Public or Private
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Option 2: Use Existing Repository

If you already have a GitHub repository URL, you can use that.

## Push Your Code

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add your GitHub repository as remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Rename branch to main if needed (GitHub uses 'main' by default)
git branch -M main

# Push your code
git push -u origin main
```

## Alternative: Using SSH

If you have SSH keys set up with GitHub:

```bash
git remote add origin git@github.com:YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

## Need Help?

If you need help with any step, let me know your GitHub username and repository name, and I can help you push!



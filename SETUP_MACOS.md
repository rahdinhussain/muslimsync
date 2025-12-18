# macOS Setup Guide

## Fix "Too Many Open Files" Error

The EMFILE error occurs because macOS has a default limit on the number of files that can be watched. Here are solutions:

### Option 1: Install Watchman (Recommended)

Watchman is Facebook's file watching service and is the best solution for React Native/Expo projects:

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Watchman
brew install watchman
```

After installing Watchman, restart your terminal and try `npm start` again.

### Option 2: Increase File Limit Permanently

Run these commands in your terminal (you'll need to enter your password):

```bash
echo "kern.maxfiles=65536" | sudo tee -a /etc/sysctl.conf
echo "kern.maxfilesperproc=65536" | sudo tee -a /etc/sysctl.conf
sudo sysctl -w kern.maxfiles=65536
sudo sysctl -w kern.maxfilesperproc=65536
```

Then restart your terminal.

### Option 3: Temporary Fix (Current Session Only)

Before running `npm start`, run:

```bash
ulimit -n 4096
npm start
```

This only works for the current terminal session.

## Recommended: Use Watchman

Watchman is specifically designed for this use case and is the recommended solution by Expo and React Native teams.



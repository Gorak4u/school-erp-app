---
description: Build and commit code changes after fixes
---

## Build and Commit Workflow

This workflow should be run after any code fixes are applied to ensure the code builds successfully and changes are committed with proper messages.

### Steps

1. **Build the code** - Run `npm run build` to verify the fix doesn't break anything
// turbo
2. **Git add changes** - Stage all modified files
// turbo  
3. **Git commit** - Commit with an appropriate short message based on the changes

### Usage

After applying any code fixes, run this workflow to automatically build and commit your changes.

### Commands

```bash
# Build the application
npm run build

# If build succeeds, add and commit changes
git add .

# Generate commit message based on the changes (you can customize this)
git commit -m "fix: $(git status --porcelain | head -1 | sed 's/.* //')"

# Or use a more descriptive commit message
git commit -m "fix: resolve [issue description] - [brief change summary]"
```

### Notes

- The workflow will only commit if the build succeeds
- You can customize the commit message format as needed
- All files are automatically staged before committing
- Steps marked with `// turbo` will auto-run when executing this workflow

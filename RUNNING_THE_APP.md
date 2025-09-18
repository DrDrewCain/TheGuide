# Running TheGuide Web Application

## Quick Start with Bun

Since you have Bun installed, here's the simplest way to run the web app:

### From the root directory:
```bash
# Install all dependencies (first time only)
bun install

# Run the web app
bun run dev:web
```

### Or directly from the web directory:
```bash
cd apps/web

# Install dependencies (first time only)
bun install --no-save  # This skips workspace dependency checks

# Run the development server
bun run dev
```

The app will be available at http://localhost:3000

## Fixing Common Issues

### 1. Workspace Dependencies Error
If you see "Workspace dependency not found" errors, you can temporarily run without them:
```bash
cd apps/web
bun install --no-save
bun run dev
```

### 2. CSS/Tailwind Errors
The CSS issues have been fixed. If you still see them, restart the dev server.

### 3. Import Errors
The app currently imports from `@theguide/models` which may show errors. These can be temporarily ignored while we set up the full workspace.

## Alternative: Using npm directly

If Bun workspace issues persist:
```bash
cd apps/web
npm install
npm run dev
```

## Next Steps

To fully utilize the monorepo structure with workspaces:
1. Use Bun from the root directory for all commands
2. Or switch to npm/yarn which have better monorepo support
3. Consider using Turborepo commands from root: `bun turbo run dev --filter=@theguide/web`
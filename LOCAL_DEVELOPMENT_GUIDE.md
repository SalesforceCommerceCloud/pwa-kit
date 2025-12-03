# Local Development and Testing Guide

This guide provides step-by-step instructions for making changes to UI or Backend components and testing them locally in the PWA Kit project.

## Prerequisites

- **Node.js**: Version 16.11, 18, 20, or 22
- **npm**: Version 8, 9, 10, or 11
- All dependencies installed (run `npm ci` from the root directory)

## Initial Setup

### 1. Install Dependencies

From the root of the monorepo:

```bash
npm ci
```

This command:
- Cleans and reinstalls all packages
- Links all packages together using Lerna
- Ensures you're using the same package versions as the team

**Important**: Run `npm ci` whenever you pull changes that include dependency modifications.

## Making Changes

### UI Changes (Frontend Components)

UI components are located in:
- `packages/template-retail-react-app/app/components/` - React components
- `packages/template-retail-react-app/app/pages/` - Page components
- `packages/template-retail-react-app/app/static/` - Static assets (images, CSS, etc.)

**Example**: If you're modifying a login form component:
- File: `packages/template-retail-react-app/app/components/forms/login-fields.jsx`

### Backend Changes (Server-Side)

Backend/server code is located in:
- `packages/template-retail-react-app/app/ssr.js` - Server-side rendering logic
- `packages/pwa-kit-runtime/src/` - Runtime environment code
- `packages/pwa-kit-dev/src/` - Development tools and build scripts

## Testing Changes Locally

### Step 1: Start the Development Server

From the **root directory**:

```bash
npm start
```

Or from the `packages/template-retail-react-app` directory:

```bash
cd packages/template-retail-react-app
npm start
```

This will:
- Start the development server with hot module replacement (HMR)
- Open your browser to `http://localhost:3000`
- Automatically reload when you make changes to files

**Note**: The development server uses hot module replacement, so most changes will be reflected immediately without a full page reload.

### Step 2: Verify Your Changes

1. **Open your browser** to `http://localhost:3000`
2. **Navigate** to the page/component you modified
3. **Test the functionality** to ensure your changes work as expected
4. **Check the browser console** for any errors or warnings

### Step 3: Run Linting

Before committing, ensure your code follows the project's style guidelines:

From the **root directory**:

```bash
npm run lint
```

To automatically fix linting issues:

```bash
npm run lint:fix
```

### Step 4: Run Unit Tests

Test your changes with unit tests:

From the **root directory**:

```bash
npm test
```

This runs tests for all packages. To run tests for a specific package:

```bash
cd packages/template-retail-react-app
npm test
```

### Step 5: Run E2E Tests (Optional)

For end-to-end testing:

From the **root directory**:

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run accessibility tests
npm run test:e2e:a11y
```

## Development Workflow Summary

### Quick Development Cycle

1. **Make your changes** to UI or backend files
2. **Save the file** - HMR will automatically reload (for UI changes)
3. **Refresh browser** if needed (for backend/SSR changes)
4. **Test functionality** in the browser
5. **Run linting**: `npm run lint:fix`
6. **Run tests**: `npm test`
7. **Commit your changes**

### For Backend/SSR Changes

If you modify server-side code (like `app/ssr.js`):
- The server will automatically restart
- You may need to refresh your browser to see changes
- Check the terminal for any server errors

### For UI Component Changes

If you modify React components:
- Hot Module Replacement (HMR) will update the page automatically
- No browser refresh needed in most cases
- If HMR doesn't work, try a hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows/Linux)

## Advanced Development Options

### Debug Mode

To start the server with Node.js inspector for debugging:

```bash
cd packages/template-retail-react-app
npm run start:inspect
```

Then attach your debugger to the Node.js process.

### Disable Hot Module Replacement

If you need to disable HMR:

```bash
cd packages/template-retail-react-app
npm run start -- --noHMR
```

### Build for Production Testing

To test a production build locally:

```bash
cd packages/template-retail-react-app
npm run build
```

Then you can test the production build to ensure everything works correctly.

## Troubleshooting

### Changes Not Reflecting

1. **Clear browser cache** and do a hard refresh
2. **Restart the development server** (Ctrl+C, then `npm start`)
3. **Check for syntax errors** in the terminal
4. **Verify file was saved** correctly

### Server Won't Start

1. **Check Node.js version**: `node --version` (should be 16.11+, 18, 20, or 22)
2. **Reinstall dependencies**: `npm ci` from root
3. **Check for port conflicts**: Ensure port 3000 is not in use
4. **Check terminal output** for specific error messages

### Tests Failing

1. **Run linting first**: `npm run lint:fix`
2. **Check test output** for specific error messages
3. **Ensure dependencies are up to date**: `npm ci`
4. **Run tests for specific package** to isolate issues

### Build Errors

1. **Check for syntax errors** in your code
2. **Run linting**: `npm run lint`
3. **Check terminal output** for specific build errors
4. **Ensure all dependencies are installed**: `npm ci`

## Best Practices

1. **Run `npm ci`** after pulling changes that modify dependencies
2. **Run linting** before committing: `npm run lint:fix`
3. **Run tests** before committing: `npm test`
4. **Test in browser** after making changes
5. **Check console** for errors and warnings
6. **Test on different browsers** if possible
7. **Test responsive design** on different screen sizes

## File Structure Reference

```
pwa-kit/
├── packages/
│   ├── template-retail-react-app/    # Main application
│   │   ├── app/
│   │   │   ├── components/            # React components (UI)
│   │   │   ├── pages/                 # Page components
│   │   │   ├── ssr.js                 # Server-side rendering (Backend)
│   │   │   └── static/                # Static assets
│   │   └── package.json
│   ├── pwa-kit-runtime/               # Runtime environment
│   ├── pwa-kit-dev/                   # Development tools
│   └── ...
└── package.json                        # Root package.json
```

## Quick Command Reference

| Command | Description | Location |
|---------|-------------|----------|
| `npm ci` | Install/update dependencies | Root |
| `npm start` | Start dev server | Root or template-retail-react-app |
| `npm run lint` | Check code style | Root |
| `npm run lint:fix` | Fix code style issues | Root |
| `npm test` | Run all tests | Root |
| `npm run test:e2e` | Run E2E tests | Root |
| `npm run build` | Build for production | template-retail-react-app |

## Additional Resources

- [Contributing Guide](./CONTRIBUTING.md)
- [PWA Kit Documentation](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/overview)
- [Retail React App README](./packages/template-retail-react-app/README.md)


# Run Template Retail React App

## Prerequisites
- Node.js 18 or later
- npm 9 or later

Check your current versions and proceed only if requirements are met:
```sh
REQUIRED_NODE_MAJOR=18
REQUIRED_NPM_MAJOR=9

NODE_VERSION=$(node --version | sed 's/v//;s/\..*//')
NPM_VERSION=$(npm --version | sed 's/\..*//')

echo "> Checking Node.js version..."
echo "> node --version"
node --version
if [ "$NODE_VERSION" -lt "$REQUIRED_NODE_MAJOR" ]; then
  echo "Error: Node.js 18 or later is required. You have: $(node --version)"
  exit 1
fi

echo "> Checking npm version..."
echo "> npm --version"
npm --version
if [ "$NPM_VERSION" -lt "$REQUIRED_NPM_MAJOR" ]; then
  echo "Error: npm 9 or later is required. You have: $(npm --version)"
  exit 1
fi

echo "Node.js and npm prerequisites satisfied. Proceeding..."
```
---

Follow these steps to start the Template Retail React App:

1. **Install dependencies at the root of your repository:**
   ```sh
   echo "Installing all project dependencies at the root using 'npm ci'..."
   npm ci
   ```
2. **Navigate to the template app directory and start the development server:**
   ```sh
   echo "Changing directory to the template retail React app..."
   cd packages/template-retail-react-app
   echo "Starting the development server for the template retail React app..."
   npm start
   ``` 
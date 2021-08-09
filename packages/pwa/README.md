# Mobify Platform PWA Demo

### What is it?

This package is a sample PWA that will serve as a starting point
for the Mobify Scaffold.

The sample pages include links to sections in our documentation that demonstrate
how to build a PWA using our tools by including forms, modals, navigation, etc.
We recommend running the PWA and explore the sample pages to get a feel for where
to begin.

Setup instructions can be found in the public README in this repo.

### Developing against a local version of the PWA SDK

If you want to test changes to the PWA SDK against the Scaffold, you can easily do so:
you will need to clone the SDK (note: it is not open on Github).

```bash
# From any desired folder, clone the `progressive-web-sdk` and change directories into the cloned project
git clone git@github.com:mobify/progressive-web-sdk.git
cd progressive-web-sdk

# Install project dependencies (REQUIRED)
npm install

# Some assets required by the scaffold build are only created by this command (/dist/*)
npm run prod:build

# Create global link
npm link
```

Then inside the `mobify-platform-sdks/packages/pwa` folder run:

```bash
# Link dependency. Ensure you have installed your project depen `npm ci` in the root of repo first
npm link progressive-web-sdk

# (or `npm run start:preview` for web builds)
npm start
```

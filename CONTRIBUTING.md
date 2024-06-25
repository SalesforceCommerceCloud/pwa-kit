# Contributing to PWA Kit

We welcome contributions to PWA Kit! To ensure that your contributions are addressed in a timely manner, keep the following guidelines in mind.

> **Contributor License Agreement (CLA)**:
>
> All external contributors must sign the [Contributor License Agreement](https://cla.salesforce.com/sign-cla) (CLA). A prompt to sign the agreement appears whenever a pull request is submitted.

This repository is a [monorepo](https://en.wikipedia.org/wiki/Monorepo) that includes the code that powers the PWA Kit. The code is divided into the following packages:

- `commerce-sdk-react`: A library that provides react hooks for fetching data from Commerce Cloud
- `internal-lib-build`: A package that contains internal tools used by other libraries in the monorepo 
- `pwa-kit-create-app`: A tool that generates PWA Kit projects based on the Retail React App template
- `pwa-kit-dev`: A set of commands to build PWA Kit projects
- `pwa-kit-react-sdk`: A set of components and utilities for PWA Kit projects
- `pwa-kit-runtime`: A package that contains runtime environments for applications to run on Managed Runtime
- `template-express-minimal`: A project template that can be used as a starting point for a generic Express application (does not include React)
- `template-mrt-reference-app`: A project template that is used by the Managed Runtime team to test platform features
- `template-retail-react-app`: A project template that can be used as a starting point for a full retail storefront
- `template-typescript-minimal`: A project template with TypeScript support that can be used as a starting point for React projects
- `test-commerce-sdk-react`: A project that is used to test `commerce-sdk-react` and demonstrate usage of the library

## 📦 Dependencies

Behind the scenes, we use [Lerna](https://lerna.js.org/) to manage the monorepo. Lerna lets
us install all dependencies and link all packages together with one command:

```bash
npm ci
```

Dependencies that are added to the `package.json` file at the root of the
repo are shared between packages. Dependencies listed in the
`package.json` files within each individual package directory work as normal.

## 🏗️ Cleaning & Rebuilding

When you pull changes that include modifications to any package’s dependencies, run `npm ci` from the top-level directory (`pwa-kit`). This command cleans and reinstalls all packages. Run this command frequently during development to ensure that you’re using the same package versions as everyone else.

For more information, see the [Lerna docs](https://lerna.js.org/).

## 👓 Linting

```bash
  npm run lint
```

## 🧪 Testing

Run tests for all packages with:

```bash
  cd [repo root]
  npm test
```

## 🐛 Issues

If you’re experiencing an issue, check the open issues first. If someone hasn’t already raised the same issue, file a new issue with a description of the problem and describe the steps to reproduce it. If you require an urgent response to your issue, file a support ticket with [Salesforce Commerce Cloud](https://help.salesforce.com/). You can also create an issue to request a new feature.

## 🎁 Submit a Pull Request

> **Note**: All your commits must be signed. To learn how to set up commit signing, see this help doc from GitHub: [Managing Commit Signature Verification](https://docs.github.com/en/authentication/managing-commit-signature-verification).

1. Create an issue.
2. Create a fork of this repository.
3. Create a branch off the develop branch.
4. Add your changes to your branch.
5. Create a pull request against the develop branch.

## 🏅 Best Practices

-   When logging an issue or creating a pull request for the first time, tell us a bit about yourself. Do you work for a Salesforce customer or partner organization? What PWA Kit projects are you actively working on?
-   To reduce merge conflicts, squash and rebase your branch before submitting your pull request.
-   In your pull request, include:
    -   A brief description of the problem and your solution
    -   Steps to reproduce
    -   Screenshots
    -   Error logs (if applicable)
-   Make sure that your code builds successfully and passes the unit tests. Refer to the README for steps on how to run tests.
-   Monitor your pull requests. Respond in a timely manner to any comments, questions, and change requests.

## 👀 Review Process

After submitting a pull request, the PWA Kit team will review it and consider it for merging.

The team periodically closes any abandoned pull requests that they find.

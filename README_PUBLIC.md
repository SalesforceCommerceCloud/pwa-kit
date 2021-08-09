# Mobify Platform Project

This Mobify Platform project is a _monorepo_ that includes the Javascript packages
you need to build your frontends. It includes:

- `pwa` - the code for your PWA
- `connector`  - the code for your data layer, using commerce-integrations

## Requirements

```
  node@v10.17.0
  npm@v6.11.3
```

## Setup

Behind the scenes we're using [Lerna][lerna] to manage the monorepo. This lets us
install all your dependencies in one single command:

```bash
  npm ci
```

You'll need to re-run this command every now and then, if your packages dependencies
change.

Once you've installed your dependencies, see `packages/pwa/README.md` to learn how
to get started building and running your PWA.

## Linting

```bash
  npm run lint
```

## Testing

Run tests for all packages with:

```bash
  cd [repo root]
  npm test
```

Run integration tests against live APIs for all packages with:

```bash
  cd [repo root]
  npm run integrationTest
```


[lerna]: https://github.com/lerna/lerna

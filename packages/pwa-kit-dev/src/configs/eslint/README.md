# `pwa-kit-dev` ESLint configuations

## Configs

There are three configurations available:

* `recommended`: The default expectation for PWA Kit projects. Provides rules for JavaScript, TypeScript, React, and Jest.
* `no-react`: The `recommended` configuration with React rules removed to avoid logging unnecessary warnings.
* `safe-types`: The `recommended` configuration with stricter rules in TypeScript files regarding usage of the `any` type.

## Usage

Extending a `pwa-kit-dev` ESLint configuration is a little bit from the standard way to extend a file. Because the config is not from a package with a name starting with `eslint-config-`, you must provide the full path to the configuration file using `require.resolve()`. For example, a configuration file that simply extends the `recommended` configuration would look like this:

```js
module.exports = {
  extends: [require.resolve('@salesforce/pwa-kit-dev/configs/eslint/recommended')]
}
```

> **Note:** For convenience, `@salesforce/pwa-kit-dev/configs/eslint` is provided as an alias for the `recommended` configuration.

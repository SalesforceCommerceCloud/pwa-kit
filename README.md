# Mobify Platform SDKs

This is a _monorepo_ that includes the following packages that make
up the front end of the PWA Kit for Salesforce Commerce Cloud:

-   `pwa-kit-create-app` - The project generator for PWA Kit
-   `pwa-kit-react-sdk` - A set of components and utilities for PWA Kit
-   `pwa` - The scaffold for PWA Kit projects

Old branches include retired packages, such as:

-   `commerce-integrations`: ecommerce backend interface for Mobify v1 and v2
-   `connector` - The scaffold for an old project's data layer
-   `devcenter`: source files for the [DevCenter](https://dev.mobify.com), which includes docs for v1 and v2
-   `documentation-hub` - Mobify's documentation hub for v1 and earlier, hosted on https://docs.mobify.com
-   `documentation-theme` - A common theme shared across docs sites for v1 and earlier
-   `generator` - Project generator for v1 and v2
-   `progressive-web-sdk` - SDK for v1 and v2 that includes Analytics Integrations, the component library, and utility functions
-   `test-framework` - Mobify's testing best practices

## Product Documentation

Public-facing documentation lives on the [Commerce Cloud Developer Center](https://developer.commercecloud.com/s/article/PWA-Kit).

## Requirements

```
  Node ^12.x || ^14.x
  npm ^6.14.4
```

## Setup

Behind the scenes we're using [Lerna][lerna] to manage the monorepo. This lets
us install all dependencies and NPM-link all packages together in one command:

```bash
npm ci
```

Be aware that dependencies that are added to the `package.json` at the root of the
repo are shared between packages. This is useful if you want to standardize on
version `X` of a testing library, for example. Dependencies listed in a package-level
`package.json` work as normal.

### Cleaning/Rebuilding

When you pull changes that include modifications to any projects dependencies,
you can run `npm ci` at the root to quickly clean and re-install all packages,
ensuring that you're developing using the same package versions as everyone else
on the team. Do this frequently!

If you're interested, read up on the [lerna docs site][lerna].

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
  npm run test:integration
```

## Releasing

CircleCI will automatically publish to NPM from any branch name starting
with the `release-`. You need a basic understanding of https://semver.org/ to
release the packages in the monorepo.

Bear these branch naming conventions in mind:

-   We use the `develop` branch for normal feature development.
-   We use `release-` branches to review and release release-candidates.

When we release, we always make a "normal" or a "hotfix" release. Hotfixes are
something we _only_ do when we have found a bug in a released package and that we
want to fix quickly, outside of our normal release process.

Before starting any release, notify the [#product-release](https://mobify.slack.com/messages/#product-release)
channel and get a +1 from the engineering team.

## Normal Releases

Normal releases are made from the `develop` branch and the packages should therefore always have version numbers
in the form of `x.y.z-dev`, which tells you "we are working towards a release of version x.y.z".
If you checkout develop and see packages with a version number that doesn't end in `-dev`
something is wrong –ask someone for help.

It's easier to describe the release process using an example version number, so for
this example we'll pretend that we're going to release and the version number on the branch `develop`
is `1.1.0-dev`. This means that we'd be releasing version `1.1.0` to NPM. The version you find on
develop will be different, but the principles are the same.

The steps are as follows:

```
git checkout develop
git pull

# We want a long-lived branch to collect and review changes before releasing. 
# We'll also use this branch for making hotfix releases in the future.
git checkout -b release-1.1.x

# We'll bump the version numbers in the package.json files to show that this is a release candidate
npm run bump-version -- 1.1.0-alpha.0

git commit -am "Starting release process for 1.1.0"

# Pushing will cause Circle to release 1.1.0-alpha.0 to NPM which we can review.
git push

# Now, review and make changes to the release candidate. At very least, you want to
#
#  - Review/update CHANGELOG.md files for each of the packages.


# If you've made changes and want to publish another release candidate to NPM you can
# bump the release-candidate version, like this:
npm run bump-version -- 1.1.0-alpha.1

# Do that as often as necessary, until you are happy with the changes on
# the release branch. Once you're ready to release do this:

npm run bump-version -- 1.1.0  # Remove the -alpha.x suffix!
git commit -am "Version 1.1.0"
git tag v1.1.0
git push --tags && git push

# Now that the newly minted release branch is finalized, there are two administration 
# tasks that you'll want to complete. Firstly, you'll want to ensure that the new 
# branch is protected. Ask your Github admin to do this and ensure that they check
# the "Require status checks to pass before merging" flag. Secondly, update the 
# weekly builds in CircleCi adding this branch and removing any that fall out of our
# SLA (we currently support the last 3 minor versions).

# Once done, we need to merge our changes back into develop and prepare for
# development of the next release. Our releases are always planned to be
# minor version bumps because we are planning to add new features, but make
# no breaking changes. The next minor version bump up from 1.1.0 is 1.2.0,
# so we want to begin work on 1.2.0-dev. Run this:

git checkout develop
git merge release-1.1.x  # Ensure any fixes during the release process make it back into develop.
npm run bump-version -- 1.2.0-dev
git commit -am "Begin development on 1.2.0"
git push

```

When you're finished, drop and update in #product-release and #changelog to let
them know what's new.

## Hotfix Releases

Hotfix releases are a little different because we are making an emergency fix
to a package that we already released to NPM. It's not possible to replace packages
on NPM that we've already released though – we can only publish new versions to fix
the bugs and get people to upgrade. These new versions are hotfixes.

Executing hotfixes is simple, start by identifying which of the supported versions exhibits 
the bug and create a PR for each branch, addresses the bug and bumping the branches patch 
version. (NOTE: If the bug exists in `develop` you do not have to bump the version number.)

When you're finished, drop and update in #product-release and #changelog to let them know what's new.

[lerna]: https://github.com/lerna/lerna

## NPM vulnerabilities

When these are discovered they can prevent us from releasing – our repository is set up to use
the [Snyk GitHub integration](https://support.snyk.io/hc/en-us/articles/360015951318-GitHub-Enterprise-Integration).
Snyk test any newly created pull request in our repositories for security vulnerabilities, two Snyk status checks are
displayed — one for security tests and the other for license checks.

### Skip failed Snyk checks

The GitHub Snyk checks are configured to fail when new high vulnerabilities are introduced. After evaluating the risks
of merging the PR with the vulnerability, users with the Snyk Administrator role can unblock the PR
by [marking a failed test as successful](https://support.snyk.io/hc/en-us/articles/360007301698-Skipping-Snyk-Pull-Request-Checks)
.

### Ignore vulnerabilities

We ignore vulnerabilities using the Snyk UI. Navigate to the [projects page](https://app.snyk.io/org/mobify/projects),
find the manifest file with the vulnerability you want to ignore, and clicking the Ignore button.

### Fix vulnerabilities

In simple cases these vulnerabilities can be fixed by upgrading a package. We've two approaches
to [remediate vulnerabilities](https://support.snyk.io/hc/en-us/articles/360006113798-Remediate-your-vulnerabilities):

#### Using the Snyk UI

We
can [manually generate a PR fom the UI](https://support.snyk.io/hc/en-us/articles/360011484018-Fixing-vulnerabilities)
fixing individual or multiple vulnerabilities.

#### Using the Snyk CLI

**Install and Authenticate Snyk CLI:**

1. Install Snyk CLI via npm.
    ```bash
    npm install -g snyk
    ```
2. Run the `auth` command to open a browser tab.
    ```bash
    snyk auth
    ```
3. Click the Authenticate button.

**Running `snyk wizard`:**

To work around various issues with local-only monorepo packages, run the Snyk `wizard` at the root of each package of
the monorepo to fix vulnerabilities.

1. Remove any local-only dependencies from `package.json`.
2. Run `snyk wizard`
3. Add back the local-only dependencies to the `package.json`.

**Test for vulnerabilities with `snyk test`:**

Run the `test` command from the root of the monorepo.

```bash
snyk test --strict-out-of-sync=false --all-projects
```

## License Information

The PWA Kit is licensed under BSD-3-Clause license. See the [license](./LICENSE) for details.

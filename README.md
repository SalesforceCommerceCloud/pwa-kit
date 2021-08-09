# Mobify Platform SDKs

Mobify Platform SDKs is a _monorepo_ that includes the Javascript packages that make
up the front-end of the Mobify platform. These include:

- `@mobify/commerce-integrations` - A customizable API abstraction layer for ecommerce backends
- `@mobify/devcenter` - Mobify's v2.x documentation site (Gatsby)
- `@mobify/create-app` - Mobify's project generator
- `progressive-web-sdk` - A set of components and utilities which make up the SDK for Progressive Web. Includes a lot of content on docs.mobify.com in v1 branches.
- `scaffold-pwa` - The scaffold for PWA projects

## Requirements

```
  Node ^10.17.0 || ^12.0.0
  npm ^5.7.1
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

CircleCI will automatically publish to NPM from `master` or any branch name starting
with the `release-`. You need a basic understanding of https://semver.org/ to
release the packages in the monorepo.

Bear these branch naming conventions in mind:

- We use the `develop` branch for normal feature development.
- We use `release-` branches to review and release release-candidates.
- We use `master` to release production-quality versions of the SDK.

When we release, we always make a "normal" or a "hotfix" release. Hotfixes are
something we _only_ do when we have found a bug in a released package and that we
want to fix quickly, outside of our normal release process.

Before starting any release, notify the [#product-release](https://mobify.slack.com/messages/#product-release)
channel and get a +1 from the engineering team.

## Normal Releases

Normal releases are made from the `develop` branch. Packages on the develop branch
should always have version numbers of the form `x.y.z-dev`, which tells you "we are
working towards a release of version x.y.z". If you checkout develop and see
packages with a version number that doesn't end in `-dev` something is wrong –
ask someone for help.

It's easier to describe the release process using an example version number, so for
this example we'll pretend that the version number on develop is `1.1.0-dev`. That
would mean that we'd be releasing version `1.1.0` to NPM. The version you find on
develop will be different, but the principles are the same.

The steps are as follows:

```
git checkout develop
git pull

# We want a branch to collect and review changes before releasing.
git checkout -b release-1.1.0

# We'll bump the version numbers in the package.json files to show that this is a release candidate
npm run bump-version -- 1.1.0-alpha.0

git commit -am "Starting release process for 1.1.0"

# Pushing will cause Circle to release 1.1.0-alpha.0 to NPM which we can review.
git push

# Now, review and make changes to the release candidate. At very least, you want to
#
#  - Review/update CHANGELOG.md files for each of the packages.
#  - Update the `docs/public/versions.json` and `docs/public/release-dates.json` and append the new version number.


# If you've made changes and want to publish another release candidate to NPM you can
# bump the release-candidate version, like this:
npm run bump-version -- 1.1.0-alpha.1

# Do that as often as necessary, until you are happy with the changes on
# the release branch. Once you're ready to release do this:

npm run bump-version -- 1.1.0  # Remove the -alpha.x suffix!
git commit -am "Version 1.1.0"
git checkout master
git merge release-1.1.0
git tag v1.1.0
git push --tags  # Circle will publish to NPM

# Once done, we need to merge our changes back into develop and prepare for
# development of the next release. Our releases are always planned to be
# minor version bumps because we are planning to add new features, but make
# no breaking changes. The next minor version bump up from 1.1.0 is 1.2.0,
# so we want to begin work on 1.2.0-dev. Run this:

git checkout develop
git merge master
npm run bump-version -- 1.2.0-dev
git com -am "Begin development on 1.2.0"

```

When you're finished, drop and update in #product-release and #changelog to let
them know what's new.

## Hotfix Releases

Hotfix releases are a little different because we are making an emergency fix
to a package that we already released to NPM. It's not possible to replace packages
on NPM that we've already released though – we can only publish new versions to fix
the bugs and get people to upgrade. These new versions are hotfixes.

You start a hotfix by finding the commit for the release you want to fix, branching
from it, fixing the bug and re-releasing with a patch-level version bump.
The most common case is to hotfix the most recent release, which is easy to find –
it's usually the latest commit on master. If you want to hotfix an older release,
you can look it up by its git tag and you'll have to make decisions about exactly
which versions you want to hotfix (if you're patching 1.0.0 and the current release
is 1.4.0 you could choose to also hotfix 1.1.0, 1.2.0 and 1.3.0).

For this example we're going to talk about the most common case – patching a bug on
the most recent release and branching from master. We'll pretend `master` is on
`1.1.0` so our hotfix must be released under version 1.1.1, which is one patch-level
version bump upwards.

The steps are a little different from the normal release process. Again, if you
checkout master and you see package versions that are not production-quality (eg.
you see `1.1.0-dev` instead of `1.1.0`) then something is wrong – ask for help.

The steps:

```

git checkout master
git checkout -b release-1.1.1
npm run bump-version -- 1.1.1-alpha.0

git commit -am "Starting release process for 1.1.1"
git push  # Circle will release 1.1.1-alpha.0 to NPM which you can review.

# Keep making changes and releasing alpha versions until you are happy. Then:

npm run bump-version -- 1.1.1
git commit -am "Version 1.1.1"
git checkout master
git merge release-1.1.1
git tag v1.1.1
git push --tags  # Circle will publish to NPM


# You now want to merge your fixes back into develop. When you do this, you
# will see a merge conflict because the version numbers changed both on your
# hotfix branch and on develop. You want it to appear as though the hotfix
# came "before" the changes to develop though, so when resolving these conflicts
# you want to pick the version numbers from develop, not the ones from master.

git checkout develop
git merge master  # Conflict! Keep the version numbers from develop, not master!

# Resolve conflicts
git commit "Merged hotfix into develop"
git push


```

When you're finished, drop and update in #product-release and #changelog to let
them know what's new.

[lerna]: https://github.com/lerna/lerna

## Fixing NPM vulnerabilities

When these are discovered they can prevent us from releasing – our Circle builds are
set up to fail once a certain number of vulnerabilities is found across our packages.

In simple cases these vulnerabilities can be fixed automatically. To work around
various issues with local-only monorepo packages, run this to fix them:

```bash
  node scripts/audit.js --fix
```

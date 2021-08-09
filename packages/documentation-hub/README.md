# Mobify Documentation Hub ⚙️

## 👉 Quick Start

```sh
npm install

npm start

npm test
```

## [Contributing](./CONTRIBUTING.md)

To make a change:

1. Determine which base branch to use:
   * For changes that should go out _with_ the next stable release, create a branch off of `develop`.
   * For changes that should go out _before_ the next stable release, create a branch off of `master`.
2. Push changes to your branch.
3. Open a pull request to against the base branch you chose in Step 1.
4. Have your changes reviewed and 👍'ed using the [Writing Checklist](https://github.com/mobify/mobify-code-style/tree/master/docs#writing-checklist).
5. Merge + Profit 💰

**If you are updating live docs (you chose `master` in Step 1)**
You must _also_ merge your changes to `develop` so that they aren't overwritten by the next release:
* Change the base branch of your (same) PR to `develop`
* Merge your PR to `develop` (no additional review required).

All changes merged to `master` or `develop` are automatically deployed by Circle CI to the
appropriate environment (`master` goes to production, `develop` goes to staging).

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for info on adding or editing documents.

## 👉 Deployment

The Hub is hosted on S3:

- Production: <http://docs.mobify.com.s3-website-us-east-1.amazonaws.com>
- Development: <http://docs-staging.mobify.com.s3-website-us-east-1.amazonaws.com>

We use CloudFront as a CDN and for SSL termination:

- Production: <https://d5oarlrtdjbcr.cloudfront.net> (ID: EWTUW3ELN40OC)
- Development: <https://d1gsgkziqdawl7.cloudfront.net> (ID: E1MKZCJ6791YMP)

Actual public domains (managed in Dyn):

- Production: <https://docs.mobify.com>
- Development: <https://docs-staging.mobify.com>

### Manual Deployment

> **Why are you doing this?** Documentation deployment is automated with CircleCI!

Hop in `#docs` and let folks know why you want to manually deploy. _We'd love to fix it so you don't have to!_.

Next, setup your [AWS keys](https://mobify.atlassian.net/wiki/questions/56918027/how-do-i-configure-my-s3-keys).

Finally:

```bash
# 🏗 Testing -- for development of docs. You probably don't need this.
# docs-testing.mobify.com.s3-website-us-east-1.amazonaws.com/
npm run deployDocs testing

# 🔍 Staging -- for reviewing docs content changes before releasing
# docs-staging.mobify.com
npm run deployDocs staging

# 🚀 Do it live
# docs.mobify.com
npm run deployDocs production
```

## 👉 Testing and Linting

```sh
# Does it work?
npm test
# Does it compile?
npm run compile
# Does it lint?
npm run lint
```

[`remark`](https://github.com/wooorm/remark) can automatically fix most Markdown
errors:

```sh
./node_modules/.bin/remark public --output
```

### Weirdness and Hacks

* `robots.txt` was manually placed in S3. It isn't automatically uploaded when you deploy. _Staging and Production use different files!_

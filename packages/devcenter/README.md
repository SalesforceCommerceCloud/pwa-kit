# Mobify Dev Center

## Development

### Algolia credentials

Before you can start your local dev server you will need the Algolia credentials file from Lastpass. You will need to copy the file into `packages/devcenter/` and rename it to `.env`.

### Starting the dev server

```bash
cd packages/devcenter
npm start
```

If you need to preview inline images or you make a change that impacts navigation, run `gatsby clean` before starting the dev server. (You will need to install [Gatsby CLI](https://www.gatsbyjs.org/docs/gatsby-cli/).)

### Adding new folder to `content`

When you need to add another new folder/structure to `content`, a few steps need to be taken after the content is added to make sure everything work properly

-   Please add source file to `gatsy-config`. For example, if you want to add a new folder `mobify-univeristy` under `content`, you need to add :

```json
{
    "resolve": `gatsby-source-filesystem`,
    "options": {
        "name": `mobify-university`,
        "path": `${__dirname}/content/mobify-university`
    }
}
```

-   Rearrange the order of appearance in the LeftSideBar in `config.js`
-   Add new main navigation const to `mainNavConst.js`
-   If the page should not display the right side bar (like on most landing pages), please add `column: 2` to the frontmatter section
-   If the page should not display the left and right side bar (like on most home page and 404 page), please add `column: 1` to the frontmatter section

### Changing the name of direct folder under `content`

If you wish to change the name of any direct folder under `content`, please look into `gitignore` to update the latest name to it
so we don't commit jsdoc pages to git. They are auto generated files, so they are not supposed to live in git.
We have had a build/dev process take care of it

## Deployment 🚢
DevCenter can be deployed to our non-production or production AWS root accounts. In order to deploy to one of those accounts you must:

1. Log into the appropriate PCSK dashboard for the account:
    - `Managed Runtime Non-Production Root`: https://dashboard.prod.aws.jit.sfdc.sh/
    - `Managed Runtime Production Root`: https://dashboard.prodga.aws.jit.sfdc.sh/
2. Request access for Developer role and get approval from someone on our team.
3. Once approved, click "export credentials" to copy-paste a code snippet
   containing environment variables for your shell.
4. Paste that snippet into your shell.

### Deploy to staging from local build

```bash
cd packages/devcenter
npm run build-and-deploy
```

After you've deployed to [staging](https://dev.mobify-staging.com/), you may need to fix the homepage redirect (to `/v2.x/`). Find out how to do that in the section ["Set Homepage Redirect"](#set-homepage-redirect).

### Deploy to production from local build

```bash
cd packages/devcenter
npm run build-and-deploy -- --bucket mobify-devcenter-120963225130
```

Don't forget to add a note to #changelog describing your changes.

## Environments

Dev Center is deployed on AWS with [CloudFormation](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks?filteringText=devcenter).

**Production: `devcenter-120963225130`**

-   http://mobify-devcenter-120963225130.s3-website-us-east-1.amazonaws.com/
-   https://dev.mobify.com/

**Staging: `devcenter-766791126171`**

-   http://mobify-devcenter-766791126171.s3-website-us-east-1.amazonaws.com/
-   https://dev.mobify-staging.com/

If you need to update these stacks:

```bash
# Create and update `devcenter-production` => Use credential for the Prod Root Account:

aws cloudformation deploy \
  --region 'us-east-1' \
  --stack-name 'devcenter' \
  --template-file './devcenter.yaml' \
  --capabilities 'CAPABILITY_NAMED_IAM' \
  --parameter-overrides Environment=production

# Update `devcenter-staging` => Use credentials for the Non-Prod Root Account:
aws cloudformation deploy \
  --region 'us-east-1' \
  --stack-name 'devcenter' \
  --template-file './devcenter.yaml' \
  --capabilities 'CAPABILITY_NAMED_IAM' \
  --parameter-overrides Environment=staging
```

### Algolia search

The search feature on DevCenter is powered by [Algolia](https://www.algolia.com/). The index is updated at build time using the code in `src/utils/algolia.js`. We currently have two indexes:
`dev_DEVCENTER` (for deploying to the staging environment) and `prod_DEVCENTER` (for deploying to the production environment). Both indexes belong to the DEVCENTER application (ID: V0684M33JF) and they share the same API key for the application.

### Set Homepage Redirect

How you set the homepage redirect for the staging site:

```bash
aws s3api put-object \
    --bucket 'mobify-devcenter-766791126171' \
    --key 'index.html' \
    --website-redirect-location '/v2.x/' \
    --acl 'public-read'
```

### Clear CDN Cache

```bash
# 1st, get the CloudFront Distribution ID of your stack:
aws cloudformation describe-stacks \
    --stack-name 'devcenter' \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`] | [0].OutputValue' \
    --output 'text'

# 2nd, invalidate it:
aws cloudfront create-invalidation \
    --distribution-id 'E2O78YQ2TFFOWH' \
    --paths '/*'
```

# Mobify Dev Center

## Development

### Algolia credentials

Before you can start your local dev server you will need the Algolia credentials file from Lastpass. You will need to copy the file into `packages/devcenter/` and rename it to `.env`.

### Starting the dev server

```bash
cd packages/devcenter
npm start
```

### Deploy to staging from local build

```bash
cd packages/devcenter
npm run build-and-deploy
```

### Deploy to production from local build


```bash
cd packages/devcenter
npm run build-and-deploy -- --bucket mobify-devcenter-production
```

Don't forget to add a note to #changelog describing your changes.

If you need to preview inline images or you make a change that impacts navigation, run `gatsby clean` before starting the dev server. (You will need to install [Gatsby CLI](https://www.gatsbyjs.org/docs/gatsby-cli/).)

### Adding new folder to `content`
When you need to add another new folder/structure to `content`, a few steps need to be taken after the content is added to make sure everything work properly

- Please add source file to `gatsy-config`. For example, if you want to add a new folder `mobify-univeristy` under `content`, you need to add :
```json
{
    resolve: `gatsby-source-filesystem`,
    options: {
        name: `mobify-university`,
        path: `${__dirname}/content/mobify-university`
    }
}
```

- Rearrange the order of appearance in the LeftSideBar in `config.js`
- Add new main navigation const to `mainNavConst.js`
- If the page should not display the right side bar (like on most landing pages), please add `column: 2` to the frontmatter section
- If the page should not display the left and right side bar (like on most home page and 404 page), please add `column: 1` to the frontmatter section


### Changing the name of direct folder under `content`
If you wish to change the name of any direct folder under `content`, please look into `gitignore` to update the latest name to it
so we don't commit jsdoc pages to git. They are auto generated files, so they are not supposed to live in git.
We have had a build/dev process take care of it

## Environments

Dev Center is deployed on AWS with [CloudFormation](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks?filteringText=devcenter).

**Production: [`devcenter-production`](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/stackinfo?filteringText=devcenter-&filteringStatus=active&viewNested=true&hideStacks=false&stackId=arn%3Aaws%3Acloudformation%3Aus-east-1%3A787649934531%3Astack%2Fdevcenter-production%2Fae66cce0-17df-11ea-b016-12002b7e66d1)**

-   http://mobify-devcenter-production.s3-website-us-east-1.amazonaws.com/
-   https://dev.mobify.com/

**Staging: [`devcenter-staging`](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/stackinfo?filteringText=devcenter-&filteringStatus=active&viewNested=true&hideStacks=false&stackId=arn%3Aaws%3Acloudformation%3Aus-east-1%3A787649934531%3Astack%2Fdevcenter-staging%2F3eb85f80-17a3-11ea-928c-129cd46a326a)**

-   http://mobify-devcenter-staging.s3-website-us-east-1.amazonaws.com/
-   https://dev-staging.mobify.com/

If you need to update these stacks:

```bash
# Create and update `devcenter-production`:
aws cloudformation create-stack \
    --stack-name 'devcenter-production' \
    --template-body 'file://devcenter.yaml' \
    --capabilities 'CAPABILITY_NAMED_IAM' \
    --parameters 'ParameterKey=Environment,ParameterValue=production'

aws cloudformation update-stack \
    --stack-name 'devcenter-production' \
    --template-body 'file://devcenter.yaml' \
    --capabilities 'CAPABILITY_NAMED_IAM' \
    --parameters 'ParameterKey=Environment,ParameterValue=production'

# Update `devcenter-staging`:
aws cloudformation update-stack \
    --stack-name 'devcenter-staging' \
    --template-body 'file://devcenter.yaml' \
    --capabilities 'CAPABILITY_NAMED_IAM'
```

You shouldn't need to, but you can also easily create your own stack:

```bash
aws cloudformation create-stack \
    --stack-name 'devcenter-john' \
    --template-body 'file://devcenter.yaml' \
    --capabilities 'CAPABILITY_NAMED_IAM' \
    --parameters 'ParameterKey=Environment,ParameterValue=john'
```

> DNS for `mobify.com` is not controlled by AWS, so you'll need to set it up in Dyn.

## Algolia search

The search feature on DevCenter is powered by [Algolia](https://www.algolia.com/). The index is updated at build time using the code in `src/utils/algolia.js`. We currently have two indexes: 	
`dev_DEVCENTER` (for deploying to the staging environment) and `prod_DEVCENTER` (for deploying to the production environment). Both indexes belong to the DEVCENTER application (ID: V0684M33JF) and they share the same API key for the application.

### Set Homepage Redirect

```bash
aws s3api put-object \
    --bucket 'mobify-devcenter-staging' \
    --key 'index.html' \
    --website-redirect-location '/v2.x/' \
    --acl 'public-read'
```

### Clear CDN Cache

```bash
# 1st, get the CloudFront Distribution ID of your stack:
aws cloudformation describe-stacks \
    --stack-name 'devcenter-production' \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`] | [0].OutputValue' \
    --output 'text'

# 2nd, invalidate it:
aws cloudfront create-invalidation \
    --distribution-id 'E2O78YQ2TFFOWH' \
    --paths '/*'
```



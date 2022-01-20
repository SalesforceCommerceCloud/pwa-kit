# Commerce Cloud Managed Runtime tRPC + TypeScript POC

# What is this?
This is a POC of tRPC that can be deployed and works on Commerce Cloud Managed Runtime.
- It's written entirely in TypeScript
- Uses ESBuild to compile and bundle TypeScript code. So no need to deploy node_modules folder as well. Only code that is used is deployed everything else is dropped using tree shaking (see https://esbuild.github.io/api/#tree-shaking)
- Custom script to deploy the code to Managed Runtime
- Can be used standalone as it is to deploy custom BD API using tRPC protocol or since it's just an Express.js middleware it can also be mounted as part of a PWA kit app and used there.

## What is tRPC?
More info about tRPC at https://trpc.io/ and https://colinhacks.com/essays/painless-typesafety

## Change the package name
Edit `package.json` and set the package name to the MRT proejct name where you want to deploy this to

## How to build the code
Run `npm run build`

## How to deploy the code
Run `npm run deploy -- --username='<USERNAME>' --apiKey='<API KEY>' --message '¯\_(ツ)_/¯'`

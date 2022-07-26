# commerce-sdk-react hooks generator

A developer tool forked from commerce-sdk-isomorphic, used for generating SCAPI hooks for commerce-sdk-react.

## Setup

This is published as a branch of pwa-kit, but it's a fully separate project, so I recommend installing it in a separate directory.

```sh
# Recommended location: peer of your pwa-kit directory
git clone -b wjh/hooks-generator --depth 1 git@github.com:SalesforceCommerceCloud/pwa-kit.git hooks-generator
cd hooks generator
yarn install
```

## Editing templates

The templates (located in `./templates`) are handlebars templates, with some helpers from `handlebars-helpers` and some custom helpers that may or may not be used.

The data is AMF document models loaded from the RAML specs in `./apis`. AMF is a pain to work with, as it doesn't follow standard JavaScript patterns for accessing data (it's generated from Scala code). Particularly, a _lot_ of the data is exposed as getter methods, and getting the actual value (e.g. as a string) requires invoking `.value()`. On top of the AMF layer is a thin `ApiMetadata` / `ApiModel` class, defined in raml-toolkit.

Additional templates can be added by editing `./scripts/generate.ts`.

## Generating templates

You will need to generate the files in this project, and then copy them into pwa-kit. Note that the files are written for pwa-kit, so type checks in this directory will fail due to unresolved imports.

Generated files are placed in `./src/lib`. This can be changed in `./scripts/generate.ts`.

```sh
yarn run renderTemplates
# Assuming a `hooks-generator` is a peer of `pwa-kit`
OUTDIR=../pwa-kit/packages/commerce-sdk-react/src/hooks
rm -r $OUTDIR/Shopper* # There are non-generated files in the directory, don't delete them!
cp -r ./src/lib/ $OUTDIR
```

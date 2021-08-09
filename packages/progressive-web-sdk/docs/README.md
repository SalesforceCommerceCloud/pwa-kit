# Documentation

> Welcome to the SDK Docs! 🎉🎤 This is a static site containing all the
> documentation for the things in this repo. It's built with
> [Harp](http://harpjs.com) and styled with [Tachyons](http://tachyons.io).
> This is all controlled through Mobify's shared [documentation-theme](https://github.com/mobify/documentation-theme).
> It also integrates a React website based on [Styleguidist](https://github.com/styleguidist/react-styleguidist)
> to provide documentation of SDK components that support in-place editing.

_Docs uses a vendored version of Tachyons (v4.0.8) and not the version specified
in `package.json` (which is used for the actual scaffold)._

## Getting started

```sh
# ⬇️  Run at the root of the project to download dependencies.
npm install

# 🏃 Run the local docs server.
npm run docs:dev

# 👀 View docs
open http://localhost:9000
```

## Developing Styleguidist locally

- Clone Mobify's Styleguidist fork with
  `git@github.com:mobify/react-styleguidist.git`
- Run `npm link` inside the new [react-styleguidist
  repo](https://github.com/mobify/react-styleguidist)
- Back in the `progressive-web-sdk` repo, run `npm link react-styleguidist`
- `npm run docs:dev`
- Make your changes in [`docs/latest`](docs/latest)
- Open `http://localhost:9000` in your browser

## Writing and reviewing

### Start with a Google doc

When making a large change to documentation like starting a new document or completing a large revision of an existing document, use a Google doc instead of a text file. The annotation and collaboration tools in Google Docs make it easier for reviewers to help you find the right words to express your ideas clearly, and it’s easier to catch and correct errors in spelling, grammar, and style.

### Writing in a consistent style

A lot of people contribute to our docs. In order to keep them looking and
feeling consistent, try to follow these guidelines:
- [Mobify Content Style Guide](https://docs.google.com/a/mobify.me/document/d/1jlcg5boC3MUHN7fy2n3Yu_FBGzGgTUPrnMoePzQtqE4/edit?usp=sharing)
- [Mobify Capitalization and Spelling List](https://docs.google.com/document/d/1LO7RAr2vD3LFs_bj5j0vIFMKsVFrOFfEjpCheYEH3Lg/edit#heading=h.ibiuv244lv6z)
- [Taking Screenshots of a Terminal Window](https://mobify.slack.com/files/U0DKERQ21/F75RFRLAD/Terminal_Screenshot_Style_Guide)

**Writing great code examples**

- Choose a concise, simple example whenever possible.
- Explain your general approach in a few words to reinforce the concepts you're trying to teach. You can do that through code comments, or directly above the example.
- Assume that the readers of your document will copy and paste your code examples directly into their projects. That means you need to test they work (especially on PC machines, which is what most of our partners use)! 
- In addition, consider whether the code examples are safe for all users, even future users:
  1. What are the defaults of the functions in the code example? Why did we choose them? Are they safe for all kinds of projects?
  2. How do we expect the application to change over time? If it changes in that way, will this code be safe?

### Formatting diagrams & images

To ensure all diagrams follow a consistent format, we have a few simple guidelines for adding images or diagrams to the docs:
- Ensure the background is transparent
- Re-size the image or diagram to 688 pixels in width, and up to 688 pixels in height
- To prevent slow loading of the page, shrink the image in tinypng.com
- Add the formatted and compressed image back into the Markdown file using the following formatting:
<figure class="u-text-align-center" style="background-color: #fafafa;">
  
The Education team (Technical Trainer and Technical Writer) can support editing in Sketch to make any necessary Mobify style tweaks.

### QA your docs

Before committing your new doc, ensure that it's been through the following QA steps:
- Proofread 
- Test all exercises, UI navigation directions, code snippets, and commands on Windows and Mac
- Link checking: are internal links, external links, and re-directs working and going to the intended site?
- Is the UX working properly: in particular, are the table of contents, tabs and call-out boxes formatting correctly?
- Images: are they clear, consistently spaced and sized, with light gray background bordering around the image?

### A different review process

The review process for documentation is different from a code review. Using Google Docs allows a reviewer to take on the role of an editor. An editor will actually edit your work directly—if you ask them to. Make sure that you and the reviewer both agree on the kind of edits you’d like them to make and how they should make them. For example, you might ask the reviewer to correct any spelling errors directly but switch to suggesting mode before rewriting any sentences or restructuring the document. Suggesting mode allows you to track individual edits and choose whether to accept or reject them.

When you’re reviewing someone else’s work and aren’t sure about something, use the comments feature to ask the author for clarification rather than making an edit directly.

### Choosing reviewers

Choosing reviewers is also different for documentation. Don’t just choose reviewers who are already familiar with the topic, choose at least one reviewer who _isn't_ familiar with the topic. This reviewer can verify that the documentation is approachable for non-experts.

### Convert and commit

After you and at least one reviewer are happy with the final draft of the Google doc, convert it to Markdown and commit it to the `progressive-web-sdk` repository. _You'll still need to create a pull request to merge your work, but it shouldn’t take long since the content has already been reviewed!_

When you're editing documentation in your text editor, avoid introducing spelling errors by installing a spell checking extension. Here are some recommendations for popular editors:
* Atom: [linter-spell](https://atom.io/packages/linter-spell)
* Sublime Text: [Google Spell Check](https://packagecontrol.io/packages/Google%20Spell%20Check)
* Visual Studio Code: [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker)

### Becoming a better writer

Writing documentation will make you a better writer through practice. Each time you go through the review process, you'll get more feedback, gain confidence, and pick up new skills.

If you'd like guidance from someone who reviews writing for a living, you're in luck! In 2017, Frances Peck, a professional editor, put on a writing workshop for Mobify. Frances told some great stories, shared lots of expert advice, and even handed out exercises so that we could practice what we learned.

If you missed the workshop, or want a refresher, you can [watch the event](https://www.youtube.com/watch?v=Ys4Bp_5cZMk) (3 hours) and download her slide deck and handouts from the [Resources for Writers](https://drive.google.com/drive/folders/1K8CB5LbOvgPtKlZmY29VuWiyliQmAs0W?usp=sharing) folder on Google Drive.

## Tips and tricks

### Best practices

- Write with simple language. For example, "use" is easier to understand that "utilize".
- If you must use acronyms, spell them out in full the first time they're introduced.
- Include code examples to demonstrate the material whenever possible.
- When it's possible, avoid documenting things that you expect to change often, like screenshots, or outputs of commands.
- Avoid documenting the arguments a command takes within a user guide. Instead, document these with API Reference documentation, or In Product documentation.

### Menu

The side-bar menu is built using a Pug partial named [`_sidebar.pug`](https://github.com/mobify/documentation-theme/blob/master/mixins/sidebar.pug).
This sidebar uses the `_data.json` files in documentation tree to determine the
title for each document. Each entry is keyed by the folder name in the
directory. The contents of the entry is a hash of keys. The most important one
is 'title' which describes what the menu item should be in the sidebar. This key
also controls the header bar content when you view that page.

#### Hiding pages from the menu

Sometimes it is useful to be able to work on a document without it showing up in
the menu yet. A simple trick to do this is to prefix the `_data.json` entry with
an underscore (`_`). `_sidebar.jade` will hide that entry from the menu. You can
still view the page by typing in the URL directly to the page to preview it.

Example: I'm working on a new page that I'm going to call "Quick Start". I've
added it to `/docs/public/latest/getting-started/overview`. I've also added the
following to `/docs/public/latest/getting-started/_data.json`:

```json
{
    ...
    "overview": {
        "title": "Getting Started"
    }
}
```

Now I want to make sure that it's not accessible because it's not finished but I
want to make sure when someone else comes along they can see in `_data.json`
that it's there and being worked on. I'll just change the key in `_data.json` to
begin with an underscore to hide it.

```json
{
    ...
    "_overview": {
        "title": "Getting Started"
    }
}
```

I can still [preview](#developing-locally) the page by navigating directly to it
here:
[http://localhost:9000/latest/getting-started/overview](http://localhost:9000/latest/getting-started/overview).
But you'll note that it doesn't show up in the menu.

## The version picker

Here's how the version picker is created:

1. Mobitron's [release script](https://github.com/mobify/mobitron/blob/master/scripts/release.js) will generate a file called [versions.json](https://github.com/mobify/progressive-web-sdk/blob/develop/docs/public/versions.json) that contains an array of all the (non-preview) versions of the SDK
1. We manually maintain a file called [release-dates.json](https://github.com/mobify/progressive-web-sdk/blob/develop/docs/public/release-dates.json) that contains an object that maps versions to release dates
1. The [version picker](https://github.com/mobify/documentation-theme/blob/develop/theme/js/version-picker.js) script in `documentation-theme` will generate the dropdown menu based on `versions.json`. If a match is found for a version number in `release-dates.json`, then the release date (ex: January 2019) will appear next to the version number (in parentheses) in the version picker.

## Deploying documentation

Documentation is automatically published any time we merge into `master` or
`develop` (via CircleCI). The documentation found in `master` is what is
live on docs.mobify.com/progressive-web/latest, the documentation found in
`develop` is what is live on docs-staging.mobify.com/progressive-web/latest.

The entire deployment process is managed within `circle.yml` and the
[documentation-theme](https://github.com/mobify/documentation-theme).
These scripts are basically just compiling docs using harp and uploading them
to AWS S3 in the right spot.


### Making changes to live docs

As long as you are making _only_ docs changes, you do not need to do a release
to get your changes live. This means we **do not use mobitron or bump the
version number**. Follow this process:
1. `git checkout master`
2. `git pull`
3. `git checkout -b my-docs-hotfix`
4. Make your changes on `my-docs-hotfix` branch.
5. Open a PR requesting to merge `my-docs-hotfix` into `master` and obtain +1.
6. Merge PR to `master` (do not delete your branch yet).
7. Create a new PR to merge `my-docs-hotfix` into `develop` and obtain +1.
8. Check over your PR, ensure that only your expected docs changes are showing.
9. Merge your PR to `develop`.
10. Delete the `my-docs-hotfix` branch.

### Manual deployment

If you think you need to deploy docs manually, please talk with a tech lead
first since this should be very rare. In this case you can
deploy the documentation manually by simulating the process that `circle.yml`
follows.

> **Note**: Before starting this process you must have AWS credentials with
> access to Mobify's documentation AWS bucket (docs.mobify.com). Ask in #it if
> you need access.

**AWS client**

Before you begin you will need to ensure you have the AWS command-line (CLI)
client installed and configured. On macOS systems you can install it easily
using Homebrew by running `brew install awscli`. If you don't use Homebrew,
please refer to the [AWS installation
guide](http://docs.aws.amazon.com/cli/latest/userguide/installing.html).

Once you have the CLI installed you will need to configure it with your AWS
credentials. Use this
[guide](https://mobify.atlassian.net/wiki/display/PLAT/Managing+AWS+keys+as+Environment+Variables)
to set up your AWS credentials.

#### Release documentation

*Before you begin, make sure you are in the root of the SDK repo.*

These steps assume you are patching the most recently released version of the
live documentation. This will release to both the `version` you supply as well
as update `latest`.

```sh
npm run docs:deploy -- -e production -v <version>
```

If you need to update an _older_ version of the docs you'll
need to do that **manually since the scripts currently always update `latest`**.
Note also that we don't store older versions of released documentation. If you
need to patch the documentation for a release older than the current release,
you'll need to checkout the tag for that release, make the changes, and then
release from there by manually uploading changed files to AWS. Again, **do not
use the release script to attempt to deploy an old version of docs, you will
overwrite `latest` with the old version.**

## Share the docs

Mobify's docs are primarily intended to help partners and customers, but they're also useful for Mobifyers internally. You can help spread knowledge internally by sharing new docs to the appropriate Mobify Slack channel, typically #platform-success, #ps-edge or #engineering. You can also share the doc to more readers by including it in Mobify's Release Notes in the section called "Documentation", which is designed to highlight new documentation articles, and significant updates.

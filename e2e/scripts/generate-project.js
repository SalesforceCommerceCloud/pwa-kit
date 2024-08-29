/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const { runGeneratorWithResponses } = require("./execute-shell-commands.js");
const config = require("../config.js");
const { program, Argument } = require("commander");
const { mkdirIfNotExists } = require("./utils.js");

const main = async (opts) => {
  const { projectKey, projectConfig } = opts;

  if (!projectKey && !projectConfig) {
    console.error('You must provide exactly one of <project-key> or <project-config>.');
    console.log(program.helpInformation());
    process.exit(1);
  }

  try {
    let cliResponses=[];
    let projectDir=projectKey;
    let preset;
    if(projectKey) {
      cliResponses = config.CLI_RESPONSES[projectKey];
      preset = config.PRESET[projectKey];
    }
    else {
      projectDir = projectConfig["projectDir"]
      let cliResponsesJsonArr = projectConfig["responses"];
      cliResponsesJsonArr.forEach((item) => {
        cliResponses.push({
          expectedPrompt: new RegExp(
              item.expectedPrompt,
              "i"
          ),
          response: item.response
        })
      });
    }

    // Explicitly create outputDir because generator runs into permissions issue when generating no-ext projects.
    await mkdirIfNotExists(config.GENERATED_PROJECTS_DIR);
    const outputDir = `${config.GENERATED_PROJECTS_DIR}/${projectDir}`;
    let generateAppCommand = `${config.GENERATOR_CMD} ${outputDir}`;
    console.log("***********generateAppCommand:"+generateAppCommand);
    // TODO: Update script to setup local verdaccio npm repo to allow running 'npx @salesforce/pwa-kit-create-app' to generate apps
    if (preset) {
      generateAppCommand = `${config.GENERATOR_CMD} ${outputDir} --preset ${preset}`;
    }
    return await runGeneratorWithResponses(generateAppCommand, cliResponses);
  } catch (err) {
    // Generator failed to create project
    console.log("Generator failed to create project", err);
    process.exit(1);
  }
};

program.description(
  `Generate a retail-react-app project using the key <project-key> or the json <project-config>`
);


program.addArgument(
  new Argument("[project-key]", "project key").choices([
    "retail-app-demo",
    "retail-app-ext",
    "retail-app-no-ext",
    "retail-app-private-client",
  ])
).addArgument(
  new Argument("[project-config]", "project config as JSON string").argParser(
      (value) => {
        try {
          return JSON.parse(value);
        } catch (e) {
          throw new Error('Invalid JSON array string');
        }
      })
)
.action((projectKey, projectConfig) => {
  // Call the main function with parsed options
  main({ projectKey, projectConfig });
});

program.parse(process.argv);

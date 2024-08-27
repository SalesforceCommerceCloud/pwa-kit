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
  const { args } = opts;
  const [project] = args;
  if (opts.args.length !== 1) {
    console.log(program.helpInformation());
    process.exit(1);
  }

  try {
    // Explicitly create outputDir because generator runs into permissions issue when generating no-ext projects.
    await mkdirIfNotExists(config.GENERATED_PROJECTS_DIR);
    // TODO: Update script to setup local verdaccio npm repo to allow running 'npx @salesforce/pwa-kit-create-app' to generate apps
    let generateAppCommand;
    let cliResponses = config.CLI_RESPONSES[project];
    if (typeof project === 'string') {
      const outputDir = `${config.GENERATED_PROJECTS_DIR}/${project}`;
      const preset = config.PRESET[project];
      if (preset) {
        generateAppCommand = `${config.GENERATOR_CMD} ${outputDir} --preset ${preset}`
      }
      cliResponses = config.CLI_RESPONSES[project]
    }
    else if (typeof project === 'object' && project !== null) {
      const outputDir = `${config.GENERATED_PROJECTS_DIR}/${project.name}`;
      generateAppCommand = `${config.GENERATOR_CMD} ${outputDir}`;
      cliResponses = project;
    } else {
      throw new Error("Invalid argument to run the project generator")
    }

    return await runGeneratorWithResponses(
        generateAppCommand,
        cliResponses
    );
  } catch (err) {
    // Generator failed to create project
    console.log("Generator failed to create project", err);
    process.exit(1);
  }
};

program.description(
  `Generate a retail-react-app project using the key <project-key>`
);

program.addArgument(
  new Argument("<project-key>", "project key").choices([
    "retail-app-demo",
    "retail-app-ext",
    "retail-app-no-ext",
    "retail-app-private-client",
  ])
);

program.parse(process.argv);

main(program);

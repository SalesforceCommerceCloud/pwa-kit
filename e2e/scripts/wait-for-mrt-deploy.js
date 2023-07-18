/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const fetch = require("node-fetch");
const jsdom = require("jsdom");
const program = require("commander");

const DEFAULT_ORIGIN = process.env.CLOUD_API_BASE || "https://cloud.mobify.com";

const doFetch = async (url, apiKey = null, method = "GET") => {
  let response;
  try {
    response = await fetch(url, {
      method: method,
      headers: {
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
      },
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  if (!response.ok) {
    console.error(
      `${method} ${url}: Request failed with status ${response.status}`
    );
    process.exit(1);
  }
  return apiKey ? response.json() : response.text();
};

const wait = async (version, targetSlug, apiKey, project) => {
  const target = await doFetch(
    `${DEFAULT_ORIGIN}/api/projects/${project}/target/${targetSlug}`,
    apiKey
  );
  const bundleMessage = target.current_deploy.bundle.message;
  if (!bundleMessage.includes(version)) {
    console.error(
      `Bundle for target ${targetSlug}'s current deploy does not match version ${version}.`,
      `Bundle message is '${bundleMessage}'.`
    );
    process.exit(1);
  }

  console.log(`${targetSlug}: ${target.state}`);
  switch (target.state) {
    case "CREATE_IN_PROGRESS":
    case "PUBLISH_IN_PROGRESS":
      return new Promise((resolve) => {
        setTimeout(async () => {
          return resolve(await wait(version, targetSlug, apiKey, project));
        }, 30000);
      });
    case "CREATE_FAILED":
    case "PUBLISH_FAILED":
      console.error("Deploy failed.");
      return process.exit(1);
    default:
      return target;
  }
};

const main = async ({ version, target: targetSlug, apiKey, project }) => {
  console.log(`Waiting for deploy of target ${targetSlug} to finish...`);
  const target = await wait(version, targetSlug, apiKey, project);
  const expectedBundleId = target.current_deploy.bundle.id;
  const expectedDeployId = target.current_deploy.deploy_id;
  const url = `https://${target.ssr_external_hostname}`;

  console.log(`Making GET request to ${url}`);
  const response = await doFetch(url);
  const { document } = new jsdom.JSDOM(response).window;
  const mobifyData = document.getElementById("mobify-data").innerHTML;
  const { bundleId, deployId } = JSON.parse(mobifyData).Progressive.ssrOptions;

  if (expectedBundleId != bundleId || expectedDeployId != deployId) {
    console.error(
      `${url} is not running the expected bundle (${expectedBundleId}) and deploy (${expectedDeployId}).`
    );
    process.exit(1);
  }
  console.log(
    `Version ${version} successfully deployed to target ${targetSlug}!`
  );
};

program
  .description(
    "Waits for a target deploy to finish, then verifies the expected version " +
      "is running. Assumes the bundle being deployed has the version in its message."
  )
  .action(main)
  .option("--version <version>", "Git SHA of the version being deployed")
  .option("--target <slug>", "The target being deployed to")
  .option("--api-key <key>", "Runtime Admin API key")
  .option("--project <key>", "Runtime Admin Project");
program.parse(process.argv);

#!/usr/bin/env node

const { execSync } = require("child_process");
const versions = require("../projects/demo-showcase/src/versions.json");
const { exit } = require("process");

/**
 * Generates a build Command
 * @param {String} version
 * @returns
 */
function buildCommand(version) {
  const wrapped = !version || version.length == 0 ? "" : `/${version}/`;
  const suffixed = !version || version.length == 0 ? "" : `${version}/`;
  return `ng build -c=production --output-path docs${wrapped} --base-href /ngx-mol-viewers/${suffixed} demo-showcase`;
}
/**
 *
 * @param {String} command
 */
function runCommand(command) {
  try {
    console.log(`Running \n${command}`);
    execSync(command);
  } catch (error) {
    console.error(`Error occured while running command: ${command}`);
    console.error(error.toString());
    exit(1);
  }
}

function main() {
  const latest = versions.latest;
  const buildDefaultCommand = buildCommand();
  runCommand(buildDefaultCommand);

  const buildVersionedComand = buildCommand(latest);
  console.log(`Running \n${buildVersionedComand}`);
  runCommand(buildVersionedComand);

}

if (require.main === module) {
  main();
}

#!/usr/bin/env node

// based on https://github.com/vitejs/vite/blob/main/packages/create-vite/index.js (MIT licensed)
// @ts-check
const fs = require("fs");
const path = require("path");
const argv = require("minimist")(process.argv.slice(2), { string: ["_"] });
const prompts = require("prompts");
const { yellow, green, cyan, blue, magenta, lightRed, red } = require("kolorist");

const cwd = process.cwd();

const TEMPLATES = [
  {
    name: "svelte",
    color: lightRed,
  },
];

const TEMPLATE_NAMES = TEMPLATES.map(t => t.name);

const renameFiles = {
  _gitignore: ".gitignore",
};

async function init() {
  let targetDir = argv._[0];
  let template = argv.template || argv.t;

  const defaultProjectName = !targetDir ? "netless-app-project" : targetDir;

  let result = {};

  try {
    result = await prompts(
      [
        {
          type: targetDir ? null : "text",
          name: "projectName",
          message: "Project name:",
          initial: defaultProjectName,
          onState(state) {
            targetDir = state.value.trim() || defaultProjectName;
          },
        },
        {
          type: () => (!fs.existsSync(targetDir) || isEmpty(targetDir) ? null : "confirm"),
          name: "overwrite",
          message: () =>
            (targetDir === "." ? "Current directory" : `Target directory "${targetDir}"`) +
            ` is not empty. Remove existing files and continue?`,
        },
        {
          // @ts-ignore
          type: (_, { overwrite } = {}) => {
            if (overwrite === false) {
              throw new Error(red("✖") + " Operation cancelled");
            }
            return null;
          },
          name: "overwriteChecker",
        },
        {
          type: () => (isValidPackageName(targetDir) ? null : "text"),
          name: "packageName",
          message: "Package name:",
          initial: () => toValidPackageName(targetDir),
          validate: dir => isValidPackageName(dir) || "Invalid package.json name",
        },
        {
          type: template && TEMPLATE_NAMES.includes(template) ? null : "select",
          name: "framework",
          message:
            typeof template === "string" && !TEMPLATE_NAMES.includes(template)
              ? `"${template}" isn't a valid template. Please choose from below: `
              : "Select a framework:",
          initial: 0,
          choices: TEMPLATES.map(tpl => {
            const color = tpl.color;
            return {
              title: color(tpl.name),
              value: tpl,
            };
          }),
        },
      ],
      {
        onCancel: () => {
          throw new Error(red("✖") + " Operation cancelled");
        },
      }
    );
  } catch (cancelled) {
    console.log(cancelled.message);
    return;
  }

  // user choice associated with prompts
  const { framework, overwrite, packageName } = result;

  const root = path.join(cwd, targetDir);

  if (overwrite) {
    emptyDir(root);
  }
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root);
  }

  // determine template
  template = framework.name || template;

  console.log(`\nScaffolding project in ${root}...`);

  const templateDir = path.join(__dirname, `template-${template}`);

  const write = (file, content) => {
    const targetPath = renameFiles[file]
      ? path.join(root, renameFiles[file])
      : path.join(root, file);
    if (content) {
      fs.writeFileSync(targetPath, content);
    } else {
      copy(path.join(templateDir, file), targetPath);
    }
  };

  const files = fs.readdirSync(templateDir);
  for (const file of files.filter(f => f !== "package.json")) {
    write(file);
  }

  const pkg = require(path.join(templateDir, `package.json`));

  pkg.name = packageName || targetDir;

  write("package.json", JSON.stringify(pkg, null, 2));

  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
  const pkgManager = pkgInfo ? pkgInfo.name : "npm";

  console.log(`\nDone. Now run:\n`);
  if (root !== cwd) {
    console.log(`  cd ${path.relative(cwd, root)}`);
  }
  switch (pkgManager) {
    case "yarn":
      console.log("  yarn");
      console.log("  yarn build");
      break;
    default:
      console.log(`  ${pkgManager} install`);
      console.log(`  ${pkgManager} run build`);
      break;
  }
  console.log();
}

function copy(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyDir(src, dest);
  } else {
    fs.copyFileSync(src, dest);
  }
}

function isValidPackageName(projectName) {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(projectName);
}

function toValidPackageName(projectName) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/^[._]/, "")
    .replace(/[^a-z0-9-~]+/g, "-");
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file);
    const destFile = path.resolve(destDir, file);
    copy(srcFile, destFile);
  }
}

function isEmpty(path) {
  return fs.readdirSync(path).length === 0;
}

function emptyDir(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }
  fs.rmSync(dir, { recursive: true, force: true });
}

/**
 * @param {string | undefined} userAgent process.env.npm_config_user_agent
 * @returns object | undefined
 */
function pkgFromUserAgent(userAgent) {
  if (!userAgent) return undefined;
  const pkgSpec = userAgent.split(" ")[0];
  const pkgSpecArr = pkgSpec.split("/");
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  };
}

init().catch(e => {
  console.error(e);
});

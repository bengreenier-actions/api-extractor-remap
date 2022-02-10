const core = require("@actions/core");
const globber = require("@actions/glob");
const fs = require("fs");
const path = require("path");

/**
 * String.prototype.replaceAll() polyfill
 * https://gomakethings.com/how-to-replace-a-section-of-a-string-with-another-one-with-vanilla-js/
 * @author Chris Ferdinandi
 * @license MIT
 */
if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function (str, newStr) {
    // If a regex pattern
    if (
      Object.prototype.toString.call(str).toLowerCase() === "[object regexp]"
    ) {
      return this.replace(str, newStr);
    }

    // If a string
    return this.replace(new RegExp(str, "g"), newStr);
  };
}

class InputMissingError extends Error {
  constructor(inputName) {
    super(`❌ Missing required input: ${inputName}`);
  }
}

async function run() {
  try {
    const pth = core.getInput("path");
    const libName = core.getInput("libName");
    const indexLink = core.getInput("indexLink");
    const homeLink = core.getInput("homeLink");

    if (!pth) {
      throw new InputMissingError("path");
    }
    if (!libName) {
      throw new InputMissingError("libName");
    }
    if (!indexLink) {
      throw new InputMissingError("indexLink");
    }
    if (!homeLink) {
      throw new InputMissingError("homeLink");
    }

    console.log(
      `📃 Using path: '${pth}', libName: '${libName}', indexLink: '${indexLink}', homeLink: '${homeLink}'.`
    );

    const glob = await globber.create(pth);
    const files = await glob.glob();
    const convert = (str) => {
      if (typeof str !== "string") {
        throw new Error(`Expected '${str}' to be a string`);
      }

      // replace index.md
      if (str === "./index.md") {
        str = homeLink;
        return str;
      }

      // replace all libNames
      str = str.replaceAll(libName, indexLink);

      // strip md extensions
      if (str.endsWith(".md")) {
        str = str.substring(0, str.length - 3);
      }

      // replace all dots
      str = str.replaceAll(".", "-");

      // fix ./ paths
      if (str.startsWith("-/")) {
        str = str.replace("-/", "./");
      }

      return str;
    };

    console.log(files);

    files.forEach((file) => {
      let contents = fs.readFileSync(file, "utf-8");
      const replacements = [];

      const mdLinkRe = /\[(?<title>.+?)\]\((?<link>.+?)\)/g;
      let match = null;
      while ((match = mdLinkRe.exec(contents)) !== null) {
        const len = match[0].length;
        const title = match.groups["title"];
        const link = convert(match.groups["link"]);

        replacements.push({
          start: match.index,
          end: match.index + len,
          title,
          link,
        });
      }

      for (let i = 0; i < replacements.length; i++) {
        const re = replacements[i];
        const beforeSize = contents.length;
        contents = `${contents.substring(0, re.start)}[${re.title}](${
          re.link
        })${contents.substring(re.end)}`;
        const afterSize = contents.length;

        for (let j = 0; j < replacements.length; j++) {
          replacements[j].start += afterSize - beforeSize;
          replacements[j].end += afterSize - beforeSize;
        }
      }

      const outFile =
        path.resolve(path.dirname(file), convert(path.basename(file))) +
        path.extname(file);

      console.log(`📃 Writing to file '${outFile}'.`);

      fs.writeFileSync(outFile, contents, { encoding: "utf-8" });

      if (file !== outFile) {
        fs.rmSync(file);
      }

      console.log("✅ Complete");
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

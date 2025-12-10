const fs = require("fs");
const path = require("path");

const coverageHtmlPath = path.join(__dirname, "../coverage/index.html");
const packageName = "@bongsik/infinite-scroll";

if (fs.existsSync(coverageHtmlPath)) {
  let html = fs.readFileSync(coverageHtmlPath, "utf8");

  // 제목 변경
  html = html.replace(
    /<title>Code coverage report for All files<\/title>/,
    `<title>Code coverage report for ${packageName}</title>`
  );

  // h1 태그 변경
  html = html.replace(/<h1>All files<\/h1>/, `<h1>${packageName}</h1>`);

  fs.writeFileSync(coverageHtmlPath, html, "utf8");
  console.log(`✅ Coverage report title updated: ${packageName}`);
}

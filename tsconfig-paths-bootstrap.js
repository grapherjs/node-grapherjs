const tsConfig = require("./tsconfig.json");
const tsConfigPaths = require("tsconfig-paths");

let { baseUrl, paths } = tsConfig.compilerOptions;
// console.log(tsConfig.compilerOptions);
for (path in paths) {
  paths[path][0] = paths[path][0].replace("src", "dist").replace(".ts", ".js");
}
// console.log(paths);
tsConfigPaths.register({
  baseUrl,
  paths,
});

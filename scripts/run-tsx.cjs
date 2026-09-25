const { spawnSync } = require("node:child_process");
const { resolve } = require("node:path");

const cli = resolve(__dirname, "../node_modules/tsx/dist/cli.mjs");
const inherited = process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ` : "";
const result = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env: { ...process.env, NODE_OPTIONS: `${inherited}--require=./scripts/os-userinfo-shim.cjs` },
  stdio: "inherit",
});
process.exit(result.status ?? 1);

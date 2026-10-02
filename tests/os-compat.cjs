// Node 24.15 on this Windows runner can throw from os.userInfo(); tsx uses it only to name its temp cache.
const os = require("node:os");
try {
  os.userInfo();
} catch {
  os.userInfo = () => ({ username: process.env.USERNAME || "ut-test", uid: -1, gid: -1, shell: null, homedir: process.env.USERPROFILE || process.cwd() });
  require("node:module").syncBuiltinESMExports();
}


// Some locked-down Windows runners return ENOMEM from uv_os_get_passwd.
// tsx only needs a stable username for its temporary-directory name.
const os = require("node:os");
const originalUserInfo = os.userInfo;
os.userInfo = (...args) => {
  try {
    return originalUserInfo(...args);
  } catch {
    return { uid: -1, gid: -1, username: "atf-build", homedir: process.cwd(), shell: null };
  }
};

import fs from "fs-extra";
import archiver from "archiver";
import path from "path";

if (!fs.pathExistsSync("build")) {
  console.error("`build` directory does not exist. Run `yarn build` first.");
  process.exit(1);
}

if (fs.pathExistsSync("dist")) {
  console.log("Cleaning `dist`");
  fs.rmSync("dist", { recursive: true, force: true });
}
fs.ensureDirSync("dist");

console.log("Creating archive `dist/ext.zip`");
const out = fs.createWriteStream("dist/ext.zip");
const archive = archiver("zip");
archive.on("error", (e) => (console.error(e), process.exit(1)));
archive.pipe(out);
archive.glob("**/*", { cwd: path.join(process.cwd(), "build") });
archive.finalize();

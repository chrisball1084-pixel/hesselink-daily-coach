import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const distRoot = new URL("dist/", projectRoot);
const basePath = "/hesselink-daily-coach/";

test("Production-Build enthält die vollständige GitHub-Pages-App", async () => {
  const [html, manifestText, serviceWorker] = await Promise.all([
    readFile(new URL("index.html", distRoot), "utf8"),
    readFile(new URL("manifest.webmanifest", distRoot), "utf8"),
    readFile(new URL("sw.js", distRoot), "utf8"),
    access(new URL("icons/icon-192.png", distRoot)),
    access(new URL("icons/icon-512.png", distRoot)),
  ]);
  const manifest = JSON.parse(manifestText);

  assert.equal(manifest.id, basePath);
  assert.equal(manifest.start_url, basePath);
  assert.equal(manifest.scope, basePath);
  assert.match(html, /\/hesselink-daily-coach\/assets\/[^"]+\.js/);
  assert.match(html, /\/hesselink-daily-coach\/assets\/[^"]+\.css/);
  assert.match(html, /\/hesselink-daily-coach\/manifest\.webmanifest/);
  assert.match(serviceWorker, /self\.registration\.scope/);
});

test("Production-Build enthält keine privaten Arbeits- oder Backup-Dateien", async () => {
  const forbiddenFiles = [
    "Hesselink_Daily_Checklist_v1.pdf",
    "Hesselink_Daily_Checklist_v1_0_Druckversion_KORRIGIERT.pdf",
    ".env",
    "backup.json",
  ];

  await Promise.all(
    forbiddenFiles.map(async (file) => {
      await assert.rejects(access(new URL(file, distRoot)));
    }),
  );
});

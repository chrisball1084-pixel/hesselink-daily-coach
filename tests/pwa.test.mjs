import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

test("Manifest und HTML verwenden ausschließlich unterpfadtaugliche App-Pfade", async () => {
  const [html, manifestText] = await Promise.all([
    readFile(new URL("index.html", projectRoot), "utf8"),
    readFile(new URL("public/manifest.webmanifest", projectRoot), "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);
  const resourcePaths = [
    ...html.matchAll(/(?:href|src)="([^"]+)"/g),
  ].map((match) => match[1]);

  assert.equal(manifest.id, "/hesselink-daily-coach/");
  assert.equal(manifest.start_url, "/hesselink-daily-coach/");
  assert.equal(manifest.scope, "/hesselink-daily-coach/");
  assert.ok(
    manifest.icons.every((icon) =>
      icon.src.startsWith("/hesselink-daily-coach/icons/"),
    ),
  );
  assert.ok(
    resourcePaths.every(
      (path) =>
        path.startsWith("./") ||
        path.startsWith("#") ||
        path.startsWith("%BASE_URL%"),
    ),
  );
  const dialogCloseButtons = [
    ...html.matchAll(/<button[^>]*data-close-dialog[^>]*>/g),
  ].map((match) => match[0]);
  assert.ok(dialogCloseButtons.length >= 6);
  assert.ok(
    dialogCloseButtons.every((button) => /type="button"/.test(button)),
  );
});

test("Service Worker cached die vollständige App-Shell mit relativen Pfaden", async () => {
  const source = await readFile(new URL("public/sw.js", projectRoot), "utf8");
  const shellMatch = source.match(/const STATIC_SHELL = (\[[\s\S]*?\]);/);
  assert.ok(shellMatch, "STATIC_SHELL fehlt");
  const shell = JSON.parse(shellMatch[1]);
  assert.ok(shell.every((path) => path.startsWith("./")));
  assert.ok(shell.includes("./index.html"));
  assert.ok(shell.includes("./icons/icon-512.png"));
  assert.match(source, /self\.registration\.scope/);
  assert.match(source, /discoveredAssets/);
  assert.match(source, /event\.request\.mode === "navigate"/);
});

test("Produktionsdateien enthalten keine externen HTTP-Ressourcen", async () => {
  const files = [
    "index.html",
    "styles.css",
    "public/sw.js",
    "public/manifest.webmanifest",
    "js/app.mjs",
    "js/core.mjs",
    "js/storage.mjs",
  ];
  const contents = await Promise.all(
    files.map((file) => readFile(new URL(file, projectRoot), "utf8")),
  );
  assert.ok(contents.every((content) => !/https?:\/\//i.test(content)));
});

test("Release-Version ist in Datenmodell und Oberfläche konsistent", async () => {
  const [core, app] = await Promise.all([
    readFile(new URL("js/core.mjs", projectRoot), "utf8"),
    readFile(new URL("js/app.mjs", projectRoot), "utf8"),
  ]);

  assert.match(core, /APP_VERSION = "1\.0\.0-beta\.2"/);
  assert.match(app, /Version 1\.0 Beta/);
  assert.match(app, /v1\.0\.0-beta\.2/);
});

test("Trainingskarte bleibt kompakt und Rückkehr setzt den aktuellen Tag", async () => {
  const app = await readFile(new URL("js/app.mjs", projectRoot), "utf8");
  assert.match(app, /<details\s+class="workout-card/);
  assert.match(app, /von \$\{training\.planned\} geplanten Krafttrainings/);
  assert.match(app, /window\.addEventListener\("pageshow", returnToCurrentDay\)/);
  assert.match(app, /document\.addEventListener\("visibilitychange"/);
  assert.match(app, /Workout \$\{WORKOUTS\[completedSession\.workout\]\.label\} abgeschlossen/);
  assert.match(app, /expandedWorkoutDate = button\.dataset\.workoutDate/);
  assert.match(app, /\$\{expandedWorkoutDate === dateKey \? "open" : ""\}/);
  assert.doesNotMatch(app, /Heute zählt der erste Haken/);
});

test("App-Icons besitzen die deklarierten PNG-Abmessungen", async () => {
  for (const size of [192, 512]) {
    const icon = await readFile(
      new URL(`public/icons/icon-${size}.png`, projectRoot),
    );
    assert.equal(icon.toString("ascii", 1, 4), "PNG");
    assert.equal(icon.readUInt32BE(16), size);
    assert.equal(icon.readUInt32BE(20), size);
  }
});

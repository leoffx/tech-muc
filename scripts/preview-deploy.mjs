#!/usr/bin/env node

import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT_DIR = process.cwd();
const CONFIG_PATH = path.join(ROOT_DIR, "preview.config.json");
const MANIFEST_BASENAME = "manifest.json";

const ARG_KEY_MAP = new Map([
  ["project", "project"],
  ["ticket", "ticket"],
  ["bucket", "bucket"],
  ["region", "region"],
  ["build-command", "buildCommand"],
  ["dist-dir", "distDir"],
  ["skip-build", "skipBuild"],
  ["force", "force"],
  ["website-base-url", "websiteBaseUrl"],
  ["no-manifest", "noManifest"],
  ["no-latest", "noLatest"]
]);

function logHeader(message) {
  console.log(`\n=== ${message} ===`);
}

function parseArgs(argv) {
  const result = {};

  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    if (!raw.startsWith("--")) {
      continue;
    }

    const key = raw.slice(2);
    const mappedKey = ARG_KEY_MAP.get(key);
    if (!mappedKey) {
      console.warn(`Ignoring unknown flag "${raw}"`);
      continue;
    }

    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      result[mappedKey] = true;
      continue;
    }

    result[mappedKey] = next;
    i += 1;
  }

  return result;
}

function readConfig() {
  if (!existsSync(CONFIG_PATH)) {
    return {};
  }

  try {
    const raw = readFileSync(CONFIG_PATH, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to read preview config at ${CONFIG_PATH}: ${error}`);
  }
}

function ensureToolInstalled(tool, versionArgs = ["--version"]) {
  const resp = spawnSync(tool, versionArgs, {
    stdio: "ignore"
  });

  if (resp.status !== 0) {
    throw new Error(
      `Required tool "${tool}" is not available. Please install it before running the preview deploy script.`
    );
  }
}

function runGit(command) {
  return execSync(`git ${command}`, {
    cwd: ROOT_DIR,
    encoding: "utf8"
  }).trim();
}

function ensureCleanWorkingTree() {
  const status = execSync("git status --porcelain", {
    cwd: ROOT_DIR,
    encoding: "utf8"
  }).trim();

  if (status.length > 0) {
    throw new Error(
      "Working tree has uncommitted changes. Commit or stash them, or re-run with --force to bypass this check."
    );
  }
}

function runBuild(command) {
  logHeader(`Running build: ${command}`);
  execSync(command, {
    cwd: ROOT_DIR,
    stdio: "inherit",
    shell: true
  });
}

function syncDirectoryToS3(localDir, bucket, keyPrefix, region) {
  const destination = `s3://${bucket}/${keyPrefix.replace(/\/+$/, "")}/`;
  const syncArgs = ["s3", "sync", localDir, destination, "--region", region, "--delete"];
  const result = spawnSync("aws", syncArgs, {
    cwd: ROOT_DIR,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    throw new Error(`aws s3 sync failed for ${destination}`);
  }
}

function uploadManifest(manifest, bucket, projectId, ticketId, region) {
  const manifestPath = path.join(os.tmpdir(), `preview-manifest-${manifest.commit}.json`);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const remotePath = `s3://${bucket}/${projectId}/${ticketId}/${MANIFEST_BASENAME}`;
  const result = spawnSync("aws", ["s3", "cp", manifestPath, remotePath, "--region", region], {
    stdio: "inherit"
  });

  if (result.status !== 0) {
    throw new Error(`Failed to upload manifest to ${remotePath}`);
  }
}

function run() {
  const args = parseArgs(process.argv.slice(2));
  const config = readConfig();

  const bucket = args.bucket ?? config.bucket;
  const region = args.region ?? config.region;
  const projectId = args.project ?? config.defaultProject;
  const ticketId = args.ticket;
  const websiteBaseUrl =
    args.websiteBaseUrl ?? config.websiteBaseUrl ?? `http://${bucket}.s3-website-${region}.amazonaws.com`;
  const buildCommand = args.buildCommand ?? config.buildCommand ?? "npm run build";
  const distDirRelative = args.distDir ?? config.distDir ?? "out";
  const distDir = path.resolve(ROOT_DIR, distDirRelative);
  const skipBuild = Boolean(args.skipBuild);
  const requireClean = !args.force && (config.requireCleanWorkingTree ?? true);
  const promoteLatest = args.noLatest ? false : config.promoteLatest ?? true;
  const writeManifest = args.noManifest ? false : config.writeManifest ?? true;

  if (!bucket) {
    throw new Error("Missing S3 bucket. Provide --bucket or set bucket in preview.config.json.");
  }

  if (!region) {
    throw new Error("Missing AWS region. Provide --region or set region in preview.config.json.");
  }

  if (!projectId) {
    throw new Error("Missing project id. Provide --project or set defaultProject in preview.config.json.");
  }

  if (!ticketId) {
    throw new Error("Missing ticket id. Provide --ticket TICKET-123.");
  }

  ensureToolInstalled("aws");

  if (requireClean) {
    ensureCleanWorkingTree();
  }

  const branch = runGit("rev-parse --abbrev-ref HEAD") || "detached";
  const commit = runGit("rev-parse HEAD");
  const shortCommit = runGit("rev-parse --short HEAD");

  if (!skipBuild) {
    runBuild(buildCommand);
  } else {
    logHeader("Skipping build step (--skip-build provided)");
  }

  if (!existsSync(distDir)) {
    throw new Error(`Build output directory "${distDirRelative}" not found after build.`);
  }

  logHeader("Uploading commit build");
  const commitPrefix = `${projectId}/${ticketId}/${commit}`;
  syncDirectoryToS3(distDir, bucket, commitPrefix, region);

  let latestUrl;
  if (promoteLatest) {
    logHeader("Updating latest alias");
    const latestPrefix = `${projectId}/${ticketId}/latest`;
    syncDirectoryToS3(distDir, bucket, latestPrefix, region);
    latestUrl = `${websiteBaseUrl.replace(/\/+$/, "")}/${projectId}/${ticketId}/latest/`;
  }

  const commitUrl = `${websiteBaseUrl.replace(/\/+$/, "")}/${commitPrefix}/`;

  if (writeManifest) {
    logHeader("Uploading manifest");
    const manifest = {
      version: 1,
      project: projectId,
      ticket: ticketId,
      branch,
      commit,
      shortCommit,
      bucket,
      region,
      distDir: distDirRelative,
      uploadedAt: new Date().toISOString(),
      urls: {
        commit: commitUrl,
        latest: latestUrl ?? null
      }
    };

    uploadManifest(manifest, bucket, projectId, ticketId, region);
  }

  logHeader("Preview ready");
  console.log(`Branch:       ${branch}`);
  console.log(`Commit:       ${commit} (${shortCommit})`);
  console.log(`Ticket:       ${ticketId}`);
  console.log(`Project:      ${projectId}`);
  console.log(`Bucket:       ${bucket}`);
  console.log(`Region:       ${region}`);
  console.log(`Commit URL:   ${commitUrl}`);
  if (latestUrl) {
    console.log(`Latest URL:   ${latestUrl}`);
  }
  if (writeManifest) {
    const manifestUrl = `${websiteBaseUrl.replace(/\/+$/, "")}/${projectId}/${ticketId}/${MANIFEST_BASENAME}`;
    console.log(`Manifest URL: ${manifestUrl}`);
  }
  console.log("");
  console.log("Embed the commit URL in your PR description. ✅");
}

try {
  run();
} catch (error) {
  console.error("");
  console.error("Preview deployment failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

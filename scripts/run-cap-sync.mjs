import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const projectRoot = process.cwd();
const isWindows = os.platform() === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';
const npxCommand = isWindows ? 'npx.cmd' : 'npx';
const proxyRoutePath = path.join(
  projectRoot,
  'src',
  'app',
  'api',
  'proxy',
  '[...path]',
  'route.ts',
);
const proxyRouteBackupPath = `${proxyRoutePath}.native-sync-disabled`;

function removeDirectory(relativePath) {
  const targetPath = path.join(projectRoot, relativePath);

  if (!fs.existsSync(targetPath)) {
    return;
  }

  fs.rmSync(targetPath, { recursive: true, force: true });
}

function runCommand(command, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env,
      stdio: 'inherit',
      shell: isWindows,
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`${command} exited with signal ${signal}`));
        return;
      }

      resolve(code ?? 1);
    });
  });
}

function disableProxyRouteForNativeExport() {
  if (fs.existsSync(proxyRouteBackupPath) && !fs.existsSync(proxyRoutePath)) {
    fs.renameSync(proxyRouteBackupPath, proxyRoutePath);
  }

  if (!fs.existsSync(proxyRoutePath)) {
    return false;
  }

  fs.renameSync(proxyRoutePath, proxyRouteBackupPath);
  return true;
}

function restoreProxyRoute() {
  if (!fs.existsSync(proxyRouteBackupPath)) {
    return;
  }

  fs.renameSync(proxyRouteBackupPath, proxyRoutePath);
}

const proxyRouteDisabled = disableProxyRouteForNativeExport();
let exitCode = 1;

try {
  removeDirectory('.next');
  removeDirectory('out');
  removeDirectory(path.join('android', 'app', 'src', 'main', 'assets', 'public'));

  const buildExitCode = await runCommand(npmCommand, ['run', 'build'], {
    ...process.env,
    CAPACITOR_EXPORT: 'true',
  });

  if (buildExitCode !== 0) {
    exitCode = buildExitCode;
  } else {
    exitCode = await runCommand(npxCommand, ['cap', 'sync']);
  }
} finally {
  if (proxyRouteDisabled) {
    restoreProxyRoute();
  }
}

process.exit(exitCode);

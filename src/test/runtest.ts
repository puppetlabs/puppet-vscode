import * as cp from 'child_process';
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';

import { downloadAndUnzipVSCode, runTests } from '@vscode/test-electron';

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    const vscodeExecutablePath = process.platform === 'darwin'
      ? await downloadVSCodeMacOS()
      : await downloadVSCodeOther();

    await runTests({ extensionDevelopmentPath, extensionTestsPath, vscodeExecutablePath });
  } catch (err) {
    console.error('Failed to run tests', err);
    process.exit(1);
  }
}

/**
 * On macOS, @vscode/test-electron uses system `unzip` which does not preserve
 * the symlinks inside the app bundle needed for code signing. This causes
 * macOS to reject the app with SIGKILL ("app is damaged"). Instead, download
 * with curl and extract with `ditto -xk`, Apple's recommended tool for macOS
 * app bundles in zip format.
 */
async function downloadVSCodeMacOS(): Promise<string> {
  const arch = process.arch === 'arm64' ? 'darwin-arm64' : 'darwin';
  const cacheDir = path.resolve(__dirname, '../../.vscode-test');
  const version = await fetchLatestStableVersion();
  const installDir = path.resolve(cacheDir, `vscode-${arch}-${version}`);
  const executable = path.resolve(installDir, 'Visual Studio Code.app/Contents/MacOS/Code');
  const completeMarker = path.resolve(installDir, 'is-complete');

  if (fs.existsSync(completeMarker) && fs.existsSync(executable)) {
    console.log(`Found existing install in ${installDir}. Skipping download`);
    return executable;
  }

  if (fs.existsSync(installDir)) {
    cp.execSync(`rm -rf "${installDir}"`);
  }
  fs.mkdirSync(installDir, { recursive: true });

  const downloadUrl = `https://update.code.visualstudio.com/${version}/${arch}/stable`;
  const zipPath = path.resolve(installDir, 'vscode.zip');

  console.log(`Downloading VS Code ${version} from ${downloadUrl}`);
  cp.execSync(`curl -L --progress-bar -o "${zipPath}" "${downloadUrl}"`, { stdio: 'inherit' });

  console.log(`Extracting...`);
  cp.execSync(`ditto -xk "${zipPath}" "${installDir}"`, { stdio: 'inherit' });
  fs.unlinkSync(zipPath);

  fs.writeFileSync(completeMarker, '');
  console.log(`Downloaded VS Code into ${installDir}`);

  return executable;
}

async function fetchLatestStableVersion(): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get('https://update.code.visualstudio.com/api/releases/stable', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)[0]); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function downloadVSCodeOther(): Promise<string> {
  // On Linux/Windows use the standard mechanism
  const vscodeExecutablePath = await downloadAndUnzipVSCode();

  // Newer VS Code ships the binary as 'Code' not 'Electron'.
  // Create a symlink so @vscode/test-electron 2.x can find it.
  if (!fs.existsSync(vscodeExecutablePath)) {
    const codePath = vscodeExecutablePath.replace(/\/Electron$/, '/Code');
    if (fs.existsSync(codePath)) {
      fs.symlinkSync('Code', vscodeExecutablePath);
    }
  }

  return vscodeExecutablePath;
}

main();

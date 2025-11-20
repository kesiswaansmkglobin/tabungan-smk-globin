import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJsonPath = join(__dirname, '../package.json');

function execCommand(command) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch (error) {
    console.error(`Error executing: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

function getCurrentVersion() {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.version;
}

function incrementVersion(version, type = 'patch') {
  const [major, minor, patch] = version.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

function updatePackageVersion(newVersion) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  packageJson.version = newVersion;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}

function main() {
  const args = process.argv.slice(2);
  const versionType = args[0] || 'patch'; // patch, minor, major
  
  if (!['patch', 'minor', 'major'].includes(versionType)) {
    console.error('Usage: node scripts/release.js [patch|minor|major]');
    console.error('Default: patch');
    process.exit(1);
  }

  // Check for uncommitted changes
  const status = execCommand('git status --porcelain');
  if (status) {
    console.error('❌ You have uncommitted changes. Please commit or stash them first.');
    process.exit(1);
  }

  // Get current version
  const currentVersion = getCurrentVersion();
  const newVersion = incrementVersion(currentVersion, versionType);

  console.log(`📦 Current version: ${currentVersion}`);
  console.log(`🚀 New version: ${newVersion}`);

  // Update package.json
  updatePackageVersion(newVersion);
  console.log('✅ Updated package.json');

  // Commit version change
  execCommand('git add package.json');
  execCommand(`git commit -m "chore: bump version to ${newVersion}"`);
  console.log('✅ Committed version change');

  // Create tag
  execCommand(`git tag -a v${newVersion} -m "Release v${newVersion}"`);
  console.log(`✅ Created tag v${newVersion}`);

  // Push changes and tags
  console.log('\n📤 Pushing to GitHub...');
  execCommand('git push');
  execCommand('git push --tags');
  console.log('✅ Pushed to GitHub');

  console.log(`\n🎉 Release v${newVersion} initiated!`);
  console.log(`📊 Check GitHub Actions: https://github.com/kesiswaansmkglobin/tabungan-smk-globin/actions`);
}

main();

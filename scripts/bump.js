const fs = require('fs');
const path = require('path');

const version = process.argv.slice(2)[0];

if (!version) {
    console.error('Usage: node bump.js <versionType>');
    process.exit(1);
}

if (!['major', 'minor', 'patch'].includes(version)) {
    console.error('Invalid version type. Use one of: major, minor, patch. Got:', version);
    process.exit(1);
}

// Helper function to read JSON file
const readJsonFile = (filePath) => {
    const rawData = fs.readFileSync(filePath);
    return JSON.parse(rawData);
};

// Helper function to write JSON file
const writeJsonFile = (filePath, data) => {
    const jsonContent = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonContent);
};

// Helper function to bump version
const bumpVersion = (filePath, versionType = 'patch') => {
    const fileContent = readJsonFile(filePath);
    const currentVersion = fileContent.version;

    if (!/^\d+\.\d+\.\d+$/.test(currentVersion)) {
        throw new Error(`Invalid version in ${filePath}: ${currentVersion}`);
    }

    let [major, minor, patch] = currentVersion.split('.').map(Number);

    switch (versionType) {
        case 'major':
            major += 1;
            minor = 0;
            patch = 0;
            break;
        case 'minor':
            minor += 1;
            patch = 0;
            break;
        case 'patch':
            patch += 1;
            break;
        default:
            throw new Error(`Invalid version type: ${versionType}`);
    }

    const newVersion = `${major}.${minor}.${patch}`;
    fileContent.version = newVersion;

    writeJsonFile(filePath, fileContent);
    console.log(`Bumped version in ${filePath} from ${currentVersion} to ${newVersion}`);
};

// Bump version in package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
bumpVersion(packageJsonPath);

// Bump version in manifest.json (located in the static folder)
const manifestJsonPath = path.join(__dirname, '..', 'static', 'manifest.json');
bumpVersion(manifestJsonPath);

console.log('Version bump complete.');

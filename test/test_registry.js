import { test } from 'node:test';
import assert from 'node:assert';
import Registry from "../src/base/registry/RegistryClass.js"; 
import Dependency from "../src/base/dependencies/DependencyClass.js";

const metadataCache = new Dependency(); 
const registry = new Registry(metadataCache); 

export const testgetPackageMetadata = async (pkgName) => {
    const metadata = await registry.getPackageMetadata(pkgName);
    return JSON.parse(JSON.stringify(metadata, null, 2));
};

export const testGetPackageVersion = async (pkgName, version) => {
    const data = await registry.getPackageVersion(pkgName, version);
    return JSON.parse(JSON.stringify(data, null, 2));
};

export const testResolveVersion = async (pkgName, range) => {
    const version = await registry.resolveVersion(pkgName, range);
    return JSON.parse(JSON.stringify(version, null, 2));
};

export const testGetVersions = async (pkgName) => {
    const versions = await registry.getVersions(pkgName);
    return JSON.parse(JSON.stringify(versions, null, 2));
};

test('Registry Class Test Suite', async (t) => {
    const pkg = "axios";

    await t.test('1. getPackageMetadata', async () => {
        const metadata = await testgetPackageMetadata(pkg);
        assert.ok(metadata, "Metadata should be returned");
        assert.strictEqual(metadata.name, pkg, `Package name should be ${pkg}`);
    });

    await t.test('2. getPackageVersion', async () => {
        const packageVersion = await testGetPackageVersion(pkg, "1.20.0");
        assert.ok(packageVersion, "Package version data should be returned");
        assert.strictEqual(packageVersion.version, "1.20.0", "Version should match 1.20.0");
    });

    await t.test('3. resolveVersion', async () => {
        const resolvedVersion = await testResolveVersion(pkg, "^1.0.0");
        assert.ok(resolvedVersion, "Resolved version should exist");
        assert.strictEqual(resolvedVersion, "1.20.0", "Resolved version should be 1.20.0");
    });

    await t.test('4. getVersions', async () => {
        const versions = await testGetVersions(pkg);
        assert.ok(Array.isArray(versions), "Versions should be an array");
        assert.ok(versions.length > 0, "Versions list should not be empty");
    });
});

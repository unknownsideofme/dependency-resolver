import getPackageMetadata from "./methods/getPackageMetadata.js";
import resolveVersion from "./methods/resolveVersion.js";
import getPackageVersion from "./methods/getPackageVersion.js";
import getVersions from "./methods/getVersions.js";

export default class Registry {
    static #REGISTRY_URL = "https://registry.npmjs.org";
    static #metadataCache = null;

    constructor(metadataCache) {
        if (Registry.#metadataCache === null) {
            Registry.#metadataCache = metadataCache;
        }
    }

    getMetadataCache() {
        return Registry.#metadataCache;
    }

    setMetadataCache(metadataCache) {
        Registry.#metadataCache = metadataCache;
    }

    getREGISTRY_URL() {
        return Registry.#REGISTRY_URL;
    }
}

Registry.prototype.getPackageMetadata = getPackageMetadata;
Registry.prototype.resolveVersion = resolveVersion;
Registry.prototype.getPackageVersion = getPackageVersion;
Registry.prototype.getVersions = getVersions;
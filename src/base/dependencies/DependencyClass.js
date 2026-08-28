export default class Dependency {
    //singleton Dependency Cache
    static metadataCache = null;
    constructor() {
        if (Dependency.metadataCache === null) {
            Dependency.metadataCache = new Map();
        }
        return Dependency.metadataCache;
    }
}
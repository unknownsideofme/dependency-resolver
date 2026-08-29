import Conflict from "../conflicts/ConflictClass.js"; 
import Registry from "../registry/RegistryClass.js";
import Dependency from "../dependencies/DependencyClass.js";
import generateCandidates from "./methods/generateCandidate.js";

export default class Candidates {
    constructor(registry) {
        this.conflicts = new Conflict(); 
        this.registry = registry || new Registry(new Dependency());
    }

    getConflicts() {
        if (this.conflicts === null) {
            throw new Error("Conflict not initialized");
        }
        return this.conflicts;
    }
}

Candidates.prototype.generateCandidates = generateCandidates;
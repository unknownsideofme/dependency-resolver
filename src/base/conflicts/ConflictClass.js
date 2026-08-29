export default class Conflict {
    static conflicts = null;

    constructor() {
        if (Conflict.conflicts === null) {
            Conflict.conflicts = new Set();
        }
        return Conflict.conflicts;
    }

    
}
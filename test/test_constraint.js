import { addConstraint, getConstraints, getConflicts } from '../src/constraint.js'

export const testAddConstraint = ( dependencyMap) => {
    for (const [ dependencyName, dependencyRange] of Object.entries(dependencyMap)) {
        addConstraint( dependencyName, dependencyRange, "app");
    }   
    try {
        console.log("Constraint added successfully!");
    }
    catch (error) {
        console.log(error);
    }
}

export const testGetConstraints = () => {
    try {
        const constraints = getConstraints();
        return constraints;
    }
    catch (error) {
        console.log(error);
    }
}

export const testGetConflicts = () => {
    try {
        const conflicts = getConflicts();
        return conflicts;
    }
    catch (error) {
        console.log(error);
    }
}
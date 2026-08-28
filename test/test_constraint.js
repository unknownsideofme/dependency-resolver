import {addConstraint} from '../src/constraint.js'

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
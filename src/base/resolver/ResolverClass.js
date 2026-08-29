import Registry from "../registry/RegistryClass.js";
import Candidates from "../candidate/CandidateClass.js";
import Constraint from "../constraints/ConstraintClass.js";
import Conflict from "../conflicts/ConflictClass.js";

import resolve from "./methods/resolve.js";
import buildInitialState from "./methods/buildInitialState.js";
import getValidVersions from "./methods/getValidVersions.js";
import selectPackage from "./methods/selectPackage.js";
import addConstraint from "./methods/addConstraint.js";
import checkConflict from "./methods/checkConflict.js";
import getFirstConflict from "./methods/getFirstConflict.js";
import search from "./methods/search.js";
import createSnapshot from "./methods/createSnapshot.js";
import restoreSnapshot from "./methods/restoreSnapshot.js";

export default class Resolver {
  static #rootDependencies = null;
  static #selected = null;
  static #constraints = null;
  static #conflicts = null;
  static #registry = null;
  static #candidates = null;

  constructor(rootDependencies, registry, candidates, constraint) {
    this.rootDependencies = { ...rootDependencies };
    this.selected = new Map();
    this.constraintObj = constraint || new Constraint();
    this.constraints = this.constraintObj.getConstraints();
    this.conflicts = new Conflict();
    this.registry = registry || new Registry();
    this.candidates = candidates || new Candidates(this.registry);
  }

  getRootDependencies() {
    if (this.rootDependencies === null) {
      throw new Error("RootDependencies not initialized");
    }
    return this.rootDependencies;
  }

  getSelected() {
    if (this.selected === null) {
      throw new Error("Selected not initialized");
    }
    return this.selected;
  }

  getConstraints() {
    if (this.constraints === null) {
      throw new Error("Constraints not initialized");
    }
    return this.constraints;
  }

  getConflicts() {
    if (this.conflicts === null) {
      throw new Error("Conflicts not initialized");
    }
    return this.conflicts;
  }

  getRegistry() {
    if (this.registry === null) {
      throw new Error("Registry not initialized");
    }
    return this.registry;
  }

  getCandidates() {
    if (this.candidates === null) {
      throw new Error("Candidates not initialized");
    }
    return this.candidates;
  }
}

Resolver.prototype.resolve = resolve;
Resolver.prototype.buildInitialState = buildInitialState;
Resolver.prototype.getValidVersions = getValidVersions;
Resolver.prototype.selectPackage = selectPackage;
Resolver.prototype.addConstraint = addConstraint;
Resolver.prototype.checkConflict = checkConflict;
Resolver.prototype.getFirstConflict = getFirstConflict;
Resolver.prototype.search = search;
Resolver.prototype.createSnapshot = createSnapshot;
Resolver.prototype.restoreSnapshot = restoreSnapshot;

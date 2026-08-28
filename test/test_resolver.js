import { Resolver } from "../src/resolver.js";

export const testResolveDependencies = async (rootDependencies) => {
  try {
    const resolver = new Resolver(rootDependencies);
    const solution = await resolver.resolve();
    console.log("Resolution completed successfully!");
    return solution;
  } catch (error) {
    console.error("Error in testResolveDependencies:", error);
    throw error;
  }
};

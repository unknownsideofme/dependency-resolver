import { generateCandidates } from "../src/candidates.js";

export const testGenerateCandidates = async (conflict) => {
  try {
    const candidates = await generateCandidates(conflict);
    console.log("Candidates generated successfully!");
    return candidates;
  } catch (error) {
    console.error("Error in testGenerateCandidates:", error);
  }
};

import { buildGraph , printGraph } from "../src/graph.js";

export const testBuildGraph = async (deps) => {
    try {
        const graph = await buildGraph(deps);
        console.log("Graph built successfully!");
        return graph; 
    }
    catch (error) {
        console.log(error);
    }
}

export const testPrintGraph = (graph) => {
    try {
        printGraph(graph);
        console.log("Graph printed successfully!");
    }
    catch (error) {
        console.log(error);
    }
}
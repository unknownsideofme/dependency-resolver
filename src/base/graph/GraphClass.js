import buildGraph from "./method/buildGraph.js";
import printGraph from "./method/printGraph.js";

export default class Graph {
    static GraphMap = null;

    constructor() {
        if (Graph.GraphMap === null) {
            Graph.GraphMap = new Map();
        }
        return Graph.GraphMap;
    }
}

Graph.prototype.buildGraph = buildGraph;
Graph.prototype.printGraph = printGraph;
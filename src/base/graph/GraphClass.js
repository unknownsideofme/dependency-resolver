import buildGraph from "./method/buildGraph.js";
import printGraph from "./method/printGraph.js";

export default class Graph {
    static graphMap = null;

    constructor() {
        if (Graph.graphMap === null) {
            Graph.graphMap = new Map();
        }
        this.graphMap = Graph.graphMap;
    }

    getGraphMap() {
        return this.graphMap;
    }
}

Graph.prototype.buildGraph = buildGraph;
Graph.prototype.printGraph = printGraph;
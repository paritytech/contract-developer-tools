/**
 * Topological sort using Kahn's algorithm.
 * Returns nodes in dependency order (dependencies come first).
 *
 * @param graph - Map of node -> nodes it depends on
 * @returns Sorted array of node names
 * @throws Error if there's a circular dependency
 */
export function toposort(graph: Map<string, string[]>): string[] {
    // Build in-degree count and adjacency list (reverse direction)
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>(); // node -> nodes that depend on it

    // Initialize all nodes
    for (const [node, deps] of graph) {
        if (!inDegree.has(node)) {
            inDegree.set(node, 0);
        }
        if (!dependents.has(node)) {
            dependents.set(node, []);
        }

        for (const dep of deps) {
            // Ensure dependency is in the graph
            if (!inDegree.has(dep)) {
                inDegree.set(dep, 0);
            }
            if (!dependents.has(dep)) {
                dependents.set(dep, []);
            }
        }
    }

    // Count in-degrees
    for (const [node, deps] of graph) {
        inDegree.set(node, deps.length);
        for (const dep of deps) {
            dependents.get(dep)!.push(node);
        }
    }

    // Start with nodes that have no dependencies
    const queue: string[] = [];
    for (const [node, degree] of inDegree) {
        if (degree === 0) {
            queue.push(node);
        }
    }

    // Sort the initial queue for deterministic order
    queue.sort();

    const result: string[] = [];

    while (queue.length > 0) {
        // Sort to ensure deterministic output when multiple nodes are available
        queue.sort();
        const node = queue.shift()!;
        result.push(node);

        // Reduce in-degree of dependents
        for (const dependent of dependents.get(node) || []) {
            const newDegree = inDegree.get(dependent)! - 1;
            inDegree.set(dependent, newDegree);
            if (newDegree === 0) {
                queue.push(dependent);
            }
        }
    }

    // Check for cycles
    if (result.length !== inDegree.size) {
        const remaining = [...inDegree.entries()]
            .filter(([_, degree]) => degree > 0)
            .map(([node]) => node);
        throw new Error(
            `Circular dependency detected involving: ${remaining.join(", ")}`,
        );
    }

    return result;
}

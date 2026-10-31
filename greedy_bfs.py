import json
import heapq
import time
from build_graph import calc_distance_haversine # import math function for haversine formula

def greedy_best_first_search(graph, metadata, start_id, goal_id): # Performs Greedy Best-First Search f(n) = h(n)
    if start_id not in metadata or goal_id not in metadata:
        raise ValueError("Start or Goal ID not found in metadata.")
    if start_id not in graph:
        raise ValueError("Start ID not found in the adjacency graph.")
        
    goal_centroid = metadata[goal_id]['centroid']
    
    # Priority queue stores tuples: (heuristic_value, node_id)
    start_h = calc_distance_haversine(metadata[start_id]['centroid'], goal_centroid)
    pq = [(start_h, start_id)]
    
    came_from = {start_id: None} # keeps track of the path and prevents re-visiting nodes
    nodes_expanded = 0
    
    start_time = time.perf_counter()
    
    while pq:
        h_n, current_node = heapq.heappop(pq)
        
        nodes_expanded += 1
        
        if current_node == goal_id: # Goal check
            end_time = time.perf_counter()
            runtime = end_time - start_time
            
            # Reconstruct path
            path = []
            curr = current_node
            while curr is not None:
                path.append(curr)
                curr = came_from[curr]
            path.reverse()
            
            # Calculate actual topological path cost (for optimality comparison)
            actual_cost = 0
            for i in range(len(path) - 1):
                u, v = path[i], path[i+1]
                for neighbor, weight in graph[u]: # Find the edge weight between u and v
                    if neighbor == v:
                        actual_cost += weight
                        break
                        
            return {
                "found": True,
                "path": path,
                "actual_path_cost": actual_cost,
                "nodes_expanded": nodes_expanded,
                "runtime": runtime
            }
            
        # Expand neighbors
        for neighbor, edge_weight in graph.get(current_node, []):
            if neighbor not in came_from:               
                neighbor_h = calc_distance_haversine(metadata[neighbor]['centroid'], goal_centroid) # Heuristic: Haversine distance to goal centroid
                heapq.heappush(pq, (neighbor_h, neighbor))
                came_from[neighbor] = current_node
                
    end_time = time.perf_counter()
    return {
        "found": False,
        "path": None,
        "actual_path_cost": float('inf'),
        "nodes_expanded": nodes_expanded,
        "runtime": end_time - start_time
    }

if __name__ == "__main__": # load data from .json files
    print("Loading datasets into memory...")
    with open('barangay_adjacency_graph.json', 'r', encoding='utf-8') as f:
        graph = json.load(f)
    with open('barangay_metadata.json', 'r', encoding='utf-8') as f:
        metadata = json.load(f)
        
    print(f"Loaded {len(graph)} barangays into the graph.")
    
    # example using two adjacent barangays in Manila (from the dataset snippet)
    # PH1380612010 -> PH1380612012 -> PH1380612013
    start_node = "PH1380612010" 
    goal_node = "PH1380612013"   
    
    print(f"\nRunning Greedy Best-First Search...")
    print(f"Start: {metadata[start_node]['name']} ({start_node})")
    print(f"Goal:  {metadata[goal_node]['name']} ({goal_node})\n")
    
    result = greedy_best_first_search(graph, metadata, start_node, goal_node) # execute the search algorithm
    
    if result["found"]: # output results if a path is found
        print("=== SEARCH SUCCESSFUL ===")
        print(f"Path found with {len(result['path'])} barangays.")
        print(f"Actual Topological Path Cost: {result['actual_path_cost']:.2f} meters")
        print(f"Total Nodes Expanded: {result['nodes_expanded']}")
        print(f"Runtime: {result['runtime']:.6f} seconds")
        print("\nPath Sequence:")
        for i, node_id in enumerate(result['path']):
            name = metadata[node_id]['name']
            mun = metadata[node_id]['city/municipality']
            print(f"  {i+1}. {name}, {mun} ({node_id})")
    else:
        print("=== NO PATH FOUND ===")
        print(f"The destination is unreachable via shared boundaries.")
        print(f"Nodes Expanded before termination: {result['nodes_expanded']}")
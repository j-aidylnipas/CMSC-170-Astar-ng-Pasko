import json
import heapq
import math
import sys
import time


# haversine
def calc_distance_haversine(coord1, coord2):
    lon1, lat1 = coord1
    lon2, lat2 = coord2
    R = 6371008.8

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    # distance in meters
    return R * c


# A* search: f(n) = g(n) + h(n)
# g = cost from start to the node, h = haversine distance of node centroid to goal centroid
def astar_search(graph, metadata, start_id, goal_id):
    # checking
    if start_id not in metadata or goal_id not in metadata:
        raise ValueError("Start or Goal ID not found in metadata.")
    if start_id not in graph:
        raise ValueError("Start ID not found in the adjacency graph.")

    goal_centroid = metadata[goal_id]["centroid"]

    # heuristic
    def h(node_id):
        return calc_distance_haversine(metadata[node_id]["centroid"], goal_centroid)

    start_time = time.perf_counter()

    start_h = h(start_id)
    open_heap = [(start_h, start_h, start_id)]  # (f, h, node_id), h is just for tie breaking
    g_score = {start_id: 0}   # best cost found so far per node
    came_from = {start_id: None}
    closed = set()
    nodes_expanded = 0

    while open_heap:
        f, _, current = heapq.heappop(open_heap)

        # already explored, skip (old entry in the heap)
        if current in closed:
            continue

        closed.add(current)
        nodes_expanded += 1

        # goal check
        if current == goal_id:
            runtime = time.perf_counter() - start_time

            # trace back the path
            path = []
            node = current
            while node is not None:
                path.append(node)
                node = came_from[node]
            path.reverse()

            cost = g_score[goal_id]
            return {
                "found": True,
                "path": path,
                "path_cost": cost,
                "actual_path_cost": cost,  # same value, so it works with greedy's key name too
                "nodes_expanded": nodes_expanded,
                "runtime": runtime
            }

        # check the neighbors
        for neighbor, weight in graph.get(current, []):
            if neighbor in closed:
                continue

            new_g = g_score[current] + weight

            # add if new or if cheaper than the best cost so far
            if neighbor not in g_score or new_g < g_score[neighbor]:
                g_score[neighbor] = new_g
                came_from[neighbor] = current
                neighbor_h = h(neighbor)
                heapq.heappush(open_heap, (new_g + neighbor_h, neighbor_h, neighbor))

    # no path
    return {
        "found": False,
        "path": None,
        "path_cost": float("inf"),
        "actual_path_cost": float("inf"),
        "nodes_expanded": nodes_expanded,
        "runtime": time.perf_counter() - start_time
    }


def load_data():
    print("Loading datasets into memory...")
    with open("barangay_adjacency_graph.json", "r", encoding="utf-8") as f:
        graph = json.load(f)
    with open("barangay_metadata.json", "r", encoding="utf-8") as f:
        metadata = json.load(f)
    print(f"Loaded {len(graph)} barangays into the graph.")
    return graph, metadata


def print_results(result, metadata):
    if result["found"]:
        print("\n=== A* SEARCH SUCCESSFUL ===")
        print(f"Path found with {len(result['path'])} barangays.")
        print(f"Actual Topological Path Cost: {result['path_cost']:.2f} meters")
        print(f"Total Nodes Expanded: {result['nodes_expanded']}")
        print(f"Runtime: {result['runtime']:.6f} seconds")
        print("\nPath Sequence:")
        # each brgy in the path
        for i, node_id in enumerate(result["path"]):
            name = metadata[node_id]["name"]
            mun = metadata[node_id]["city/municipality"]
            print(f"  {i + 1}. {name}, {mun} ({node_id})")
    else:
        print("=== NO PATH FOUND ===")
        print("The destination is unreachable via shared boundaries.")
        print(f"Nodes Expanded before termination: {result['nodes_expanded']}")


if __name__ == "__main__":
    graph, metadata = load_data()

    # python astar.py START_ID GOAL_ID, or no arguments to use the default example
    if len(sys.argv) == 3:
        start_node, goal_node = sys.argv[1], sys.argv[2]
    else: 
        start_node = "PH0403402001" # Bitin, Bay
        goal_node = "PH0403402016" # San Agustin, Bay

    print("\nRunning A* Search...")
    print(f"Start: {metadata[start_node]['name']} ({start_node})")
    print(f"Goal:  {metadata[goal_node]['name']} ({goal_node})")

    result = astar_search(graph, metadata, start_node, goal_node)
    print_results(result, metadata)

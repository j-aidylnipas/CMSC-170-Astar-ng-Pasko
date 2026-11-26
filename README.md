# CMSC 170: A\* ng Pasko
 
A comparison of three search algorithms (**A\***, **Greedy Best-First Search**, and **Uniform Cost Search**) for finding routes between Philippine barangays using their boundaries. Barangays are the nodes of a graph, and two barangays are connected when their boundaries touch. The project measures how each algorithm trades off path quality, nodes expanded, and runtime on 45 test routes.

## How it works
 
1. (`build_graph.py`) reads barangay boundary polygons from `barangays.geojson` and builds an adjacency list. Two barangays are neighbors if their polygons overlap, intersect, or come within a 15m margin of each other. A bounding-box check filters out most pairs before the detailed geometry tests. The cost of each edge is the Haversine distance (in meters) between the two barangay centroids.
2. **Search** runs on that graph:
   - `astar.py`: A\* search, `f(n) = g(n) + h(n)`, using the haversine distance from a node's centroid to the goal centroid as the heuristic.
   - `greedy_bfs.py`: Greedy Best-First Search, `f(n) = h(n)`, using the same heuristic. It reports the real path cost of the path it finds.
   - `uniform_cost.py`: Uniform Cost Search, `f(n) = g(n)`, which expands the node with the lowest path cost so far. It is the optimal baseline.
3. **Comparison** (`compare.py`) runs all three algorithms on the test routes and prints, for each route, the nodes expanded, runtime, and path cost, followed by summary statistics per case. The test cases are hardcoded inside the code.

## Dataset
The dataset source can be found at [BetterGov Open Data dataset](https://data.bettergov.ph/datasets/23). The source contains multiple GeoJSON files, but the dataset of interest is named barangays.geojson.

## Usage
 
All commands are run from the repository root. The pre-built `barangay_adjacency_graph.json` and `barangay_metadata.json` are included, so you can run the searches without rebuilding the graph.
 
### Run a single search
 
Each script takes a start and a goal barangay ID (PSGC codes). With no arguments, it runs a default example.
 
```bash
python astar.py PH0201511032 PH0506212026
python greedy_bfs.py PH0201511032 PH0506212026
python uniform_cost.py PH0201511032 PH0506212026
```
 
The output shows the path found, its cost in meters, the number of nodes expanded, and the runtime in seconds. Barangay IDs can be looked up in `barangay_metadata.json`.
 
### Run the full comparison
 
```bash
python compare.py
```
 
This runs the Best, Average, and Worst case test sets (15 routes each) and prints, per case:
 
- **Optimality hit rate**: the fraction of routes where the algorithm found a path as cheap as the optimal one
- **Percent of optimality**: the average ratio of the algorithm's path cost to the optimal cost (100% means optimal; above 100% means longer than optimal)
- **Average nodes expanded**
- **Average runtime** (seconds)

### Rebuild the graph (optional)
 
This needs `barangays.geojson`, which is not included in the repository. You may download the dataset in the link mentioned above. Place it in the repository root, then run:
 
```bash
python build_graph.py
```
 
This overwrites `barangay_adjacency_graph.json` and `barangay_metadata.json`. Building the graph checks every pair of barangays, so it can take around 6-8 minutes.

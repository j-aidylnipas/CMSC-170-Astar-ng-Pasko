import json
import time
import sys


#uniform cost
def uniform_cost_search(graph, metadata, start_id, goal_id):
    
    #checking
    if start_id not in metadata:
        print("Start ID not in metadata")
        return None
    if goal_id not in metadata:
        print("Goal ID not in metadata")
        return None
    if start_id not in graph:
        print("Start ID not in graph")
        return None
    
    
    #priority
    prio = [(0, start_id) ]
    first = {start_id: None}
    best_cost= {start_id: 0}
    explored = []
    nodes_expanded = 0
    max_prio = 1
    
    start_time = time.perf_counter()
    
    #search part 
    while len(prio)> 0:
        low_cost = prio[0]

        #check to find node with lowest cost
        for item in prio:
            if item[0] < low_cost[0]:
                low_cost = item
                
        prio.remove(low_cost)
        
        cost, current_node = low_cost
        
        #when already explored
        if current_node in explored:
            continue
        
        
        if current_node ==goal_id:
            runtime = time.perf_counter() - start_time
            
            #getting the path
            path =[]
            node = current_node #from goal node
            
            #trace the previous nodes until first node
            while node is not None:
                path.append(node)
                node = first[node]
                
            path.reverse()
            
            return{
                "found":True, "path":path, "path_cost": cost, "nodes_expanded": nodes_expanded, "runtime": runtime
            }
            
        explored.append(current_node)
        nodes_expanded +=1
        
        #check for the neighbors
        for neighbor, weight in graph.get(current_node, []):
            if neighbor in explored:
                continue
            
            new_cost = cost + weight
            
            #checking if not best or is cheaper
            if neighbor not in best_cost or new_cost < best_cost[neighbor]:
                best_cost[neighbor]= new_cost
                first[neighbor]= current_node
                
                prio.append((new_cost, neighbor))
                   
        if len(prio)> max_prio:
            max_prio= len(prio)
            
            
    
    runtime = time.perf_counter() - start_time
    
    return{ "found": False, "path": None, "path_cost": float('inf'), "nodes_expanded": nodes_expanded, "runtime": runtime}
        
        
        
        
def load_data():
    print("Loading the dataset...")
    
    with open('barangay_adjacency_graph.json', 'r', encoding='utf-8') as f:
        graph = json.load(f)
        
    with open('barangay_metadata.json', 'r', encoding='utf-8') as f:
        metadata = json.load(f)
        
    return graph, metadata





def print_results(result, metadata):
    if result["found"]:
        print("\n=== UNIFORM COST SEARCH SUCCESSFUL ===")
        print("Path: ", len(result["path"]), "barangays")
        print("Actual Topological Path Cost: ", round(result["path_cost"], 2), "meters")
        print("Total Nodes Expanded: ", result["nodes_expanded"])
        print(f"Runtime: {result['runtime']:.6f} seconds")
        
        print("\nPath Sequence")
        #each brgy included in the path
        for i, node_id in enumerate(result["path"]):
            brgy = metadata[node_id]['name']
            city = metadata[node_id]['city/municipality']
            
            print(i+1, " ", brgy, ",", city, "(", node_id, ")")
            
    
    else:
        print("=====NO PATH FOUND=====")
        print("Unreachable")
        
        
        
        
        
        
def main():
    graph, metadata = load_data()
    
    if len(sys.argv) == 3:
        start_node, goal_node = sys.argv[1], sys.argv[2]
    else: 
        start_node = "PH0403402001" # Bitin, Bay
        goal_node = "PH0403402016" # San Agustin, Bay
    
    #invalid id
    if start_node not in metadata or goal_node not in metadata:
        print("Invalid ID")
        return
    
    print("Running Uniform Cost Search")
    print("Start: ", metadata[start_node]['name'], "(", start_node, ")")
    print("Goal: ", metadata[goal_node]['name'], "(", goal_node, ")")
    
    
    result = uniform_cost_search(graph, metadata, start_node, goal_node)
    
    if result is not None:
        print_results(result, metadata)
        
        

#main()

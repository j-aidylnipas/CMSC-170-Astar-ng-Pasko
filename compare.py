from astar import astar_search
from greedy_bfs import greedy_best_first_search
from uniform_cost import uniform_cost_search
import json

og_cases = [
    ("PH0201511032","PH0506212026"), #longdistance
    ("PH0403411004","PH1380300008"),
    ("PH0102815004","PH0506212006"),
    ("PH0806411002","PH0804801003"),
    ("PH1130700079","PH1130700002"),
    ("PH1705205029","PH1705208004"), #multipolygon data
    ("PH1705305012","PH1705320002"), #multi to multi
    ("PH1130700023","PH1130700049"), #shortdistance
    ("PH0403402001","PH0403402016"),
    ("PH1380100101","PH1381600011"), #fragmented (metro manila barangay)
    ("PH0306918007","PH0205706003"),
    ("PH0603029051","PH0601911004"),
    ("PH1705205013","PH1705214018"),
    ("PH1108605005","PH1108605006"),
    ("PH1208002024","PH1208002013")
]

best_cases = [
    ("PH0405617019", "PH0405617018"),
    ("PH0401003026", "PH0401008004"),
    ("PH1130700022", "PH1130700023"),
    ("PH1102319009", "PH1102319007"),
    ("PH1606725010", "PH1606724027"),
    ("PH1606708021", "PH1606720009"),
    ("PH0802604046", "PH0806008002"),
    ("PH0504112006", "PH0504112014"),
    ("PH0504107002", "PH0504107013"),
    ("PH1381300120", "PH1381300141"),
    ("PH0205006014", "PH0205009020"),
    ("PH0307103018", "PH0307106009"),
    ("PH0306917011", "PH0304911022"),
    ("PH1102317036", "PH1102317005"),
    ("PH1130700023","PH1130700049")
]

average_cases = [
    ("PH1130700127", "PH1600305013"),
    ("PH0907322056", "PH1903635028"),
    ("PH0403411004", "PH1381500018"),
    ("PH0405642010", "PH0405603036"),
    ("PH0105515009", "PH0105541028"),
    ("PH0803730020", "PH0803723038"),
    ("PH0802602013", "PH0804822015"),
    ("PH0603040040", "PH0601906014"),
    ("PH1705323004", "PH1731500056"),
    ("PH1380300012", "PH0403405011"),
    ("PH1908817001", "PH1206316005"),
    ("PH0702203004", "PH0702237011"),
    ("PH1102322003", "PH1001320015"),
    ("PH0931700059", "PH0907225010"),
    ("PH0506216050", "PH0500513022")
]

worst_cases = [
    ("PH0405627010", "PH0501717010"),
    ("PH0201523010", "PH1401106002"),
    ("PH1003506013", "PH1130700116"),
    ("PH1606724031", "PH1130700034"),
    ("PH0806405008", "PH0806011005"),
    ("PH0506205011", "PH0403405036"),
    ("PH0307708011", "PH0201523013"),
    ("PH1206505016", "PH1606802003"),
    ("PH0201511032","PH0506212026"), #longdistance
    ("PH0704619013", "PH0604504021"),
    ("PH0603040040", "PH0603038019"),
    ("PH0105547011", "PH0402121008"),
    ("PH0205011010", "PH0405642006"),
    ("PH1130700079", "PH1004303002"),
    ("PH1102509018", "PH0908306019")
]

with open("barangay_adjacency_graph.json", "r", encoding="utf-8") as f:
    graph = json.load(f)
with open("barangay_metadata.json", "r", encoding="utf-8") as f:
    metadata = json.load(f)
    
def compare(test_cases):   
    nodes_as = 0
    nodes_bfs = 0
    nodes_ucs = 0

    runtime_as = 0
    runtime_bfs = 0
    runtime_ucs = 0

    unopt_as = 0
    unopt_bfs = 0

    optimalsol_bfs = 0

    print(f'Number of test cases: {len(test_cases)}')
    print("Test cases:")
    for case in test_cases:
        start_node, goal_node = case[0], case[1]
        name_start = metadata[start_node]["name"]
        mun_start = metadata[start_node]["city/municipality"]
        name_goal = metadata[goal_node]["name"]
        mun_goal = metadata[goal_node]["city/municipality"]
        print(f"\t{name_start}, {mun_start} ({start_node}) ==> {name_goal}, {mun_goal} ({goal_node})")
        
    print("Test results:")

    for case in test_cases:
        start_node, goal_node = case[0], case[1]
        
        name_start = metadata[start_node]["name"]
        mun_start = metadata[start_node]["city/municipality"]
        name_goal = metadata[goal_node]["name"]
        mun_goal = metadata[goal_node]["city/municipality"]
        print(f"\t{name_start}, {mun_start} ({start_node}) ==> {name_goal}, {mun_goal} ({goal_node})")
        
        result_as = astar_search(graph, metadata, start_node, goal_node)
        result_bfs = greedy_best_first_search(graph, metadata, start_node, goal_node)
        result_ucs = uniform_cost_search(graph, metadata, start_node, goal_node)
        
        nodes_as += result_as["nodes_expanded"]
        nodes_bfs += result_bfs["nodes_expanded"]
        nodes_ucs += result_ucs["nodes_expanded"]
        
        runtime_as += result_as["runtime"]
        runtime_bfs += result_bfs["runtime"]
        runtime_ucs += result_ucs["runtime"]
        
        print(f"\t\tA* Nodes expanded: {result_as['nodes_expanded']}")
        print(f"\t\tBest First Nodes expanded: {result_bfs['nodes_expanded']}")
        print(f"\t\tUCS Nodes expanded: {result_ucs['nodes_expanded']}\n")
        
        print(f"\t\tA* runtime: {result_as['runtime']:.6f}")
        print(f"\t\tBest First runtime: {result_bfs['runtime']:.6f}")
        print(f"\t\tUCS runtime: {result_ucs['runtime']:.6f}\n")
        
        print(f"\t\tA* path cost: {result_as['path_cost']:.2f}")
        print(f"\t\tBest First path cost: {result_bfs['actual_path_cost']:.2f}")
        print(f"\t\tUCS path cost: {result_ucs['path_cost']:.2f}\n")
        
        if result_bfs["actual_path_cost"] > result_ucs["path_cost"]:
            unopt_bfs += 1
            percent_opt = (result_bfs["actual_path_cost"] - result_ucs["path_cost"]) / result_ucs["path_cost"]
            optimalsol_bfs += percent_opt + 1
        else:
            optimalsol_bfs += 1.0
        if result_as["path_cost"] > result_ucs["path_cost"]:
            unopt_as += 1

    nodes_as /= len(test_cases)
    nodes_bfs /= len(test_cases)
    nodes_ucs /= len(test_cases)

    runtime_as /= len(test_cases)
    runtime_bfs /= len(test_cases)
    runtime_ucs /= len(test_cases)

    optimality_as = ((1 - (unopt_as / len(test_cases))) * 100.0) if unopt_as != 0 else 100.0
    optimality_bfs = (1 - (unopt_bfs / len(test_cases))) * 100.0

    optimalsol_bfs /= len(test_cases)
    optimalsol_bfs *= 100.0

    print()

    print("Optimality hit rate")
    print(f'\t[A* Search] - {optimality_as:.2f}%')
    print(f'\t[Greedy Best-First Search] - {optimality_bfs:.2f}%')
    print(f'\t[Uniform Cost Search] - 100.00%')

    print("Percent of optimality")
    print(f'\t[A* Search] - 100.00%')
    print(f'\t[Greedy Best-First Search] - {optimalsol_bfs:.2f}%')
    print(f'\t[Uniform Cost Search] - 100.00%')

    print("Average no. of nodes expanded")
    print(f'\t[A* Search] - {nodes_as}')
    print(f'\t[Greedy Best-First Search] - {nodes_bfs}')
    print(f'\t[Uniform Cost Search] - {nodes_ucs}')

    print("Average runtime")
    print(f'\t[A* Search] - {runtime_as:.6f}')
    print(f'\t[Greedy Best-First Search] - {runtime_bfs:.6f}')
    print(f'\t[Uniform Cost Search] - {runtime_ucs:.6f}')

print("\n========== BEST CASE ==========")
compare(best_cases)

print("\n========== AVERAGE CASE ==========")
compare(average_cases)

print("\n========== WORST CASE ==========")
compare(worst_cases)

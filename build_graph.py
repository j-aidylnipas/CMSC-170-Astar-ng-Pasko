import json
import math

### MATH STUFF
def calc_distance(coord1, coord2):
    lon1, lat1 = coord1
    lon2, lat2 = coord2
    
    avg_lat = math.radians((lat1+lat2)/2)
    
    diff_lat = (lat2 - lat1) * 111132.92
    diff_lon = (lon2 - lon1) * 111319.9 * math.cos(avg_lat)
    
    return math.sqrt(diff_lon**2 + diff_lat**2)

def calc_distance_haversine(coord1, coord2):
    # constants
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

def calc_centroid(coords):
    lons = [coord[0] for coord in coords]
    lats = [coord[1] for coord in coords]
    return [sum(lons)/len(lons), sum(lats)/len(lats)]

def get_bounding_box(polygon):
    lons = [coord[0] for coord in polygon]
    lats = [coord[1] for coord in polygon]
    return [min(lons), min(lats), max(lons), max(lats)]
    
def check_overlap(box1, box2, threshold):
    # since boundaries are not perfect, have a margin as a safety net
    margin = threshold / 111000 # meters to geographical degrees
    
    return not (box1[2] + margin < box2[0] or
                box1[0] - margin > box2[2] or
                box1[3] + margin < box2[1] or
                box1[1] - margin > box2[3])

def check_neighbors(polygon1, box1, polygon2, box2, threshold=15):
    if not check_overlap(box1, box2, threshold):
        return False
    
    for coord1 in polygon1:
        for coord2 in polygon2:
            if calc_distance(coord1, coord2) <= threshold:
                return True
    
    return False
    

### DATA EXTRACTION
with open('barangays.geojson', 'r') as file:
    data = json.load(file)

adjacency_list = {} # holds the graph, key: barangay psgc id; value: list of (barangay psgc id, centroid haversine distance) pairs
barangays = {} # holds boundary points, key: barangay psgc id; value: list of lat/lon pairs
barangays_metadata = {} # holds barangay metadata for ease of printing/lookup for later down the line.

# extract metadata and boundary points
for barangay in data["features"]:
    # metadata
    name = barangay["properties"]["psgc_name"]
    region = barangay["properties"]["ADM1_EN"]
    province = barangay["properties"]["ADM2_EN"]
    city_mun = barangay["properties"]["ADM3_EN"]
    bar_id = barangay["properties"]["psgc_id"]
    
    # geography
    geo_type = barangay["geometry"]["type"]
    boundaries = barangay["geometry"]["coordinates"]
    
    points = [] # for handling multipolygon boundaries, put all into one array instead
    if geo_type == "Polygon":
        for point in boundaries[0]:
            points.append(point)
    elif geo_type == "MultiPolygon":
        for polygon in boundaries:
            for point in polygon[0]:
                points.append(point)
    
    barangays[bar_id] = points
    centroid = calc_centroid(points)
    
    box = get_bounding_box(points)
    
    barangays_metadata[bar_id] = {
        "name": name,
        "region": region,
        "province": province,
        "city/municipality": city_mun,
        "centroid": centroid,
        "boundary_box": box
    }

# build adjacency list
for psgc_id in barangays_metadata.keys():
    adjacency_list[psgc_id] = [] # add initial lists
    
id_list = list(barangays_metadata.keys())
total_barangays = len(id_list)

for i in range(total_barangays):
    #print(n)
    if i % 100 == 0:
        print(f"Processing row index: {i}/{total_barangays}")
    id1 = id_list[i]
    boundary1 = barangays[id1]
    box1 = barangays_metadata[id1]["boundary_box"]
    centroid1 = barangays_metadata[id1]["centroid"]
    
    for j in range(i + 1, total_barangays):
        id2 = id_list[j]
        boundary2 = barangays[id2]
        box2 = barangays_metadata[id2]["boundary_box"]
        centroid2 = barangays_metadata[id2]["centroid"]
        
        if check_neighbors(boundary1, box1, boundary2, box2):
            distance = calc_distance_haversine(centroid1, centroid2)
            
            adjacency_list[id1].append((id2, distance))
            adjacency_list[id2].append((id1, distance))
            #print("\t", barangays_metadata[id2]["name"], (id2, distance))
    n+=1

print(json.dumps(adjacency_list, indent=4))

## EXPORTING TO JSON
with open("barangay_adjacency_graph.json", "w", encoding="utf-8") as file:
    json.dump(adjacency_list, file, indent=4)

with open("barangay_metadata.json", "w", encoding="utf-8") as file:
    json.dump(barangays_metadata, file, indent=4)

print("done")

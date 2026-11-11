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
                
def to_meters(coord, lat_avg):
    return (
        coord[0] * 111319.9 * math.cos(lat_avg),
        coord[1] * 111132.92
    )

# 
def do_lines_intersect(p1, p2, p3, p4):
    # check direction of A B C using cross product
    def ccw(A, B, C):
        return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])

    return (ccw(p1, p3, p4) != ccw(p2, p3, p4)) and (
      ccw(p1, p2, p3) != ccw(p1, p2, p4)
    )


def is_point_in_polygon(point, poly):
    # check if point is inside polygon
    # algorithm: shoot a line to the right of the point and if it intersects with an edge
    # an even number of times, it is outside the polygon, else it is inside the polygon
    x, y = point
    n = len(poly)
    inside = False
    p1x, p1y = poly[0]
    for i in range(1, n + 1):
        p2x, p2y = poly[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def point_to_segment_distance(point, a, b):
    # calculate shortest distance from given point to edge of points (a, b)
    lat_avg = math.radians((a[1] + b[1] + point[1]) / 3)
 
    px, py = to_meters(point, lat_avg)
    ax, ay = to_meters(a, lat_avg)
    bx, by = to_meters(b, lat_avg)
    
    ab_x = bx - ax
    ab_y = by - ay
    ab_len_sq = ab_x**2 + ab_y**2
    
    if ab_len_sq == 0:
        return math.sqrt((px - ax)**2 + (py - ay)**2)
        
    t = ((px - ax) * ab_x + (py - ay) * ab_y) / ab_len_sq
    t = max(0.0, min(1.0, t))
    
    cx = ax + t * ab_x
    cy = ay + t * ab_y
    
    return math.sqrt((px - cx)**2 + (py - cy)**2)

def check_neighbors(poly_list1, box1, poly_list2, box2, threshold=15):
    # prefiltering for efficiency
    if not check_overlap(box1, box2, threshold):
        return False
    
    # check every polygon of barangay 1 against every polygon of barangay 2
    for polygon1 in poly_list1:
        for polygon2 in poly_list2:
            # check if one of the points is inside polygon
            if is_point_in_polygon(polygon1[0], polygon2) or is_point_in_polygon(
              polygon2[0], polygon1
            ):
                return True

            # check check if an edge intersects
            n1, n2 = len(polygon1), len(polygon2)
            for i in range(n1 - 1):
                a1, a2 = polygon1[i], polygon1[i + 1]
                for j in range(n2 - 1):
                    b1, b2 = polygon2[j], polygon2[j + 1]
                    if do_lines_intersect(a1, a2, b1, b2):
                        return True
            
            # check vertices of poly1 against edges of poly2 and if it is within threshold
            for p in polygon1:
                for j in range(len(polygon2) - 1):
                    if point_to_segment_distance(p, polygon2[j], polygon2[j+1]) <= threshold:
                        return True
                        
            # check vertices of poly2 against edges of poly1 and if it is within threshold
            for p in polygon2:
                for j in range(len(polygon1) - 1):
                    if point_to_segment_distance(p, polygon1[j], polygon1[j+1]) <= threshold:
                        return True
                        
    return False
    
    #for coord1 in polygon1:
    #    for coord2 in polygon2:
    #        if calc_distance(coord1, coord2) <= threshold:
    #            return True
    
    return False
    

### DATA EXTRACTION
with open('barangays.geojson', 'r') as file:
    data = json.load(file)

adjacency_list = {} # holds the graph, key: barangay psgc id; value: list of (barangay psgc id, centroid haversine distance) pairs
barangays = {} # holds boundary polygons, key: barangay psgc id; value: list of polygons
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
    
    poly_list = []
    if geo_type == "Polygon":
        poly_list.append(boundaries[0])
    elif geo_type == "MultiPolygon":
        for polygon in boundaries:
            poly_list.append(polygon[0])
    
    barangays[bar_id] = poly_list
    
    all_points = [pt for polygon in poly_list for pt in polygon]
    centroid = calc_centroid(all_points)
    box = get_bounding_box(all_points)
    
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


print(json.dumps(adjacency_list, indent=4))

## EXPORTING TO JSON
with open("barangay_adjacency_graph.json", "w", encoding="utf-8") as file:
    json.dump(adjacency_list, file, indent=4)

with open("barangay_metadata.json", "w", encoding="utf-8") as file:
    json.dump(barangays_metadata, file, indent=4)

print("done")

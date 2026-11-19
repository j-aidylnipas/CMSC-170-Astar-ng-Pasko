import hav from './assets/figures/haversine.png';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

function App() {
  return (
    <div>
      <div class="main-title">
        <h1>Optimal pathfinding using Philippine barangay boundaries</h1>
        <div>
          <p>A* ng Pasko</p>
          <p>Estabillo, Jeri Lian G.</p>
          <p>Nipas, Juzhel Aidyl T.</p>
          <p>Oblena, Dann Lawrence O.</p>
          <p>Pereja, Jamie Adrianne L.</p>
        </div>
      </div>
      
      {/* Problem Statement */}
      <div>
        <h2>Problem Statement</h2>
        <p>Given a starting barangay, determine the optimal path to a given destination barangay by traversing only through barangay boundaries based on a GeoJSON dataset. In mathematical terms, we determine the shortest path of an undirected weighted graph G = (V, E), where:</p>
        <p>V = a barangay</p>
        <p>E = connects two barangays V and U with a neighboring topological boundary</p>
        <p>Weight(E) = the Haversine distance of barangay V's boundary centroid to an adjacent barangay U's boundary centroid</p>

        {/* Motivation */}
        <div>
          <h3>Motivation</h3>
          <p>Determining paths between two barangays by their boundaries can be used in macro-level city planning such as for disaster response teams. City planners can find optimal evacuation or relief goods supply routes, or, in the aspect of public healthcare, determine possible pathogen spread paths. Knowing shortest paths also lets government agencies and planners know which barangays are close to other barangays or barangays that are most often traversed by optimal paths. This can be used for the planning of distribution hubs and command centers.</p>
        </div>
      </div>
      
      {/* Dataset Description */}
      <div>
        <h2>Dataset Description</h2>
        <p>The dataset <span style={{fontStyle: 'italic'}}>barangays.geojson</span> consists of metadata and boundary polygon data of <span style={{fontWeight: 'bold'}}>41,803</span> barangays (covering 99.947% of the Philippines' total number of barangays). The data of interest is the polygon boundaries, found under the "geometry" field of each entry in "Features" (representing each barangay).</p>
        <p>A barangay boundary's geometry can be of two types - either a  <span style={{fontStyle: 'italic'}}>Polygon</span> type or <span style={{fontStyle: 'italic'}}>MultiPolygon</span> type. There are 1116 MultiPolygon type barangay boundaries in the dataset, with the rest being Polygon types. Of those MultiPolygon boundaries, the most number of polygons in a barangay is 91 polygons, held by Barangay Pandan at Alaminos City, Pangasinan, Region I. The least number of vertices possible in a polygon is 3 (a triangle), while the most is 50 vertices, held by Barangay Umiray at General Nakar, Quezon, Region IV-A.</p>
        <p>The unique identifier of a barangay is its Philippine Standard Geographic Code (PSGC) ID, stored in the dataset at the "psgc_id" field. This will be used to identify a barangay in the dataset, as barangay names are not unique enough to be an identifier.</p>

        {/* Preprocessing */}
        <div>
          <h3>Preprocessing</h3>
          <p>The goal of the data preprocessing is to build an adjacency graph of neighboring barangays. The following steps are followed to get the adjacency graph in preparation for the pathfinding algorithms.</p>

          <h4>Step 1. Boundary Data Extraction</h4>
          <p>To prepare for adjacency graph building, important boundary data is extracted from the raw geojson file. On top of the polygon list data and administrative metadata, the centroid and the minimum bounding box is also calculated from the points in the polygon list. The centroid is the average of all latitude and longitude points of the barangay boundary, regardless of the geometry type of the boundary. The minimum bounding box is the minimum 4-vertice polygon needed to contain the polygons of the boundary, found by getting the minimum and maximum latitude and longitude of the points in the polygon list.</p>
          <h4>Step 2. Neighbor Finding and Adjacency Graph</h4>
          <p>Two barangay boundaries, V and U, are determined to be neighbors if any of their polygons P(V) and P(U) meet any of these 3 conditions, checked by the graph building program in order:</p>
          <ol>
            <li>A vertice of P(V) is inside P(U), or vice versa.</li>
            <li>An edge of P(V) intersects an edge of P(U), or vice versa.</li>
            <li>A vertice of P(V) is within an adjustable threshold (in our case, 15 meters) of an edge of P(U), or vice versa.</li>
          </ol>
          <p>To speed up neighbor calculations, the minimum bounding box calculated on step 1 is used as a prefilter to skip barangays that are clearly not neighbors if their bounding boxes do no intersect.</p>
          <p>If two boundaries are deemed neighbors, their PSGC IDs are added to both of their entries in the adjacency dictionary along with the Haversine distance of their centroids as edge weights. The Haversine formula determines the shortest distance of two latitude-longitude points over Earth's surface. The complete formula is as seen below:</p>
          {/*Reference: https://www.movable-type.co.uk/scripts/latlong.html*/}

          <BlockMath math="d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\phi_2 - \phi_1}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\lambda_2 - \lambda_1}{2}\right)}\right)" />
          <p>where:</p>
          <ul>
            <li><InlineMath math="d" /> = distance between geographical points 1 and 2</li>
            <li><InlineMath math="\phi" /> = latitude</li>
            <li><InlineMath math="\lambda" /> = longitude</li>
            <li><InlineMath math="r" /> = radius of the sphere (in this case, radius of the Earth)</li>
          </ul>
          {/*Image reference: https://teaching.csse.uwa.edu.au/units/CITS2002/workshops/workshop3.php*/}
          <p>With 4 trigonometric functions and 1 square root expression, this is the most calculationally expensive section of the program. The program will take as long as 6-8 minutes to complete.</p>

          <h4>Step 3. Serialization</h4>
          <p>The adjacency graph and metadata are saved to two JSON files barangay_adjacency_graph.json and barangay_metadata.json, respectively. This prevents a need for multiple program runs, and makes lookup of the needed data faster for the pathfinding algorithms.</p>
        </div>
      </div>
      <div>
        <h2>Methods</h2>
        <p>Three pathfinding algorithms will be used for getting the optimal paths of two graph vertices. These will be:</p>
        <ol>
          <li>Greedy Best-First Search</li>
          <li>Uniform Cost Search (UCS)</li>
          <li>A* Search</li>
        </ol>
        <p>Fundamentally, all three of the search algorithms work similarly to each other. Starting from the start vertex, we "expand" into the adjacent vertices and place them into a priority queue, to which we then visit the next vertex depending on the evaluation of the algorithm. We visit and expand over and over until we arrive to the destination vertex. The one aspect that differs between the three algorithms is to where the algorithm should visit next. The algorithm will only visit the unvisited vertex in the priority queue with the lowest total cost estimate, determined (by all three functions) using the evaluation function below:</p>
        <BlockMath math='f(n) = g(n) + h(n)'/>
        <p>where:</p>
        <ul>
          <li><InlineMath math="f(n)" /> = total cost estimate</li>
          <li><InlineMath math="g(n)" /> = accumulated path cost</li>
          <li><InlineMath math="h(n)" /> = estimated remaining cost (heuristic), determined by the Haversine distance of the current vertex centroid and the destination vertex centroide</li>
        </ul>
        <p>Greedy Best-First Search sets <InlineMath math="g(n) = 0" />, only relying on the remaining distance to the destination barangay.</p>
        <p>Uniform Cost Search sets <InlineMath math="h(n) = 0" />, only relying on the distance already traversed by the path</p>
        <p>A* Search uses both <InlineMath math="g(n)" /> and <InlineMath math="h(n)" /> for its evaluation function.</p>
      </div>
      <div>
        <h2>Experimental Setup</h2>
        <p>Test.</p>
      </div>
      <div>
        <h2>Results and Discussion</h2>
          <div class="wrap">
          <table>
            <caption>Average</caption>
            <thead>
              <tr>
                <th scope="col"></th>
                <th scope="col">Uniform Cost Search Algorithm</th>
                <th scope="col">A* Search Algorithm</th>
                <th scope="col">Greedy Best-First Search Algorithm</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Optimality Rate</th>
                <td>100.00%</td>
                <td>100.00%</td>
                <td>20.00%</td>
              </tr>
              <tr>
                <th scope="row">Percent Optimality</th>
                <td>100.00%</td>
                <td>100.00%</td>
                <td>87.24%</td>
              </tr>
              <tr>
                <th scope="row">Number of Nodes Expanded</th>
                <td>3603.3333333333335</td>
                <td>2422.733</td>
                <td>109.13333333333334</td>
              </tr>
              <tr>
                <th scope="row">Runtime (seconds)</th>
                <td>0.969013</td>
                <td>0.008477</td>
                <td>0.0004488</td>
              </tr>
            </tbody>
          </table>
          <p class="note">*All test cases were executed with 13th Gen Intel® Core™ i5-13500H, Windows 11, x86_64*</p>
        </div>
      </div>
      <div>
        <h2>References</h2>
        <p>Test.</p>
      </div>
      <div>
        <h2>Links</h2>
        <p>Test.</p>
      </div>
    </div>
  )
}

export default App
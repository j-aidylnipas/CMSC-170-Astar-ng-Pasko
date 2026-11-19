import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import average_nodes_expanded from './../../figures and graphs/Average_Nodes_Expanded.png';
import average_runtime from './../../figures and graphs/Average_Runtime.png';
import scatterplot_runtime_nodesexpanded from './../../figures and graphs/Scatterplot_Runtime_NodesExpanded.png';
import brgy_poly from './assets/figures/brgy_poly.png';
import brgy_md from './assets/figures/brgy_md.png'
import brgy_adj from './assets/figures/brgy_adj.png';
import maps_adj from './assets/figures/maps_adj.png';
import rawdata from './assets/figures/rawdata.png';

const AUTHORS = [
  'Estabillo, Jeri Lian G.',
  'Nipas, Juzhel Aidyl T.',
  'Oblena, Dann Lawrence O.',
  'Pereja, Jamie Adrianne L.',
];

function App() {
  return (
    <>

      <main>
        <article className="article" id="top">
          <h1>Optimal pathfinding using Philippine barangay boundaries</h1>

          {/* Authors */}
          <div className="authors">
            <p>A* ng Pasko</p>
            {AUTHORS.map((name) => (
              <p key={name}>{name}</p>
            ))}
          </div>

          {/* Problem Statement */}
          <section id="problem-statement">
            <h2>Problem Statement</h2>
            <p>Given a starting barangay, determine the optimal path to a given destination barangay by traversing only through barangay boundaries based on a GeoJSON dataset. In mathematical terms, we determine the shortest path of an undirected weighted graph <InlineMath math="G=(V,E)" />, where:</p>
            <p><InlineMath math="V" />= a barangay</p>
            <p><InlineMath math="E" /> = connects two barangays <InlineMath math="V" /> and <InlineMath math="U" /> with a neighboring topological boundary</p>
            <p><InlineMath math="Weight(E)" /> = the Haversine distance of barangay <InlineMath math="V" />'s boundary centroid to an adjacent barangay <InlineMath math="U" />'s boundary centroid</p>

            <h3>Motivation</h3>
            <p>Determining paths between two barangays by their boundaries can be used in macro-level city planning such as for disaster response teams. City planners can find optimal evacuation or relief goods supply routes, or, in the aspect of public healthcare, determine possible pathogen spread paths. Knowing shortest paths also lets government agencies and planners know which barangays are close to other barangays or barangays that are most often traversed by optimal paths. This can be used for the planning of distribution hubs and command centers.</p>
          </section>

          {/* Dataset Description */}
          <section id="dataset">
            <h2>Dataset Description</h2>
            <p>The dataset <em>barangays.geojson</em> from BetterGov.ph's Open Data Portal consists of metadata and boundary polygon data of <strong>41,803</strong> barangays (covering 99.947% of the Philippines' total number of barangays). The data of interest is the polygon boundaries, found under the "geometry" field of each entry in "Features" (representing each barangay).</p>
            <p>A barangay boundary's geometry can be of two types - either a <em>Polygon</em> type or <em>MultiPolygon</em> type. There are 1116 MultiPolygon type and 40,910 Polygon type barangay boundaries in the dataset, totaling a number of 42,026 polygons. Of those MultiPolygon boundaries, the most number of polygons in a barangay is 91 polygons, held by Barangay Pandan at Alaminos City, Pangasinan, Region I. The least number of vertices possible in a polygon is 3 (a triangle), while the most is 50 vertices, held by Barangay Umiray at General Nakar, Quezon, Region IV-A.</p>
            <p>The unique identifier of a barangay is its Philippine Standard Geographic Code (PSGC) ID, stored in the dataset at the "psgc_id" field. This will be used to identify a barangay in the dataset, as barangay names are not unique enough to be an identifier.</p>
            <figure className='figure'>
              <img src={rawdata} width="300" />
              <figcaption>Figure 1. Data layout of barangays.geojson</figcaption>
            </figure>

            <h3>Preprocessing</h3>
            <p>The goal of the data preprocessing is to build an adjacency graph of neighboring barangays. The following steps are followed to get the adjacency graph in preparation for the pathfinding algorithms.</p>

            <h4>Step 1. Boundary Data Extraction</h4>
            <p>To prepare for adjacency graph building, important boundary data is extracted from the raw geojson file. On top of the polygon list data and administrative metadata, the centroid and the minimum bounding box is also calculated from the points in the polygon list. The centroid is the average of all latitude and longitude points of the barangay boundary, regardless of the geometry type of the boundary. The minimum bounding box is the minimum 4-vertice polygon needed to contain the polygons of the boundary, found by getting the minimum and maximum latitude and longitude of the points in the polygon list.</p>
            <figure className='figure'>
              <img src={brgy_poly} width="200" />
              <figcaption>Figure 1. Polygon list of Barangay Visayan Village after Step 1</figcaption>
            </figure>
            <figure className='figure'>
              <img src={brgy_md} />
              <figcaption>Figure 2. Metadata of Barangay Visayan Village after Step 1</figcaption>
            </figure>

            <h4>Step 2. Neighbor Finding and Adjacency Graph</h4>
            <p>Two barangay boundaries, <InlineMath math="V" /> and <InlineMath math="U" />, are determined to be neighbors if any of their polygons <InlineMath math="P(V)" /> and <InlineMath math="P(U)" /> meet any of these 3 conditions, checked by the graph building program in order:</p>
            <ol>
              <li>A vertice of <InlineMath math="P(V)" /> is inside <InlineMath math="P(U)" />, or vice versa.</li>
              <li>An edge of <InlineMath math="P(V)" /> intersects an edge of <InlineMath math="P(U)" />, or vice versa.</li>
              <li>A vertice of <InlineMath math="P(V)" /> is within an adjustable threshold (in our case, 15 meters) of an edge of <InlineMath math="P(U)" />, or vice versa.</li>
            </ol>
            <p>To speed up neighbor calculations, the minimum bounding box calculated on step 1 is used as a prefilter to skip barangays that are clearly not neighbors if their bounding boxes do no intersect.</p>
            <p>If two boundaries are deemed neighbors, their PSGC IDs are added to both of their entries in the adjacency dictionary along with the Haversine distance of their centroids as edge weights. The Haversine formula determines the shortest distance of two latitude-longitude points over Earth's surface. The complete formula is as seen below:</p>
            {/* Reference: https://www.movable-type.co.uk/scripts/latlong.html */}
            <BlockMath math="d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\phi_2 - \phi_1}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\lambda_2 - \lambda_1}{2}\right)}\right)" />
            <p>where:</p>
            <ul>
              <li><InlineMath math="d" /> = distance between geographical points 1 and 2</li>
              <li><InlineMath math="\phi" /> = latitude</li>
              <li><InlineMath math="\lambda" /> = longitude</li>
              <li><InlineMath math="r" /> = radius of the sphere (in this case, radius of the Earth)</li>
            </ul>
            <p>For computational purposes, a revised Haversine formula will be used for the program, deriving <InlineMath math="\arcsin(a) = \arctan(\frac{\sqrt{a}}{\sqrt{1-a}})" />.</p>
            <p>With 4 trigonometric functions and 1 square root expression, this is the most calculationally expensive section of the program. The program will take as long as 6-8 minutes to complete.</p>
            <figure className='figure'>
              <img src={brgy_adj} />
              <figcaption>Figure 3. The adjacency list of Barangay Visayan Village after Step 3</figcaption>
            </figure>
            <figure className='figure'>
              <img src={maps_adj} />
              <figcaption>Figure 4. Maps view of the barangay boundaries, with Barangay Visayan Village highlighted in red</figcaption>
            </figure>

            <h4>Step 3. Serialization</h4>
            <p>The adjacency graph and metadata are saved to two JSON files barangay_adjacency_graph.json and barangay_metadata.json, respectively. This prevents a need for multiple program runs, and makes lookup of the needed data faster for the pathfinding algorithms.</p>
          </section>

          {/* Methods */}
          <section id="methods">
            <h2>Methods</h2>
            <p>Three pathfinding algorithms will be used for getting the optimal paths of two graph vertices. These will be:</p>
            <ol>
              <li>Greedy Best-First Search</li>
              <li>Uniform Cost Search (UCS)</li>
              <li>A* Search</li>
            </ol>
            <p>Fundamentally, all three of the search algorithms work similarly to each other. Starting from the start vertex, we "expand" into the adjacent vertices and place them into a priority queue, to which we then visit the next vertex depending on the evaluation of the algorithm. We visit and expand over and over until we arrive to the destination vertex. The one aspect that differs between the three algorithms is to where the algorithm should visit next. The algorithm will only visit the unvisited vertex in the priority queue with the lowest total cost estimate, determined (by all three functions) using the evaluation function below:</p>
            <BlockMath math="f(n) = g(n) + h(n)" />
            <p>where:</p>
            <ul>
              <li><InlineMath math="f(n)" /> = total cost estimate</li>
              <li><InlineMath math="g(n)" /> = accumulated path cost</li>
              <li><InlineMath math="h(n)" /> = estimated remaining cost (heuristic), determined by the Haversine distance of the current vertex centroid and the destination vertex centroid</li>
            </ul>
            <p>Greedy Best-First Search sets <InlineMath math="g(n) = 0" />, only relying on the remaining distance to the destination barangay.</p>
            <p>Uniform Cost Search sets <InlineMath math="h(n) = 0" />, only relying on the distance already traversed by the path.</p>
            <p>A* Search uses both <InlineMath math="g(n)" /> and <InlineMath math="h(n)" /> for its evaluation function.</p>
          </section>

          {/* Experimental Setup */}
          <section id="experimental-setup">
            <h2>Experimental Setup</h2>
            <h3>Test Cases</h3>
            <p>15 different pairs of start barangays and end barangays, consisting of barangays and barangay pairs of different characteristics such as MultiPolygon endpoints, long- and short-distance paths, and from different parts of the country, will be used as the test cases.</p>

            <div className="table-wrap">
              <table>
                <caption>Table 1. Test Cases</caption>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Start</th>
                    <th>Goal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>1</td><td>Camalaggoan/D Leano, Claveria (PH0201511032)</td><td>Mambajog, Matnog (PH0506212026)</td></tr>
                  <tr><td>2</td><td>Batong Malake, Los Banos (PH0403411004)</td><td>Forbes Park, City of Makati (PH1380300008)</td></tr>
                  <tr><td>3</td><td>Balaoi, Pagudpud (PH0102815004)</td><td>Bon-Ot Big, Matnog (PH0804801003)</td></tr>
                  <tr><td>4</td><td>Balongbalong, Pintuyan (PH0806411002)</td><td>Cabacungan, Allen (PH0804801003)</td></tr>
                  <tr><td>5</td><td>Mintal, Davao City (PH1130700079)</td><td>Agdao, Davao City (PH1130700002)</td></tr>
                  <tr><td>6</td><td>Lazareto, City of Calapan (Capital) (PH1705205029)</td><td>Arangin, Naujan (PH1705208004)</td></tr>
                  <tr><td>7</td><td>Puring, Bataraza (PH1705305012)</td><td>Banbanan, Taytay (PH1705320002)</td></tr>
                  <tr><td>8</td><td>Cabantian, Davao City (PH1130700023)</td><td>Ilang, Davao City (PH1130700049)</td></tr>
                  <tr><td>9</td><td>Bitin, Bay (PH0403402001)</td><td>San Agustin, Bay (PH0403402016)</td></tr>
                  <tr><td>10</td><td>Barangay 101, Caloocan City (PH1380100101)</td><td>Gen. T. De Leon, City of Valenzuela (PH1381600011)</td></tr>
                  <tr><td>11</td><td>Maamot, San Jose (PH0306918007)</td><td>Dissimungal, Nagtipunan (PH0205706003)</td></tr>
                  <tr><td>12</td><td>Trangka, Maasin (PH0603029051)</td><td>Casanayan, Pilar (PH0601911004)</td></tr>
                  <tr><td>13</td><td>Calero, City of Calapan (Capital) (PH1705205013)</td><td>Pasi I, Socorro (PH1705214018)</td></tr>
                  <tr><td>14</td><td>Patuco, Sarangani (PH1108605005)</td><td>Laker, Sarangani (PH1108605006)</td></tr>
                  <tr><td>15</td><td>Rio Del Pilar, Glan (PH1208002024)</td><td>Glan Padidu, Glan (PH1208002013)</td></tr>
                </tbody>
              </table>
            </div>

            <h3>Metrics</h3>
            <p>Two characteristics are measured in each algorithm: <em>efficiency</em> and <em>optimality</em>.</p>

            <h4>Efficiency</h4>
            <p>To measure the efficiency of an algorithm, we get the <strong>nodes expanded/popped</strong> from the priority queue, and the <strong>runtime</strong>. To ensure consistent results for runtime, only one machine will be used for the execution of all test cases in the experiment. The machine specs are <em>13th Gen Intel® Core™ i5-13500H, Windows 11</em>. The average nodes expanded and runtime of the algorithm will also be calculated.</p>

            <h4>Optimality</h4>
            <p>To measure the optimality of an algorithm, we get the <strong>optimality rate</strong> and the <strong>percent optimality</strong> of the algorithm. The optimality rate of an algorithm is the measure of how often the algorithm gets the optimal solution, calculated as:</p>
            <BlockMath math="Rate_{\text{Optimality}} = \frac{Paths_{\text{Optimal}}}{TotalCases} \times 100\%" />
            <p>The percent optimality of an algorithm is the measure of how far an algorithm's solution is to the optimal solution, calculated as:</p>
            <BlockMath math="\text{Percent}_{\text{Optimality}} = \left( 1 - \left| \frac{\text{Cost}_{\text{Solution}} - \text{Cost}_{\text{Optimal}}}{\text{Cost}_{\text{Optimal}}} \right| \right) \times 100\%" />
            <p>We will get the average percent optimality of all runs/test cases.</p>
            <p>Because Uniform Cost Search solutions always guarantee optimal solutions, any calculation involving values of an optimal solution will use results from Uniform Cost Search runs.</p>
          </section>

          {/* Results */}
          <section id="results">
            <h2>Results and Discussion</h2>
            <div className="table-wrap">
              <table>
                <caption>Table 2. Average Results</caption>
                <thead>
                  <tr>
                    <th scope="col"></th>
                    <th scope="col">Uniform Cost Search</th>
                    <th scope="col">A* Search</th>
                    <th scope="col">Greedy Best-First Search</th>
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
                    <td>3603.33</td>
                    <td>2422.73</td>
                    <td>109.13</td>
                  </tr>
                  <tr>
                    <th scope="row">Runtime (seconds)</th>
                    <td>0.969013</td>
                    <td>0.008477</td>
                    <td>0.0004488</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="note">*All test cases were executed with 13th Gen Intel® Core™ i5-13500H, Windows 11, x86_64*</p>

            {/* Figures and Graphs */}
            <figure className="figure">
              <img src={average_nodes_expanded} alt="Bar graph comparing average nodes expanded across algorithms" />
              <figcaption>Figure 4. Bar Graph for Average Number of Nodes Expanded</figcaption>
            </figure>
            <p>The results show that Uniform Cost Search accounts for the largest average number of expanded nodes (3,603.33), followed by A* Search (2,422.73), while Greedy Best-First Search expands only a small fraction (109.13). This indicates that Uniform Cost Search explores a substantially broader portion of the barangay graph than heuristic-guided search.</p>

            <figure className="figure">
              <img src={average_runtime} alt="Bar graph comparing average runtime in seconds across algorithms" />
              <figcaption>Figure 5. Bar Graph for Average Runtime</figcaption>
            </figure>
            <p>The results show that Uniform Cost Search has the largest average runtime (0.969013 s), followed by A* Search (0.008477 s), while Greedy Best-First Search has the lowest average runtime (0.0004488 s). Guiding search with the Haversine heuristic dramatically reduces execution time compared to uninformed cost expansion.</p>

            <figure className="figure">
              <img src={scatterplot_runtime_nodesexpanded} alt="Scatterplot comparing runtime against nodes expanded" />
              <figcaption>Figure 6. Runtime vs. Nodes Expanded</figcaption>
            </figure>
            <p>The results show that across all three algorithms, runtime is negligible when the number of nodes expanded is small. As the number of expanded nodes increases, Uniform Cost Search incurs much higher runtime than A* Search, indicating that A* handles wider spatial searches more efficiently than UCS. Greedy Best-First Search consistently expands the fewest nodes and runs fastest, whereas Uniform Cost Search expands the most nodes.</p>
          </section>

          <section>
            <h3>Findings</h3>
            <p>Uniform Cost Search achieved 100% optimality rate, which means that it consistently found optimal solutions across all 15 test cases. However, in terms of average runtime, the algorithm is the slowest despite having an average of 3603.335 nodes expanded. This indicates that Uniform Cost Search algorithm guarantees optimal solutions though would take the longest in terms of runtime.</p>
            
            <p>A* Search achieved 100% optimality rate, which means that it also consistently found optimal solutions across all 15 test cases, while expanding an average of 2422.733 nodes. A* Search achieved an average runtime of 0.008477 seconds. Compared to Uniform Cost Search, the algorithm reduced the average number of expanded nodes and achieved substantially faster execution. This indicates that A* Search demonstrates the effectiveness of heuristic in guiding the search toward the goal while maintaining optimality.</p>

            <p>Greedy Best-First Search achieved the lowest average number of expanded nodes of 109.134 and the fastest average runtime at 0.0004488 seconds. However, it recorded a 20% optimality rate, indicating that a small part of its solutions across the 15 test cases were optimal. The solutions that the algorithm finds are, on average, +-87.24% from the optimal solution. The algorithm is expected to be the fastest because it prioritizes nodes based only on their estimated distance to the goal rather than considering the total path cost. </p>
          </section>

          {/* References */}
          <section id="references">
            <h2>References</h2>
            <p>https://www.eecs.umich.edu/courses/eecs380/HANDOUTS/PROJ2/InsidePoly.html</p>
            <p>https://www.movable-type.co.uk/scripts/latlong.html</p>
            <p>https://www.geeksforgeeks.org/dsa/check-if-two-given-line-segments-intersect/</p>
            <p>https://math.stackexchange.com/questions/330269/the-distance-from-a-point-to-a-line-segment</p>
          </section>

          {/* Links */}
          <section id="links">
            <h2>Links</h2>
            <div className='link-group'>
              <a href='https://github.com/j-aidylnipas/CMSC-170-Astar-ng-Pasko' className='link-button'>GitHub Repository</a>
              <a href='https://data.bettergov.ph/datasets/23' className='link-button'>Dataset Source</a>
            </div>
          </section>
        </article>
      </main>

      <footer className="footer">
        <p>A* ng Pasko</p>
      </footer>
    </>
  );
}

export default App;
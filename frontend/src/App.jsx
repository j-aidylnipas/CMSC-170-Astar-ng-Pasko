import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import average_best from './assets/figures/avg_best.png';
import average_avg from './assets/figures/avg_avg.png';
import average_worst from './assets/figures/avg_worst.png';
import vis from './assets/figures/test_vis.png';
import trend_best from './assets/figures/trend_best.png'
import trend_avg from './assets/figures/trend_avg.png'
import trend_worst from './assets/figures/trend_worst.png'
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
              <figcaption>Figure 2. Polygon list of Barangay Visayan Village after Step 1</figcaption>
            </figure>
            <figure className='figure'>
              <img src={brgy_md} />
              <figcaption>Figure 3. Metadata of Barangay Visayan Village after Step 1</figcaption>
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
              <figcaption>Figure 4. The adjacency list of Barangay Visayan Village after Step 3</figcaption>
            </figure>
            <figure className='figure'>
              <img src={maps_adj} />
              <figcaption>Figure 5. Maps view of the barangay boundaries, with Barangay Visayan Village highlighted in red</figcaption>
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
            <p>45 different pairs of start barangays and end barangays were picked as test cases for the experiment. These 45 pairs are divided into Best Case, Average Case, and Worst Case test case groups, consisting of 15 cases each. Best Case test cases consist of short, near-distance pairs (node-wise), Average Case test cases consist of medium distance pairs while Worst Case test cases consist of long-distance pairs.</p>

            <div className="table-wrap">
              <table>
                <caption>Table 1. Best Case Test Cases</caption>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Start</th>
                    <th>Goal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>1</td><td>Umiray, General Nakar (PH0405617019)</td><td>San Marcelino, General Nakar (PH0405617018)</td></tr>
                  <tr><td>2</td><td>Duhatan, Balayan (PH0401003026)</td><td>Balitoc, Calatagan (PH0401008004)</td></tr>
                  <tr><td>3</td><td>Bunawan, Davao City (PH1130700022)</td><td>Cabantian, Davao City (PH1130700023)</td></tr>
                  <tr><td>4</td><td>Madaum, City of Tagum (Capital) (PH1102319009)</td><td>La Filipina, City of Tagum (Capital) (PH1102319007)</td></tr>
                  <tr><td>5</td><td>Opong, Tagana-an (PH1606725010)</td><td>Mabini, Surigao City (Capital) (PH1606724027)</td></tr>
                  <tr><td>6</td><td>San Fernando, Del Carmen (PH1606708021)</td><td>San Miguel, San Isidro (PH1606720009)</td></tr>
                  <tr><td>7</td><td>San Andres, City of Borongan (Capital) (PH0802604046)</td><td>Binobucalan, Hinabangan (PH0806008002)</td></tr>
                  <tr><td>8</td><td>Calumpang, Milagros (PH0504112006)</td><td>Matiporon, Milagros (PH0504112014)</td></tr>
                  <tr><td>9</td><td>Boca Engano, Claveria (PH0504107002)</td><td>Nonoc, Claveria (PH0504107013)</td></tr>
                  <tr><td>10</td><td>Tandang Sora, Quezon City (PH1381300120)</td><td>Greater Lagro, Quezon City (PH1381300141)</td></tr>
                  <tr><td>11</td><td>Lurad, Diadi (PH0205006014)</td><td>Pudi, Kasibu (PH0205009020)</td></tr>
                  <tr><td>12</td><td>Uacon, Candelaria (PH0307103018)</td><td>Santa Rita, Masinloc (PH0307106009)</td></tr>
                  <tr><td>13</td><td>Cruz, Victoria (PH0306917011)</td><td>Cavite, Guimba (PH0304911022)</td></tr>
                  <tr><td>14</td><td>San Remigio, Island Garden City of Samal (PH1102317036)</td><td>Balet, Island Garden City of Samal (PH1102317005)</td></tr>
                  <tr><td>15</td><td>Cabantian, Davao City (PH1130700023)</td><td>Ilang, Davao City (PH1130700049)</td></tr>
                </tbody>
              </table>
            </div>

            <div className="table-wrap">
              <table>
                <caption>Table 2. Average Case Test Cases</caption>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Start</th>
                    <th>Goal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>1</td><td>Tugbok, Davao City (PH1130700127)</td><td>Kasapa, Loreto (PH1600305013)</td></tr>
                  <tr><td>2</td><td>Dampalan, Pagadian City (Capital) (PH0907322056)</td><td>Maganding, Picong (Sultan Gumander) (PH1903635028)</td></tr>
                  <tr><td>3</td><td>Batong Malake, Los Banos (PH0403411004)</td><td>Western Bicutan, Taguig City (PH1381500018)</td></tr>
                  <tr><td>4</td><td>Nasalaan, San Francisco (Aurora) (PH0405642010)</td><td>Santa Catalina, Atimonan (PH0405603036)</td></tr>
                  <tr><td>5</td><td>Gueset, Bugallon (PH0105515009)</td><td>Inmalog, Sison (PH0105541028)</td></tr>
                  <tr><td>6</td><td>Pongon, Macarthur (PH0803730020)</td><td>Tinambacan, Jaro (PH0803723038)</td></tr>
                  <tr><td>7</td><td>Maybunga, Balangiga (PH0802602013)</td><td>Geparayan De Turag, Silvino Lobos (PH0804822015)</td></tr>
                  <tr><td>8</td><td>Igdagmay, San Joaquin (PH0603040040)</td><td>Jaena Sur, Jamindan (PH0601906014)</td></tr>
                  <tr><td>9</td><td>Canipaan, Rizal (Marcos) (PH1705323004)</td><td>Simpocan, Puerto Princesa City (Capital) (PH1731500056)</td></tr>
                  <tr><td>10</td><td>La Paz, City of Makati (PH1380300012)</td><td>Canlubang, City of Calamba (PH0403405011)</td></tr>
                  <tr><td>11</td><td>Campo, South Upi (PH1908817001)</td><td>Laconon, T'Boli (PH1206316005)</td></tr>
                  <tr><td>12</td><td>Lepanto, Alegria (PH0702203004)</td><td>Lamac, Pinamungajan (PH0702237011)</td></tr>
                  <tr><td>13</td><td>Santo Nino, Talaingod (PH1102322003)</td><td>Lirongan, Talakag (PH1001320015)</td></tr>
                  <tr><td>14</td><td>Pasonanca, Zamboanga City (PH0931700059)</td><td>Miampic, Godod (PH0907225010)</td></tr>
                  <tr><td>15</td><td>Osiao, City of Sorsogon (Capital) (PH0506216050)</td><td>Panganiran, Pio Duran (PH0500513022)</td></tr>
                </tbody>
              </table>
            </div>

            <div className="table-wrap">
              <table>
                <caption>Table 3. Worst Case Test Cases</caption>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Start</th>
                    <th>Goal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>1</td><td>Cagsiay III, Mauban (PH0405627010)</td><td>Del Carmen, Lagonoy (PH0501717010)</td></tr>
                  <tr><td>2</td><td>Patunungan, Santa Ana (PH0201523010)</td><td>Dalupirip, Itogon (PH1401106002)</td></tr>
                  <tr><td>3</td><td>Ditago, Sultan Naga Dimaporo (Karomatan) (PH1003506013)</td><td>Talomo, Davao City (PH1130700116)</td></tr>
                  <tr><td>4</td><td>Mat-i, Surigao City (Capital) (PH1606724031)</td><td>Colosas, Davao City (PH1130700034)</td></tr>
                  <tr><td>5</td><td>Nahaong, Libagon (PH0806405008)</td><td>Camonoan, Matuguinao (PH0806011005)</td></tr>
                  <tr><td>6</td><td>Inlagadian, Casiguran (PH0506205011)</td><td>Pansol, City of Calamba (PH0403405036)</td></tr>
                  <tr><td>7</td><td>Diteki, San Luis (PH0307708011)</td><td>Santa Clara, Santa Ana (PH0201523013)</td></tr>
                  <tr><td>8</td><td>Sangay, Kalamansig (PH1206505016)</td><td>Cabugo, Bayabas (PH1606802003)</td></tr>
                  <tr><td>9</td><td>Camalaggoan/D Leano, Claveria (PH0201511032)</td><td>Mambajog, Matnog (PH0506212026)</td></tr>
                  <tr><td>10</td><td>Malabuhan, Siaton (PH0704619013)</td><td>Sicaba, Cadiz City (PH0604504021)</td></tr>
                  <tr><td>11</td><td>Igdagmay, San Joaquin (PH0603040040)</td><td>Pangi, San Dionisio (PH0603038019)</td></tr>
                  <tr><td>12</td><td>Piaz, Villasis (PH0105547011)</td><td>Sapang I, Ternate (PH0402121008)</td></tr>
                  <tr><td>13</td><td>Runruno, Quezon (PH0205011010)</td><td>Huyon-Uyon, San Francisco (Aurora) (PH0405642006)</td></tr>
                  <tr><td>14</td><td>Mintal, Davao City (PH1130700079)</td><td>Dahilig, Balingoan (PH1004303002)</td></tr>
                  <tr><td>15</td><td>Macambol, City of Mati (Capital) (PH1102509018)</td><td>Penaranda, Kabasalan (PH0908306019)</td></tr>
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
            <BlockMath math="\text{Percent}_{\text{Optimality}} = 1 +\left(\frac{\text{Cost}_{\text{Solution}} - \text{Cost}_{\text{Optimal}}}{\text{Cost}_{\text{Optimal}}} \right) \times 100\%" />
            <p>We will get the average percent optimality of all runs/test cases.</p>
            <p>Because Uniform Cost Search solutions always guarantee optimal solutions, any calculation involving values of an optimal solution will use results from Uniform Cost Search runs.</p>
          </section>

          {/* Results */}
          <section id="results">
            <h2>Results and Discussion</h2>
            <figure className="figure">
              <img src={vis} alt="Test" />
              <figcaption>Figure 7. Sample Path from an Average Test Case Batong Malake (PH0403411004) to Western Bicutan (PH1381500018) (Green: GBFS, Pink: Optimal/UCS)</figcaption>
            </figure>
            <div className="table-wrap">
              <table>
                <caption>Table 4. Best Case Results</caption>
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
                    <td>53.33%</td>
                  </tr>
                  <tr>
                    <th scope="row">Percent Optimality</th>
                    <td>100.00%</td>
                    <td>100.00%</td>
                    <td>104.25%</td>
                  </tr>
                  <tr>
                    <th scope="row">Number of Nodes Expanded</th>
                    <td>73.60</td>
                    <td>7.20</td>
                    <td>5.93</td>
                  </tr>
                  <tr>
                    <th scope="row">Runtime (seconds)</th>
                    <td>0.000341</td>
                    <td>0.000048</td>
                    <td>0.000022</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="table-wrap">
              <table>
                <caption>Table 5. Average Results</caption>
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
                    <td>0.00%</td>
                  </tr>
                  <tr>
                    <th scope="row">Percent Optimality</th>
                    <td>100.00%</td>
                    <td>100.00%</td>
                    <td>110.22%</td>
                  </tr>
                  <tr>
                    <th scope="row">Number of Nodes Expanded</th>
                    <td>1365.00</td>
                    <td>183.87</td>
                    <td>30.07</td>
                  </tr>
                  <tr>
                    <th scope="row">Runtime (seconds)</th>
                    <td>0.040964</td>
                    <td>0.000594</td>
                    <td>0.000089</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="table-wrap">
              <table>
                <caption>Table 6. Worst Case Results</caption>
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
                    <td>0.00%</td>
                  </tr>
                  <tr>
                    <th scope="row">Percent Optimality</th>
                    <td>100.00%</td>
                    <td>100.00%</td>
                    <td>118.08%</td>
                  </tr>
                  <tr>
                    <th scope="row">Number of Nodes Expanded</th>
                    <td>7797.40</td>
                    <td>2696.40</td>
                    <td>154.53</td>
                  </tr>
                  <tr>
                    <th scope="row">Runtime (seconds)</th>
                    <td>1.670105</td>
                    <td>0.008008</td>
                    <td>0.000518</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="note">*All test cases were executed with 13th Gen Intel® Core™ i5-13500H, Windows 11, x86_64*</p>

            {/* Figures and Graphs */}
            <figure className="figure">
              <img src={average_best} alt="Bar graph comparing average runtime in seconds across algorithms" />
              <figcaption>Figure 7. Best Case Bar Graph for Average Runtime and Nodes Expanded</figcaption>
            </figure>
            <p>The graph shows that in the best case scenario, the UCS Algorithm yielded the highest in nodes expanded, and had the longest runtime while both the A* Search and GBFS had almost the exact same run time and nodes expanded. Since A* Search has a higher optimality rate than GBFS, we can conclude that A* Search Algorithm is more efficient for the best case scenario. </p>
            <figure className="figure">
              <img src={average_avg} alt="Bar graph comparing average runtime in seconds across algorithms" />
              <figcaption>Figure 8. Average Case Bar Graph for Average Runtime and Nodes Expanded</figcaption>
            </figure>
            <p>The graph shows that in the average case scenario, the UCS Algorithm yielded the highest in nodes expanded and had the longest runtime, followed by the A* Search and then GBFS in both run time and nodes expanded. Since A* Search has a faster run time than UCS, we can conclude that A* Search Algorithm is more efficient for the average case scenario.</p>
            <figure className="figure">
              <img src={average_worst} alt="Worst Case Bar Graph for Average Runtime and Nodes Expanded" />
              <figcaption>Figure 9. Worst Case Bar Graph for Average Runtime and Nodes Expanded</figcaption>
            </figure>
      

            <figure className="figure">
              <img src={trend_best} alt="Scatterplot comparing runtime against nodes expanded" />
              <figcaption>Figure 8. Best Case Runtime vs. Nodes Expanded</figcaption>
            </figure>
            <p>The scatterplot and trendline shows that at very small node counts, all three algorithms roughly share the same nodes expanded and runtime. As nodes expanded increase, runtime also increases. UCS has a steeper trendline compared to A* and Greedy, which means that it costs more runtime to process each node. Points for A* and Greedy are also not very consistent with the trendline, so the performance results may vary at very short distances. On the other hand, UCS generally follows the trendline, so its performance is predictable.</p>
            <figure className="figure">
              <img src={trend_avg} alt="Scatterplot comparing runtime against nodes expanded" />
              <figcaption>Figure 8. Average Case Runtime vs. Nodes Expanded</figcaption>
            </figure>
            <p>The scatterplot and trendline still shows the high runtime cost per node of UCS, albeit much steeper than at the worst case. A* search's trendline is much flatter which means the runtime grows slowly per node expanded. It is also observed that the trendline converges at around 100 nodes and starts diverging once the node count goes higher.</p>
            <figure className="figure">
              <img src={trend_worst} alt="Scatterplot comparing runtime against nodes expanded" />
              <figcaption>Figure 8. Worst Case Runtime vs. Nodes Expanded</figcaption>
            </figure>
            <p>The scatterplot and trendline for Worst Case shows a much wider separation between the three algorithms. The runtime growth of A* and Greedy are very similar as expected of informed search algorithms, but Greedy tends to expand fewer nodes. UCS maintains its high trendline slope as with the previous cases, still showing bad scalability in runtime as the nodes it needs to expand increases.</p>
          </section>

          <section>
            <h3>Findings</h3>
            <p>Uniform Cost Search achieved 100% optimality rate, which means that it consistently found optimal solutions across all 15 test cases. However, in terms of average runtime, the algorithm is the slowest despite having an average of 3603.335 nodes expanded. This indicates that Uniform Cost Search algorithm guarantees optimal solutions though would take the longest in terms of runtime.</p>
            
            <p>A* Search achieved 100% optimality rate, which means that it also consistently found optimal solutions across all 15 test cases, while expanding an average of 2422.733 nodes. A* Search achieved an average runtime of 0.008477 seconds. Compared to Uniform Cost Search, the algorithm reduced the average number of expanded nodes and achieved substantially faster execution. This indicates that A* Search demonstrates the effectiveness of heuristic in guiding the search toward the goal while maintaining optimality.</p>

            <p>Greedy Best-First Search achieved the lowest average number of expanded nodes of 109.134 and the fastest average runtime at 0.0004488 seconds. However, it recorded a 20% optimality rate, indicating that a small part of its solutions across the 15 test cases were optimal. The solutions that the algorithm finds are, on average, +-87.24% from the optimal solution. The algorithm is expected to be the fastest because it prioritizes nodes based only on their estimated distance to the goal rather than considering the total path cost. </p>
          </section>

          <section>
            <h3>Future Improvements</h3>
            <p>The dataset, as mentioned by the maintainer, does not exactly contain the real boundary of the barangay and are only polygon estimations, especially that of very small barangays that are currently estimated using triangles. A close to accurate boundary data can help build an adjacency graph much closer to the real barangay boundary data.</p>
          </section>

          {/* Conclusion */}
          <section id="conclusion">
            <h2>Conclusion</h2>
            <p>Across the 15 test cases, the three algorithms showed different tradeoffs in efficiency and optimality.</p>
            <p>Uniform Cost Search and A* search were able to get a 100% optimality rate and always got the optimal path. However, A* search's usage of a heuristic made it much more efficient at handling larger distance paths than Uniform Cost Search who only relied on the actual path cost and blindly explores the graph.</p>
            <p>Greedy Best-First Search was the fastest algorithm of the three, as it greedily explores a single path straight toward the goal. Because of this, it does not try to expand sidewards and so does not guarantee an optimal solution. For the dataset, it only gets the optimal path 20% of the time, and of its solutions, only gets an average of 87.24% away from the optimal path.</p>
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
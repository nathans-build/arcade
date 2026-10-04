# Clue Compass sources

Every fact in `src/data/places-*.ts` names a source id (`src`), and `npm test` fails if a source id is
unknown. The list below is generated from the data: each source, then the facts that cite it.

## How facts were checked (October 3–4, 2026)

- **Checked with web searches** (result excerpts; most live pages are blocked by the sandbox proxy):
  NC state symbols (Chapter 145: cardinal, pine, dogwood, Plott hound, gray squirrel, granite, emerald,
  shad boat, Fraser fir, Venus flytrap); Mount Mitchell 6,684 ft, highest peak east of the Mississippi;
  Cape Hatteras Lighthouse (tallest brick lighthouse in the U.S., moved 2,900 ft in 1999); Jockey's Ridge
  (tallest living sand dune system on the Atlantic coast, Nags Head); Venus flytrap native range around
  Wilmington; the French Broad flows north through Asheville and Biltmore; Biltmore is America's largest
  private home (250 rooms); Reed Gold Mine (Conrad Reed, 1799, 17-lb nugget used as a doorstop);
  Mount Airy "Granite City"; Hiddenite emeralds; Grandfather Mountain's Mile High Swinging Bridge;
  Old Salem (Moravians, 1766); New Bern (Tryon Palace, Neuse and Trent rivers, Pepsi-Cola 1893/1898);
  Wilmington (Cape Fear River, port, Battleship North Carolina); Greensboro sit-ins (Feb 1, 1960);
  Wright brothers (Dec 17, 1903, Kill Devil Hills); Museum of the Cherokee People (renamed from Museum of
  the Cherokee Indian) on the Oconaluftee River, Qualla Boundary; Charlotte largest city, Lake Norman
  largest man-made lake in NC; Raleigh capital, City of Oaks, Neuse River in its northeast part;
  UNC-Chapel Hill first public university to open (1795); Pembroke as the center of the Lumbee Tribe
  (Robeson County, Lumber River); The Lost Colony drama in Manteo and the shad boat from Roanoke Island;
  NC No. 1 in sweet potatoes, Fraser firs in the mountain counties; Chimney Rock (315-ft spire, Lake Lure);
  Appalachian State in Boone; Blackbeard at Ocracoke (1718); Edenton Tea Party (Oct 25, 1774, 51 women);
  NC's three regions and the Fall Line through Raleigh and Fayetteville.
  U.S.: Gateway Arch (630 ft, west bank of the Mississippi); Yellowstone (1872, mostly Wyoming, Old
  Faithful); Santa Fe (1610, oldest state capital); Mount Rushmore (four presidents, Black Hills near
  Keystone); the five-region model (Northeast, Southeast, Midwest, Southwest, West, with state lists);
  Denver Mile High City; state capitals (Sacramento, Austin, Phoenix, Denver, Salt Lake City, Nashville,
  Atlanta, Boston, Richmond, Columbia); Space Needle (1962 World's Fair); Golden Gate Bridge (1937);
  Grand Canyon (Colorado River, about a mile deep); Great Salt Lake (largest saltwater lake in the
  Western Hemisphere); Everglades (alligators and crocodiles together); New Orleans (birthplace of jazz,
  near the mouth of the Mississippi); Chicago on Lake Michigan, Willis Tower 110 floors; Statue of
  Liberty (gift from France, New York Harbor); Boston's Freedom Trail (16 sites); Nashville Music City
  and the Grand Ole Opry; Austin's Congress Avenue bridge bats (about 1.5 million); Phoenix and saguaros
  in the Sonoran Desert; Atlanta capital since 1868; gold at Sutter's Mill near Sacramento (1848).
  World: Asia largest and Australia smallest continent; Pacific largest and Arctic smallest ocean; the
  Sahara; wild giant pandas only in China; llamas in the Andes; kangaroos in Australia; polar bears in
  the Arctic; bison as the U.S. national mammal; Ottawa, Mexico City (on Tenochtitlan), London and Big
  Ben (the bell) by the Thames, Cairo on the Nile by the pyramids of Giza, Tokyo and Mount Fuji, the
  Sydney Opera House.
- **General knowledge, cited to an overview source** (please spot-check): the Eiffel Tower is in
  Paris (Europe), the Great Wall is in China (Asia), the pyramids are in Egypt (Africa), the Amazon River
  is in South America, emperor penguins live in Antarctica, the Indian Ocean lies between Africa and
  Australia, the Southern Ocean surrounds Antarctica, the Atlantic touches North Carolina, Seattle and San
  Francisco are on the Pacific side and New York and Boston on the Atlantic side, Washington, D.C. is the
  U.S. capital, and Virginia/South Carolina/Georgia/Tennessee border NC on the north/south/southwest/west.
- **Coordinates** are rounded Wikipedia/GeoNames values. `npm test` checks each pin against its state's
  bounding box, the NC outline and region lines, the U.S. outline (not in a lake), and the right
  continent (or open water for oceans) on the world map.
- **Compass Corners** (the kindergarten town) is made up; its helpers and places follow the community
  helper items in the kit's kindergarten social studies bank.

### Grades 6–12 (October 4, 2026)

- **Checked with web searches:**
  - *Grade 6:* the Indus drains into the Arabian Sea near Karachi; the Tigris and Euphrates join as the
    Shatt al-Arab and empty into the Persian Gulf; the Huang He flows into the Bohai Sea and is named for
    its loess silt; the Congo is the only major river to cross the equator twice and empties into the
    Atlantic; the Atacama is the driest non-polar desert; the Andes are the longest continental range;
    Kilimanjaro (5,895 m, Tanzania) is Africa's highest point.
  - *Grade 7:* Brazil is the largest coffee producer and exporter; Kenya is the largest black-tea
    exporter; Australia is the largest iron-ore exporter (about 53% in 2024); Chile has been the top
    copper producer since 1983; Nigeria's main export is crude oil.
  - *Grade 8:* 2020 Census populations (Charlotte 874,579; Raleigh 467,665; Greensboro 299,035; Durham
    283,506; Winston-Salem 249,545; Fayetteville 208,501; New York 8,804,190; Los Angeles 3,898,747;
    Chicago 2,746,388; Houston 2,304,580; Phoenix 1,608,139); NC's deepwater ports at Wilmington and
    Morehead City; Research Triangle Park (the largest U.S. research park, mostly in Durham County); High
    Point Market (the world's largest home-furnishings trade show); Charlotte as the second-largest U.S.
    banking center and a giant American Airlines hub; the Port of Los Angeles as the busiest U.S. container
    port (2024); Port Houston first in foreign tonnage (2024); Pittsburgh (Allegheny + Monongahela = Ohio;
    the Steel City); Detroit's Ambassador Bridge (about a quarter of U.S.–Canada trade).
  - *Grades 9–12:* UN World Urbanization Prospects 2025 (Jakarta 41.9 million, Dhaka 36.6 million, Tokyo
    33.4 million; the UN's new satellite-based city definition is why Tokyo is no longer first); India
    passed China as the most populous country in 2023 (about 1.43 billion); Nigeria about 228 million
    (2023), Africa's most populous; UTC offsets and DST rules: Nepal UTC+5:45 (since 1986), India UTC+5:30,
    Mexico abolished DST in October 2022 (UTC−6), Turkey on UTC+3 since 2016, Russia on UTC+3 since 2014,
    Kenya and Saudi Arabia UTC+3 with no DST, Mongolia UTC+8, Iceland UTC+0 all year; plate boundaries
    (Iceland on the divergent Mid-Atlantic Ridge, San Andreas transform, India–Eurasia collision, Nazca
    subduction under South America, the Japan and Java subduction zones, the North Anatolian Fault near
    Istanbul, the East African Rift as a divergent boundary); climates: Lima hot desert (BWh), Cape Town
    Mediterranean (Csb), Singapore tropical rain forest (Af), Ulaanbaatar the coldest national capital,
    Quito subtropical highland near the equator; Shanghai the busiest container port since 2010;
    Rotterdam Europe's largest port.
- **General knowledge, cited to an overview source** (please spot-check): capitals, main languages,
  currencies and flag descriptions (CIA World Factbook fields); the Nile flowing north to the
  Mediterranean; the Danube through four capitals to the Black Sea; the Ganges to the Bay of Bengal; Mont
  Blanc, Everest (8,849 m), the Urals as part of the Europe–Asia boundary, the Continental Divide in the
  Rockies, Uluru; Japan about 124 million and shrinking (2023); Singapore 100% urban, about 6 million
  (2023), 2nd-busiest container port (2024); geothermal home heating in Iceland; monthly temperatures in
  the climate-graph clues (rounded from each city's Wikipedia climate table); Germany's and Japan's top
  export (cars), Peru's (copper), Saudi Arabia's (crude oil); Savannah's Garden City Terminal; Chicago as
  the biggest rail hub; Atlanta's airport as the world's busiest by passengers; Hollywood; Silicon Valley.
- **Latitude/longitude clues** are generated from each pin (whole degrees), so they always match the pin.
  `npm test` also checks every world pin against its country's bounding box and continent outline, that
  each UTC offset fits the longitude (within 2 hours of longitude ÷ 15), that winter-rain climate graphs
  (June–August) are south of the equator, and that hemisphere facts match the latitude.
- **Dated figures:** populations are rounded and dated in the clue itself, e.g. "about 42 million (2025)".

## Report a fact

If a fact looks wrong, fix it in `src/data/places-*.ts` (and its source here), then run `npm test`:
the tests re-check that every case is still solvable and that no wrong destination fits the clues.

## Sources and the facts that cite them

- **town** — Compass Corners is a made-up town; helper jobs follow the NC kindergarten community-helper items (kit social bank, K.E.1 / K.C&G.1)
  - Facts: the School: teacher; the School: school bus; the School: ABC; the Library: librarian; the Library: books; the Library: Shh!; the Fire Station: firefighter; the Fire Station: fire truck; the Fire Station: wee-oo; the Park: park worker; the Park: slide; the Park: wheee; the Bakery: baker; the Bakery: bread; the Bakery: ding; the Post Office: mail carrier; the Post Office: letters; the Post Office: stamp; the Grocery Store: cashier; the Grocery Store: shopping cart; the Grocery Store: beep; the Farm: farmer; the Farm: tractor; the Farm: moo; the Police Station: police officer; the Police Station: police car; the Police Station: tweet; the Doctor's Office: doctor; the Doctor's Office: bandage; the Doctor's Office: ahh
- **coords** — Coordinates: Wikipedia / GeoNames values for each place, rounded (checked by the bounding-box tests) <https://www.geonames.org/>
  - Facts: Seattle: Pacific Ocean; San Francisco: Pacific Ocean; New York City: Atlantic Ocean; Boston: Atlantic Ocean; Los Angeles: Pacific Ocean
- **nc-symbols** — NC General Statutes, Chapter 145 (State Symbols and Other Official Adoptions) <https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/ByChapter/Chapter_145.html>
  - Facts: Mount Airy: granite
- **nc-regions** — NCpedia, Our State Geography in a Snap: Three Regions Overview <https://www.ncpedia.org/our-state-geography-snap-three>
  - Facts: Asheville: Mountains; Asheville: snowy winters; Boone: Mountains; Boone: snowy winters; Mount Mitchell: Mountains; Mount Mitchell: snowy winters; Grandfather Mountain: Mountains; Grandfather Mountain: snowy winters; Chimney Rock: Mountains; Cherokee: Mountains; Mount Airy: Piedmont; Hiddenite: Piedmont; Charlotte: Piedmont; Reed Gold Mine: Piedmont; Winston-Salem: Piedmont; Greensboro: Piedmont; Chapel Hill: Piedmont; Raleigh: Piedmont; Wilmington: Coastal Plain; Wilmington: hurricanes; New Bern: Coastal Plain; Pembroke: Coastal Plain; Edenton: Coastal Plain; Kill Devil Hills: Coastal Plain; Kill Devil Hills: hurricanes; Nags Head: Coastal Plain; Nags Head: hurricanes; Cape Hatteras: Coastal Plain; Cape Hatteras: hurricanes; Manteo: Coastal Plain; Manteo: hurricanes; Ocracoke: Coastal Plain; Ocracoke: hurricanes; Durham: Piedmont; High Point: Piedmont; Fayetteville: Coastal Plain; Morehead City: Coastal Plain; Morehead City: hurricanes
- **nc-geo** — Geography of North Carolina (Wikipedia): Fall Line through Raleigh and Fayetteville; Outer Banks <https://en.wikipedia.org/wiki/Geography_of_North_Carolina>
  - Facts: Edenton: Albemarle Sound; Kill Devil Hills: barrier island; Nags Head: barrier island; Cape Hatteras: barrier island; Ocracoke: barrier island
- **mitchell** — Mount Mitchell (Wikipedia); NWS Greenville-Spartanburg: 6,684 ft, highest point east of the Mississippi <https://en.wikipedia.org/wiki/Mount_Mitchell>
  - Facts: Mount Mitchell: highest mountain; Mount Mitchell: highest peak east of the Mississippi
- **hatteras** — Cape Hatteras Lighthouse (Outer Banks Visitors Bureau; NC Anchor: Moving Cape Hatteras) <https://www.outerbanks.org/things-to-do/museums-and-historic-sites/lighthouses/cape-hatteras-lighthouse/>
  - Facts: Cape Hatteras: lighthouse; Cape Hatteras: Cape Hatteras Lighthouse
- **jockeys** — Jockey's Ridge State Park (NC State Parks) <https://www.ncparks.gov/state-parks/jockeys-ridge-state-park>
  - Facts: Nags Head: Jockey's Ridge
- **flytrap** — Venus flytraps: Homegrown North Carolina wonders (NC Dept. of Agriculture) <https://blog.ncagr.gov/2023/11/08/venus-flytraps-homegrown-north-carolina-wonders/>
  - Facts: Wilmington: Venus flytrap
- **frenchbroad** — French Broad River Facts (RiverLink); Explore Asheville <https://riverlink.org/french-broad-river/>
  - Facts: Asheville: French Broad River
- **biltmore** — Explore Asheville / Biltmore: America's largest private home <https://www.exploreasheville.com/article/french-broad-river-asheville-adventures-third-oldest-river-world>
  - Facts: Asheville: Biltmore
- **reed** — Reed Gold Mine (Wikipedia; NCpedia: Gold Rush) <https://en.wikipedia.org/wiki/Reed_Gold_Mine>
  - Facts: Reed Gold Mine: first gold find
- **mtairy** — Mount Airy, "Granite City" (NC Dept. of Natural and Cultural Resources) <https://www.dncr.nc.gov/blog/2016/05/14/mount-airy-granite-city>
- **hiddenite** — Emerald Hollow Mine, Hiddenite (Visit NC); Hiddenite Gem Mines (Wikipedia) <https://www.visitnc.com/emerald-hollow-mine>
  - Facts: Hiddenite: emerald
- **grandfather** — Mile High Swinging Bridge (Grandfather Mountain) <https://grandfather.com/mile-high-swinging-bridge-2/>
  - Facts: Grandfather Mountain: Mile High Swinging Bridge
- **oldsalem** — Old Salem (Wikipedia): Moravian town founded 1766 <https://en.wikipedia.org/wiki/Old_Salem>
  - Facts: Winston-Salem: Moravian town
- **newbern** — New Bern, North Carolina (Wikipedia); Tryon Palace <https://en.wikipedia.org/wiki/New_Bern,_North_Carolina>
  - Facts: New Bern: Neuse and Trent rivers; New Bern: Tryon Palace; New Bern: Pepsi
- **wilmington** — Wilmington, North Carolina (Wikipedia): Port of Wilmington, Battleship North Carolina <https://en.wikipedia.org/wiki/Wilmington,_North_Carolina>
  - Facts: Wilmington: big ships; Wilmington: Cape Fear River; Wilmington: Battleship North Carolina
- **sitin** — Greensboro sit-ins (Wikipedia); International Civil Rights Center and Museum <https://en.wikipedia.org/wiki/Greensboro_sit-ins>
  - Facts: Greensboro: 1960 sit-in
- **wright** — Wright Brothers National Memorial (National Park Service) <https://www.nps.gov/wrbr/>
  - Facts: Kill Devil Hills: first airplane; Kill Devil Hills: first flight
- **cherokee** — Museum of the Cherokee People (NCpedia); Cherokee, North Carolina (Wikipedia) <https://www.ncpedia.org/museum-cherokee-indian>
  - Facts: Cherokee: Eastern Band of Cherokee Indians; Cherokee: Oconaluftee River
- **charlotte** — Charlotte, North Carolina (Wikipedia): largest city; Lake Norman (Wikipedia) <https://en.wikipedia.org/wiki/Charlotte,_North_Carolina>
  - Facts: Charlotte: biggest city; Charlotte: largest city; Charlotte: Lake Norman
- **raleigh** — Raleigh, North Carolina (Wikipedia; WorldAtlas): capital, City of Oaks, Neuse River <https://en.wikipedia.org/wiki/Raleigh,_North_Carolina>
  - Facts: Raleigh: capital star; Raleigh: capital of North Carolina; Raleigh: Neuse River
- **unc** — UNC-Chapel Hill History and Traditions: first public university to open (1795) <https://www.unc.edu/about/history-and-traditions/>
  - Facts: Chapel Hill: first public university
- **lumbee** — Lumbee Tribe (NC DNCR marker I-96); Lumbee Tribe of North Carolina (Wikipedia) <https://www.dncr.nc.gov/blog/2024/01/03/lumbee-tribe-i-96>
  - Facts: Pembroke: Lumbee Tribe; Pembroke: Lumber River
- **manteo** — The Lost Colony outdoor drama (Visit NC); Shad boat (NC DNCR: G. W. Creef and the Shad Boat) <https://www.visitnc.com/lost-colony>
  - Facts: Manteo: The Lost Colony; Manteo: shad boat
- **ncfarm** — NC Dept. of Agriculture: No. 1 in sweet potatoes; Fraser fir Christmas trees in the mountains <https://blog.ncagr.gov/2021/11/23/christmas-trees-and-the-thanksgiving-meal-north-carolina-agriculture-is-front-and-center-during-the-holidays/>
  - Facts: Boone: Fraser fir
- **chimney** — Chimney Rock State Park (NC State Parks) <https://www.ncparks.gov/state-parks/chimney-rock-state-park>
  - Facts: Chimney Rock: rock spire
- **boone** — Appalachian State University in Boone (Explore Boone) <https://www.exploreboone.com/about/local-communities/appalachian-state-university/>
  - Facts: Boone: Appalachian State University
- **ocracoke** — Ocracoke, North Carolina (Wikipedia): Blackbeard (1718), lighthouse (1823) <https://en.wikipedia.org/wiki/Ocracoke,_North_Carolina>
  - Facts: Ocracoke: Blackbeard
- **edenton** — The Edenton Tea Party (NC DNCR) <https://www.dncr.nc.gov/edenton-tea-party>
  - Facts: Edenton: Edenton Tea Party
- **ncneighbors** — Geography of North Carolina (Wikipedia): borders Virginia, Tennessee, Georgia, South Carolina <https://en.wikipedia.org/wiki/North_Carolina>
  - Facts: Nashville: west; Atlanta: southwest; Richmond: north; Columbia: south; Raleigh: home state
- **regions** — Ducksters, United States Geography: Regions (five-region model used in NC grade 5) <https://www.ducksters.com/geography/us_states/us_geographical_regions.php>
  - Facts: Seattle: West; San Francisco: West; Sacramento: West; Denver: West; Salt Lake City: West; Yellowstone: West; the Grand Canyon: Southwest; Phoenix: Southwest; Santa Fe: Southwest; Austin: Southwest; Mount Rushmore: Midwest; St. Louis: Midwest; Chicago: Midwest; New Orleans: Southeast; Nashville: Southeast; Atlanta: Southeast; the Everglades: Southeast; Richmond: Southeast; Columbia: Southeast; Raleigh: Southeast; New York City: Northeast; Boston: Northeast; Los Angeles: West; Houston: Southwest; Savannah: Southeast; Detroit: Midwest; Pittsburgh: Northeast
- **capitals** — List of U.S. state capitals (Simple English Wikipedia) <https://simple.wikipedia.org/wiki/List_of_U.S._state_capitals>
  - Facts: Sacramento: California; Denver: Colorado; Salt Lake City: Utah; Phoenix: Arizona; Santa Fe: New Mexico; Austin: Texas; Nashville: Tennessee; Atlanta: Georgia; Richmond: Virginia; Columbia: South Carolina; Raleigh: North Carolina; Boston: Massachusetts
- **arch** — Gateway Arch Fact Sheet <https://www.gatewayarch.com/about/media-press/gateway-arch-fact-sheet/>
  - Facts: St. Louis: Mississippi River; St. Louis: Gateway Arch
- **yellowstone** — Yellowstone National Park (Travel Wyoming); NARA: The First National Park <https://travelwyoming.com/places-to-go/destinations/national-parks-monuments/yellowstone-national-park/>
  - Facts: Yellowstone: Old Faithful; Yellowstone: first national park
- **santafe** — Santa Fe, New Mexico (National Park Service): oldest state capital (1610) <https://www.nps.gov/places/santa-fe-new-mexico.htm>
  - Facts: Santa Fe: oldest state capital
- **rushmore** — Mount Rushmore (Travel South Dakota) <https://www.travelsouthdakota.com/iconic-landmarks/mount-rushmore>
  - Facts: Mount Rushmore: Mount Rushmore; Mount Rushmore: Black Hills
- **denver** — Visit Denver: Mile High markers <https://visitdenver.com/blog/post/only-in-denver-mile-high-markers/>
  - Facts: Denver: Rocky Mountains; Denver: Mile High City
- **spaceneedle** — About the Space Needle (1962 World's Fair) <https://www.spaceneedle.com/about>
  - Facts: Seattle: Space Needle
- **goldengate** — Golden Gate Bridge, San Francisco (opened 1937) <https://en.wikipedia.org/wiki/Golden_Gate_Bridge>
  - Facts: San Francisco: Golden Gate Bridge
- **grandcanyon** — Grand Canyon National Park (National Park Service) <https://www.nps.gov/grca/>
  - Facts: the Grand Canyon: Colorado River
- **saltlake** — Great Salt Lake (Utah Dept. of Environmental Quality; Visit Utah) <https://deq.utah.gov/dwq/great-salt-lake>
  - Facts: Salt Lake City: Great Salt Lake
- **everglades** — Crocodiles and Alligators Living Together (Smithsonian National Postal Museum) <https://postalmuseum.si.edu/exhibition/president-truman-dedicates-everglades-national-park/crocodiles-and-alligators-living>
  - Facts: the Everglades: alligators and crocodiles
- **neworleans** — History of Jazz Music: Birthplace New Orleans (Explore Louisiana) <https://www.explorelouisiana.com/articles/history-jazz-music-birthplace-new-orleans>
  - Facts: New Orleans: Mississippi River; New Orleans: jazz
- **chicago** — Chicago skyline on Lake Michigan; Willis Tower (360 Chicago) <https://360chicago.com/articles/willis-tower>
  - Facts: Chicago: Lake Michigan; Chicago: Willis Tower
- **liberty** — Statue of Liberty (National Geographic Kids; History.com) <https://kids.nationalgeographic.com/history/article/statue-of-liberty>
  - Facts: New York City: Statue of Liberty
- **freedomtrail** — Walk the Freedom Trail (National Park Service) <https://www.nps.gov/thingstodo/walk-the-freedom-trail.htm>
  - Facts: Boston: Freedom Trail
- **nashville** — Grand Ole Opry: About (Music City) <https://www.opry.com/about>
  - Facts: Nashville: country music
- **austin** — Bat City (Bat Conservation International) <https://www.batcon.org/bat-city/>
  - Facts: Austin: bats
- **phoenix** — Saguaro Cactus Photo Spots in Phoenix (Visit Phoenix) <https://www.visitphoenix.com/sonoran-desert/saguaro-cactus/>
  - Facts: Phoenix: Sonoran Desert
- **sacramento** — Sutter's Mill (Britannica): gold found 1848 near Sacramento <https://www.britannica.com/place/Sutters-Mill>
  - Facts: Sacramento: gold rush
- **dc** — Washington, D.C. (kit grade 2 bank: capital of the United States; White House) <https://en.wikipedia.org/wiki/Washington,_D.C.>
  - Facts: Washington, D.C.: the United States; Washington, D.C.: White House; Washington, D.C.: the United States
- **continents** — Continents of the World (WorldAtlas): Asia largest, Australia smallest <https://www.worldatlas.com/continents>
  - Facts: North America: continent; North America: our continent; South America: continent; South America: Amazon River; Europe: continent; Europe: Eiffel Tower; Africa: continent; Asia: continent; Asia: largest continent; Asia: Great Wall; Australia: continent; Australia: smallest continent; Antarctica: continent; Washington, D.C.: North America; Ottawa: North America; Mexico City: North America; London: Europe; Cairo: Africa; Tokyo: Asia; Sydney: Australia; the Nile Valley: Africa; the Tigris–Euphrates Valley: Asia; the Indus Valley: Asia; the Huang He Valley: Asia; the Ganges Plain: Asia; the Congo Basin: Africa; the Sahara: Northern; the Sahara: Africa; the Kalahari: Southern; the Kalahari: Africa; Mount Kilimanjaro: Southern; Mount Kilimanjaro: Africa; the Himalayas: Northern; the Himalayas: Asia; the Gobi Desert: Northern; the Gobi Desert: Asia; the Alps: Northern; the Alps: Europe; the Danube: Europe; the Ural Mountains: Europe; the Amazon Rain Forest: South America; the Andes: Southern; the Andes: South America; the Atacama Desert: Southern; the Atacama Desert: South America; the Rocky Mountains: Northern; the Rocky Mountains: North America; the Mississippi River: North America; the Australian Outback: Southern; the Australian Outback: Australia; Paris: Europe; Berlin: Europe; Madrid: Europe; Rome: Europe; Dublin: Europe; Moscow: Europe; Rotterdam: Europe; Istanbul: Europe; Reykjavík: Europe; Nairobi: Africa; Abuja: Africa; Lagos: Africa; Cape Town: Africa; Riyadh: Asia; New Delhi: Asia; Kathmandu: Asia; Dhaka: Asia; Ulaanbaatar: Asia; Beijing: Asia; Shanghai: Asia; Seoul: Asia; Singapore: Asia; Jakarta: Asia; Canberra: Australia; Perth: Australia; Brasília: South America; Buenos Aires: South America; Lima: South America; Santiago: South America; Bogotá: South America; Quito: South America; San Francisco: North America
- **oceans** — The World's Five Great Oceans: Pacific largest, Arctic smallest <https://www.whatarethe7continents.com/the-worlds-five-great-oceans/>
  - Facts: the Pacific Ocean: ocean; the Pacific Ocean: largest ocean; the Atlantic Ocean: ocean; the Atlantic Ocean: touches North Carolina; the Indian Ocean: ocean; the Indian Ocean: Africa and Australia; the Arctic Ocean: ocean; the Arctic Ocean: smallest ocean; the Southern Ocean: ocean; the Southern Ocean: Antarctica
- **sahara** — The Sahara: Earth's largest hot desert (Live Science) <https://www.livescience.com/23140-sahara-desert.html>
  - Facts: Africa: Sahara; the Sahara: the largest hot desert; the Sahara: desert
- **panda** — Giant panda (Smithsonian's National Zoo): wild only in China <https://nationalzoo.si.edu/animals/giant-panda>
  - Facts: Asia: giant panda
- **kangaroo** — Kangaroos: Facts (Live Science) <https://www.livescience.com/27400-kangaroos.html>
  - Facts: Australia: kangaroo
- **llama** — Llama (National Geographic): domesticated in the Andes <https://www.nationalgeographic.com/animals/mammals/facts/llama-1>
  - Facts: South America: llama
- **polarbear** — Polar Bear (WWF): lives in the Arctic <https://www.worldwildlife.org/species/polar-bear/>
  - Facts: the Arctic Ocean: polar bear
- **bison** — American Bison - National Mammal (State Symbols USA) <https://statesymbolsusa.org/symbol-official-item/national-us/mammals/bison>
  - Facts: North America: bison
- **penguin** — Emperor penguins in Antarctica (Sahara/Antarctic deserts, Live Science) <https://www.livescience.com/23140-sahara-desert.html>
  - Facts: Antarctica: emperor penguin; Antarctica: icy cold
- **ottawa** — Ottawa (Britannica): capital of Canada <https://www.britannica.com/place/Ottawa>
  - Facts: Ottawa: Canada; Ottawa: north
- **mexicocity** — Mexico City: capital of Mexico, built on Tenochtitlan (GeoFunGames North America capitals) <https://www.geofungames.com/learn/capitals/north-america>
  - Facts: Mexico City: Mexico; Mexico City: south
- **london** — Big Ben in London (Visit London): the Great Bell, by the River Thames <https://www.visitlondon.com/things-to-do/sightseeing/london-attraction/big-ben>
  - Facts: London: Big Ben; London: River Thames
- **cairo** — Cairo (Britannica): on the Nile, pyramids of Giza <https://www.britannica.com/place/Cairo>
  - Facts: Africa: pyramids; Cairo: Nile River; Cairo: pyramids of Giza
- **tokyo** — Mount Fuji about 100 km from Tokyo, Japan's capital <https://bokksu.com/blogs/news/where-is-mount-fuji>
  - Facts: Tokyo: Japan; Tokyo: Mount Fuji
- **sydney** — Sydney Opera House (UNESCO World Heritage Centre) <https://whc.unesco.org/en/list/166/>
  - Facts: Sydney: Sydney Opera House
- **countries** — Present-day countries of each landform pin (Britannica country articles; pins checked against country boxes in npm test) <https://www.britannica.com/topic/list-of-countries-1993160>
  - Facts: the Nile Valley: Egypt; the Tigris–Euphrates Valley: Iraq; the Indus Valley: Pakistan; the Huang He Valley: China; the Ganges Plain: India; the Congo Basin: the Democratic Republic of the Congo; the Sahara: Algeria; the Kalahari: Botswana; Mount Kilimanjaro: Tanzania; the Himalayas: Nepal; the Gobi Desert: Mongolia; the Alps: Switzerland; the Danube: Hungary; the Ural Mountains: Russia; the Amazon Rain Forest: Brazil; the Andes: Peru; the Atacama Desert: Chile; the Rocky Mountains: the United States; the Mississippi River: the United States; the Australian Outback: Australia
- **nile** — Nile River (Britannica): flows north through Egypt to a delta on the Mediterranean; ancient Egypt <https://www.britannica.com/place/Nile-River>
  - Facts: the Nile Valley: river valley; the Nile Valley: north; the Nile Valley: Mediterranean Sea; the Nile Valley: ancient Egypt
- **tigris** — Shatt al-Arab (Wikipedia): Tigris and Euphrates join at al-Qurnah, Iraq, and empty into the Persian Gulf; Sumer (Britannica) <https://en.wikipedia.org/wiki/Shatt_al-Arab>
  - Facts: the Tigris–Euphrates Valley: river valley; the Tigris–Euphrates Valley: Persian Gulf; the Tigris–Euphrates Valley: southeast; the Tigris–Euphrates Valley: Sumer
- **indus** — Indus River (WorldAtlas; Britannica): drains into the Arabian Sea through a delta near Karachi; Harappan civilization <https://www.worldatlas.com/rivers/indus-river.html>
  - Facts: the Indus Valley: river valley; the Indus Valley: Arabian Sea; the Indus Valley: south; the Indus Valley: the Harappan cities
- **huanghe** — Yellow River (Wikipedia): flows into the Bohai Sea; named for loess silt; Shang dynasty <https://en.wikipedia.org/wiki/Yellow_River>
  - Facts: the Huang He Valley: river valley; the Huang He Valley: Bohai Sea; the Huang He Valley: Yellow River; the Huang He Valley: early Chinese dynasties
- **ganges** — Ganges River (Britannica): flows east across northern India to the Bay of Bengal <https://www.britannica.com/place/Ganges-River>
  - Facts: the Ganges Plain: river valley; the Ganges Plain: Bay of Bengal
- **congo** — Congo River (Live Science): the only major river to cross the equator twice, empties into the Atlantic <https://www.livescience.com/congo-river.html>
  - Facts: the Congo Basin: a river that crosses the equator twice; the Congo Basin: rain forest; the Congo Basin: Atlantic Ocean
- **kalahari** — Kalahari (Britannica): red-sand semi-desert covering most of Botswana <https://www.britannica.com/place/Kalahari>
  - Facts: the Kalahari: a red-sand desert in southern Africa; the Kalahari: desert
- **kilimanjaro** — Mount Kilimanjaro (Britannica Kids): highest point in Africa, 5,895 m, northeastern Tanzania <https://kids.britannica.com/kids/article/Mount-Kilimanjaro/353338>
  - Facts: Mount Kilimanjaro: Africa's highest mountain; Mount Kilimanjaro: volcano
- **himalaya** — Mount Everest (Britannica): 8,849 m, on the Nepal–China border, highest peak on Earth <https://www.britannica.com/place/Mount-Everest>
  - Facts: the Himalayas: the highest mountains on Earth; the Himalayas: mountain range
- **gobi** — Gobi (Britannica): cold desert of Mongolia and China with very cold winters <https://www.britannica.com/place/Gobi>
  - Facts: the Gobi Desert: a cold desert with icy winters; the Gobi Desert: desert
- **alps** — Mont Blanc (Britannica): highest peak of the Alps and of Western Europe <https://www.britannica.com/place/Mont-Blanc-mountain-Europe>
  - Facts: the Alps: Mont Blanc; the Alps: mountain range
- **danube** — Danube River (Britannica): flows to the Black Sea through Vienna, Bratislava, Budapest and Belgrade <https://www.britannica.com/place/Danube-River>
  - Facts: the Danube: a river through four capitals; the Danube: river valley; the Danube: Black Sea
- **urals** — Ural Mountains (Britannica): part of the conventional Europe–Asia boundary, in Russia <https://www.britannica.com/place/Ural-Mountains>
  - Facts: the Ural Mountains: the Europe–Asia boundary; the Ural Mountains: mountain range
- **amazon** — Amazon Rainforest (Britannica): largest tropical rain forest; the Amazon River empties into the Atlantic <https://www.britannica.com/place/Amazon-Rainforest>
  - Facts: the Amazon Rain Forest: the largest rain forest; the Amazon Rain Forest: rain forest; the Amazon Rain Forest: Atlantic Ocean
- **andes** — Andes (Britannica Kids; Guinness World Records): longest continental mountain range, about 7,000 km <https://www.guinnessworldrecords.com/world-records/longest-continental-mountain-range>
  - Facts: the Andes: the longest range on a continent; the Andes: mountain range
- **atacama** — Atacama Desert (Wikipedia): driest non-polar desert in the world, northern Chile <https://en.wikipedia.org/wiki/Atacama_Desert>
  - Facts: the Atacama Desert: the driest nonpolar desert; the Atacama Desert: desert
- **rockies** — Continental Divide (National Park Service, Rocky Mountain National Park) <https://www.nps.gov/romo/learn/nature/continental-divide.htm>
  - Facts: the Rocky Mountains: the Continental Divide; the Rocky Mountains: mountain range
- **mississippi** — Mississippi River (Britannica): flows south to the Gulf of Mexico <https://www.britannica.com/place/Mississippi-River>
  - Facts: the Mississippi River: river valley; the Mississippi River: Gulf of Mexico; the Mississippi River: south
- **outback** — Uluru-Kata Tjuta National Park (UNESCO World Heritage Centre): sandstone monolith sacred to the Anangu <https://whc.unesco.org/en/list/447/>
  - Facts: the Australian Outback: Uluru; the Australian Outback: desert
- **capitals-world** — Capital cities of the world (CIA World Factbook, Government: capital) <https://www.cia.gov/the-world-factbook/field/capital/>
  - Facts: Paris: France; Berlin: Germany; Madrid: Spain; Rome: Italy; Dublin: Ireland; Moscow: Russia; Nairobi: Kenya; Abuja: Nigeria; Riyadh: Saudi Arabia; New Delhi: India; Beijing: China; Seoul: South Korea; Jakarta: Indonesia; Canberra: Australia; Brasília: Brazil; Buenos Aires: Argentina; Lima: Peru; Santiago: Chile; Bogotá: Colombia
- **languages** — Languages of each country (CIA World Factbook, People and Society: languages) <https://www.cia.gov/the-world-factbook/field/languages/>
  - Facts: Washington, D.C.: English; Ottawa: English and French; Mexico City: Spanish; London: English; Cairo: Arabic; Tokyo: Japanese; Paris: French; Berlin: German; Madrid: Spanish; Rome: Italian; Dublin: English and Irish; Moscow: Russian; Nairobi: Swahili and English; Abuja: English; Riyadh: Arabic; New Delhi: Hindi and English; Beijing: Mandarin Chinese; Seoul: Korean; Jakarta: Indonesian; Canberra: English; Brasília: Portuguese; Buenos Aires: Spanish; Lima: Spanish and Quechua; Santiago: Spanish; Bogotá: Spanish
- **currencies** — Currencies of each country (CIA World Factbook, Economy: exchange rates / currency) <https://www.cia.gov/the-world-factbook/field/exchange-rates/>
  - Facts: Washington, D.C.: U.S. dollar; Ottawa: Canadian dollar; Mexico City: Mexican peso; London: pound sterling; Cairo: Egyptian pound; Tokyo: yen; Paris: euro; Berlin: euro; Madrid: euro; Rome: euro; Dublin: euro; Moscow: ruble; Nairobi: Kenyan shilling; Abuja: naira; Riyadh: riyal; New Delhi: Indian rupee; Beijing: yuan (renminbi); Seoul: won; Jakarta: rupiah; Canberra: Australian dollar; Brasília: real; Buenos Aires: Argentine peso; Lima: sol; Santiago: Chilean peso; Bogotá: Colombian peso
- **flags** — Flag descriptions (CIA World Factbook, Government: flag description) <https://www.cia.gov/the-world-factbook/field/flag-description/>
  - Facts: Washington, D.C.: 13 red and white stripes and 50 stars; Ottawa: a red maple leaf between red stripes; Mexico City: green, white and red stripes with an eagle; London: red and white crosses on blue (the Union Jack); Cairo: red, white and black stripes with a gold eagle; Tokyo: a red disc on white; Paris: blue, white and red vertical stripes; Berlin: black, red and gold horizontal stripes; Madrid: red, yellow and red stripes, the yellow twice as wide; Rome: green, white and red vertical stripes; Dublin: green, white and orange vertical stripes; Moscow: white, blue and red horizontal stripes; Nairobi: black, red and green stripes with a shield and spears; Abuja: green, white and green vertical stripes; Riyadh: white Arabic writing and a sword on green; New Delhi: saffron, white and green stripes with a blue wheel; Beijing: yellow stars on red; Seoul: a red-and-blue circle and four black bars on white; Jakarta: a red stripe over a white stripe; Canberra: the Union Jack and white stars on blue; Brasília: a yellow diamond and a blue globe on green; Buenos Aires: light blue and white stripes with a gold sun; Lima: red, white and red vertical stripes; Santiago: a white star on blue, with white and red stripes; Bogotá: a wide yellow stripe over blue and red
- **exports** — Top exports by country (OEC, Observatory of Economic Complexity): cars for Germany and Japan, natural gas for Russia <https://oec.world/en/profile/country/deu>
  - Facts: Tokyo: a country whose top export is cars; Berlin: a country whose top export is cars; Moscow: a top natural-gas exporter
- **kenya-tea** — Kenya, the world's largest exporter of black tea (Bloomberg, Jan 2026; Tea production in Kenya, Wikipedia) <https://en.wikipedia.org/wiki/Tea_production_in_Kenya>
  - Facts: Nairobi: the top black-tea exporter
- **nigeria** — Nigeria (Wikipedia; World Bank): most populous country in Africa, about 228 million (2023); crude oil the main export; Lagos the main port <https://en.wikipedia.org/wiki/Nigeria>
  - Facts: Abuja: a country whose top export is crude oil; Lagos: a big crude-oil exporter; Lagos: Africa's most populous country
- **saudi** — Saudi Arabia: one of the world's largest crude oil exporters (U.S. EIA country analysis) <https://www.eia.gov/international/analysis/country/SAU>
  - Facts: Riyadh: a big crude-oil exporter; Riyadh: a country whose top export is crude oil
- **coffee** — Brazil is the world's largest coffee producer and exporter (Nature Scientific Reports, 2025); Colombia among top growers (WorldAtlas) <https://www.worldatlas.com/articles/the-world-s-largest-exporters-of-coffee.html>
  - Facts: Brasília: the top coffee grower; Bogotá: a famous coffee grower
- **peru-copper** — Peru: copper is the top export (U.S. International Trade Administration, Peru mining) <https://www.trade.gov/country-commercial-guides/peru-mining-and-minerals>
  - Facts: Lima: a country whose top export is copper
- **chile-copper** — Copper mining in Chile (Wikipedia): world's largest copper producer every year since 1983 <https://en.wikipedia.org/wiki/Copper_mining_in_Chile>
  - Facts: Santiago: the top copper producer; Santiago: a country whose top export is copper
- **australia-iron** — Iron ore (Minerals Council of Australia): world's largest iron ore exporter, about 53% of the market (2024) <https://minerals.org.au/about/mining-facts/iron-ore-2/>
  - Facts: Canberra: the top iron-ore exporter; Perth: the top iron-ore exporter
- **nc-census** — 2020 Census, North Carolina population by municipality (NC General Assembly): Charlotte 874,579; Raleigh 467,665; Greensboro 299,035; Durham 283,506; Winston-Salem 249,545; Fayetteville 208,501 <https://www.ncleg.gov/Files/GIS/Base_Data/2021/Reports/PL94_171_2020_PlacePop.pdf>
  - Facts: Charlotte: NC's largest city; Winston-Salem: NC's 5th-largest city; Greensboro: NC's 3rd-largest city; Raleigh: NC's 2nd-largest city; Durham: NC's 4th-largest city; Fayetteville: NC's 6th-largest city
- **us-census** — 2020 Census, biggest U.S. cities: New York 8,804,190; Los Angeles 3,898,747; Chicago 2,746,388; Houston 2,304,580; Phoenix 1,608,139 <https://www.biggestuscities.com/2020>
  - Facts: Phoenix: the 5th-largest U.S. city; Chicago: the 3rd-largest U.S. city; New York City: the largest U.S. city; Los Angeles: the 2nd-largest U.S. city; Houston: the 4th-largest U.S. city
- **nc-highways** — Interstate Highways in North Carolina (NCDOT; Wikipedia: I-40, I-85, I-95, I-77, I-26) <https://en.wikipedia.org/wiki/List_of_Interstate_Highways_in_North_Carolina>
  - Facts: Asheville: I-26; Asheville: I-40; Charlotte: I-85; Charlotte: I-77; Winston-Salem: I-40; Greensboro: I-40; Greensboro: I-85; Raleigh: I-40; Wilmington: I-40; Durham: I-85; Durham: I-40; Fayetteville: I-95
- **ncports** — North Carolina State Ports Authority (Wikipedia; NC Ports): deepwater ports at Wilmington and Morehead City (Beaufort Inlet) <https://en.wikipedia.org/wiki/North_Carolina_State_Ports_Authority>
  - Facts: Wilmington: a deepwater port; Morehead City: a deepwater port; Morehead City: Beaufort Inlet
- **rtp** — Research Triangle Park (Wikipedia): largest research park in the U.S., mostly in Durham County <https://en.wikipedia.org/wiki/Research_Triangle_Park>
  - Facts: Durham: research
- **highpoint** — High Point Market (Wikipedia): the world's largest home furnishings trade show, April and October <https://en.wikipedia.org/wiki/High_Point_Market>
  - Facts: High Point: furniture
- **fayetteville** — Fayetteville, North Carolina (Wikipedia): next to Fort Bragg, one of the largest U.S. military installations <https://en.wikipedia.org/wiki/Fayetteville,_North_Carolina>
  - Facts: Fayetteville: Army base
- **charlotte-bank** — Charlotte as a major U.S. banking center (North Carolina History Project): second only to New York <https://northcarolinahistory.org/wp-content/uploads/2025/09/HS30-CharlotteBanking-v2.pdf>
  - Facts: Charlotte: banking
- **clt** — Charlotte Douglas International Airport (Wikipedia): a major American Airlines hub, one of the busiest U.S. airports <https://en.wikipedia.org/wiki/Charlotte_Douglas_International_Airport>
  - Facts: Charlotte: a giant airline hub
- **portla** — Los Angeles, the busiest U.S. container port (FreightWaves, 2025): about 10.3 million TEU in 2024 <https://www.freightwaves.com/news/los-angeles-the-busiest-us-container-port-plans-even-bigger-future>
  - Facts: Los Angeles: the busiest U.S. container port
- **losangeles** — Hollywood, Los Angeles (Britannica): center of the U.S. film and television industry <https://www.britannica.com/place/Hollywood-California>
  - Facts: Los Angeles: movies and TV
- **porthouston** — Port Houston statistics: 1st U.S. port in foreign waterborne tonnage (2024); Houston energy industry <https://porthouston.com/about/our-port/statistics/>
  - Facts: Houston: the U.S. port with the most foreign cargo; Houston: oil and energy
- **savannah** — Georgia Ports Authority: Garden City Terminal, the largest single-terminal container facility in North America <https://gaports.com/facilities/garden-city-terminal/>
  - Facts: Savannah: the largest single container terminal in North America
- **detroit** — Ambassador Bridge (Detroit Historical Society; Wikipedia): busiest U.S.–Canada trade crossing, about a quarter of the trade <https://www.detroithistorical.org/learn/online-research/encyclopedia-of-detroit/ambassador-bridge>
  - Facts: Detroit: cars; Detroit: busiest U.S.–Canada trade crossing
- **pittsburgh** — Pittsburgh, the Steel City (State Symbols USA): Allegheny and Monongahela meet to form the Ohio <https://statesymbolsusa.org/place/pennsylvania/pittsburgh>
  - Facts: Pittsburgh: steel; Pittsburgh: where the Ohio River begins
- **portnynj** — Port of New York and New Jersey (Wikipedia): busiest port on the U.S. East Coast <https://en.wikipedia.org/wiki/Port_of_New_York_and_New_Jersey>
  - Facts: New York City: the busiest East Coast port
- **chicago-rail** — Chicago as the U.S. rail hub (Chicago Region Environmental and Transportation Efficiency Program, CREATE) <https://www.createprogram.org/>
  - Facts: Chicago: the biggest U.S. rail hub
- **atlanta** — Hartsfield–Jackson Atlanta International Airport (Wikipedia): world's busiest airport by passengers <https://en.wikipedia.org/wiki/Hartsfield%E2%80%93Jackson_Atlanta_International_Airport>
  - Facts: Atlanta: the world's busiest passenger airport
- **sanfrancisco** — Silicon Valley and the San Francisco Bay Area tech industry (Britannica: Silicon Valley) <https://www.britannica.com/place/Silicon-Valley-region-California>
  - Facts: San Francisco: tech companies
- **utc** — UTC offsets in standard time (Wikipedia, List of UTC offsets; timeanddate.com). No DST: Japan, China, Singapore, Indonesia, Bangladesh, Nepal (UTC+5:45 since 1986), India (UTC+5:30), Russia (UTC+3 since 2014), Saudi Arabia, Kenya, Turkey (UTC+3 since 2016), South Africa, Nigeria, Iceland, Peru, Ecuador, Mongolia, Western Australia, Mexico (DST abolished Oct 2022) <https://en.wikipedia.org/wiki/List_of_UTC_offsets>
  - Facts: Mexico City: UTC−6; Cairo: UTC+2; Tokyo: UTC+9; Paris: UTC+1; Moscow: UTC+3; Rotterdam: UTC+1; Istanbul: UTC+3; Reykjavík: UTC+0; Nairobi: UTC+3; Lagos: UTC+1; Cape Town: UTC+2; Riyadh: UTC+3; New Delhi: UTC+5:30; Kathmandu: UTC+5:45; Dhaka: UTC+6; Ulaanbaatar: UTC+8; Shanghai: UTC+8; Singapore: UTC+8; Jakarta: UTC+7; Perth: UTC+8; Lima: UTC−5; Santiago: UTC−4; Quito: UTC−5; San Francisco: UTC−8
- **plates** — Plate boundaries (LibreTexts Geosciences, Types of Plate Boundaries): Mid-Atlantic Ridge in Iceland, San Andreas transform, India–Eurasia collision, Nazca subduction under South America, Japan and Java trenches; North Anatolian Fault (Geological Society); East African Rift (Geological Society) <https://geo.libretexts.org/Courses/Diablo_Valley_College/OCEAN-101:_Fundamentals_of_Oceanography_(Keddy)/08:_Plate_Tectonics/8.03:_Types_of_Plate_Boundaries>
  - Facts: Mexico City: convergent; Tokyo: convergent; Paris: far from a boundary; Moscow: far from a boundary; Rotterdam: far from a boundary; Istanbul: transform; Reykjavík: divergent; Nairobi: divergent; Lagos: far from a boundary; Cape Town: far from a boundary; Riyadh: far from a boundary; Kathmandu: convergent; Shanghai: far from a boundary; Jakarta: convergent; Perth: far from a boundary; Lima: convergent; Santiago: convergent; Quito: convergent; San Francisco: transform
- **un-cities** — UN World Urbanization Prospects 2025 (UN DESA data booklet): Jakarta 41.9 million, Dhaka 36.6 million, Tokyo 33.4 million (2025) <https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/undesa_pd_2025_data-booklet_world_cities_in_2025.pdf>
  - Facts: Dhaka: the world's 2nd-largest city; Jakarta: the world's largest city
- **india-pop** — India overtakes China as the world's most populous country (UN DESA, April 2023): about 1.4286 billion <https://www.un.org/development/desa/pd/content/india-overtakes-china-world%E2%80%99s-most-populous-country>
  - Facts: New Delhi: the most populous country
- **japan-pop** — Japan population about 124 million (2023), aging and declining (Statistics Bureau of Japan) <https://www.stat.go.jp/english/data/jinsui/2023np/index.html>
  - Facts: Tokyo: a country with an aging, shrinking population
- **singapore** — Singapore (World Bank: 100% urban; about 5.9 million people, 2023); world's 2nd-busiest container port in 2024 (List of busiest container ports, Wikipedia) <https://en.wikipedia.org/wiki/List_of_busiest_container_ports>
  - Facts: Singapore: the world's 2nd-busiest container port; Singapore: a 100% urban city-state
- **shanghai** — Port of Shanghai (Wikipedia): world's busiest container port every year since 2010 <https://en.wikipedia.org/wiki/Port_of_Shanghai>
  - Facts: Shanghai: the world's busiest container port
- **rotterdam** — Port of Rotterdam, Facts and Figures: Europe's largest seaport <https://www.portofrotterdam.com/en/experience-online/facts-and-figures>
  - Facts: Rotterdam: Europe's largest port
- **iceland-energy** — Geothermal energy in Iceland (National Energy Authority of Iceland, Orkustofnun): about 9 in 10 homes heated geothermally <https://nea.is/geothermal/>
  - Facts: Reykjavík: geothermal heat
- **paris-climate** — Climate of Paris (Wikipedia; Météo-France normals): oceanic climate (Köppen Cfb) <https://en.wikipedia.org/wiki/Climate_of_Paris>
  - Facts: Paris: oceanic; Rotterdam: oceanic
- **moscow-climate** — Climate of Moscow (Wikipedia): humid continental (Dfb), January below 0°C, July about 19°C <https://en.wikipedia.org/wiki/Climate_of_Moscow>
  - Facts: Moscow: humid continental
- **reykjavik-climate** — Reykjavík climate (Wikipedia, Icelandic Met Office normals): subpolar oceanic (Cfc) <https://en.wikipedia.org/wiki/Reykjav%C3%ADk#Climate>
  - Facts: Reykjavík: subpolar oceanic
- **nairobi-climate** — Nairobi climate (Wikipedia): subtropical highland (Cwb), long rains March–May and short rains October–December <https://en.wikipedia.org/wiki/Nairobi#Climate>
  - Facts: Nairobi: subtropical highland
- **capetown-climate** — Cape Town climate (Wikipedia; Köppen Csb): rainy winters June–August, dry summers <https://en.wikipedia.org/wiki/Climate_of_Cape_Town>
  - Facts: Cape Town: Mediterranean
- **riyadh-climate** — Riyadh climate (Wikipedia): hot desert (BWh), summer highs above 40°C <https://en.wikipedia.org/wiki/Riyadh#Climate>
  - Facts: Riyadh: hot desert
- **cairo-climate** — Cairo climate (Wikipedia): hot desert (BWh), very little rain <https://en.wikipedia.org/wiki/Cairo#Climate>
  - Facts: Cairo: hot desert
- **dhaka-climate** — Dhaka climate (Wikipedia): tropical savanna (Aw) with monsoon rains June–September <https://en.wikipedia.org/wiki/Dhaka#Climate>
  - Facts: Dhaka: tropical savanna
- **ulaanbaatar-climate** — Ulaanbaatar (Wikipedia; WorldAtlas): coldest national capital, January average about −20°C <https://www.worldatlas.com/cities/the-coldest-capital-cities-in-the-world.html>
  - Facts: Ulaanbaatar: cold semi-arid
- **shanghai-climate** — Shanghai climate (Wikipedia): humid subtropical (Cfa) <https://en.wikipedia.org/wiki/Shanghai#Climate>
  - Facts: Shanghai: humid subtropical
- **singapore-climate** — Singapore climate (Meteorological Service Singapore; Köppen Af): about 27°C, over 2,000 mm of rain a year <https://www.weather.gov.sg/climate-climate-of-singapore/>
  - Facts: Singapore: tropical rain forest
- **jakarta-climate** — Jakarta climate (Wikipedia): tropical monsoon (Am), wettest December–February <https://en.wikipedia.org/wiki/Jakarta#Climate>
  - Facts: Jakarta: tropical monsoon
- **perth-climate** — Perth climate (Bureau of Meteorology; Wikipedia): hot-summer Mediterranean (Csa), winter rain June–August <https://en.wikipedia.org/wiki/Climate_of_Perth>
  - Facts: Perth: Mediterranean
- **lima-climate** — Lima climate (Wikipedia): desert climate (BWh) with almost no rain; mild 17–23°C <https://en.wikipedia.org/wiki/Lima#Climate>
  - Facts: Lima: hot desert
- **santiago-climate** — Santiago climate (Wikipedia): Mediterranean-type (Csb), rain mostly in winter (June–August) <https://en.wikipedia.org/wiki/Santiago#Climate>
  - Facts: Santiago: Mediterranean
- **quito-climate** — Quito (Wikipedia): 2,850 m, subtropical highland climate (Cfb), about 14°C all year, 25 km from the equator <https://en.wikipedia.org/wiki/Quito#Climate>
  - Facts: Quito: subtropical highland
- **mexicocity-climate** — Mexico City climate (Wikipedia): subtropical highland (Cwb), 2,240 m, rainy season May–October <https://en.wikipedia.org/wiki/Mexico_City#Climate>
  - Facts: Mexico City: subtropical highland
- **tokyo-climate** — Tokyo climate (Japan Meteorological Agency normals; Wikipedia): humid subtropical (Cfa) <https://en.wikipedia.org/wiki/Tokyo#Climate>
  - Facts: Tokyo: humid subtropical
- **sf-climate** — San Francisco climate (Wikipedia): warm-summer Mediterranean (Csb), rain November–March <https://en.wikipedia.org/wiki/Climate_of_San_Francisco>
  - Facts: San Francisco: Mediterranean

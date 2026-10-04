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

## Report a fact

If a fact looks wrong, fix it in `src/data/places-*.ts` (and its source here), then run `npm test`:
the tests re-check that every case is still solvable and that no wrong destination fits the clues.

## Sources and the facts that cite them

- **town** — Compass Corners is a made-up town; helper jobs follow the NC kindergarten community-helper items (kit social bank, K.E.1 / K.C&G.1)
  - Facts: the School: teacher; the School: school bus; the School: ABC; the Library: librarian; the Library: books; the Library: Shh!; the Fire Station: firefighter; the Fire Station: fire truck; the Fire Station: wee-oo; the Park: park worker; the Park: slide; the Park: wheee; the Bakery: baker; the Bakery: bread; the Bakery: ding; the Post Office: mail carrier; the Post Office: letters; the Post Office: stamp; the Grocery Store: cashier; the Grocery Store: shopping cart; the Grocery Store: beep; the Farm: farmer; the Farm: tractor; the Farm: moo; the Police Station: police officer; the Police Station: police car; the Police Station: tweet; the Doctor's Office: doctor; the Doctor's Office: bandage; the Doctor's Office: ahh
- **coords** — Coordinates: Wikipedia / GeoNames values for each place, rounded (checked by the bounding-box tests) <https://www.geonames.org/>
  - Facts: Seattle: Pacific Ocean; San Francisco: Pacific Ocean; New York City: Atlantic Ocean; Boston: Atlantic Ocean
- **nc-symbols** — NC General Statutes, Chapter 145 (State Symbols and Other Official Adoptions) <https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/ByChapter/Chapter_145.html>
  - Facts: Mount Airy: granite
- **nc-regions** — NCpedia, Our State Geography in a Snap: Three Regions Overview <https://www.ncpedia.org/our-state-geography-snap-three>
  - Facts: Asheville: Mountains; Asheville: snowy winters; Boone: Mountains; Boone: snowy winters; Mount Mitchell: Mountains; Mount Mitchell: snowy winters; Grandfather Mountain: Mountains; Grandfather Mountain: snowy winters; Chimney Rock: Mountains; Cherokee: Mountains; Mount Airy: Piedmont; Hiddenite: Piedmont; Charlotte: Piedmont; Reed Gold Mine: Piedmont; Winston-Salem: Piedmont; Greensboro: Piedmont; Chapel Hill: Piedmont; Raleigh: Piedmont; Wilmington: Coastal Plain; Wilmington: hurricanes; New Bern: Coastal Plain; Pembroke: Coastal Plain; Edenton: Coastal Plain; Kill Devil Hills: Coastal Plain; Kill Devil Hills: hurricanes; Nags Head: Coastal Plain; Nags Head: hurricanes; Cape Hatteras: Coastal Plain; Cape Hatteras: hurricanes; Manteo: Coastal Plain; Manteo: hurricanes; Ocracoke: Coastal Plain; Ocracoke: hurricanes
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
  - Facts: Seattle: West; San Francisco: West; Sacramento: West; Denver: West; Salt Lake City: West; Yellowstone: West; the Grand Canyon: Southwest; Phoenix: Southwest; Santa Fe: Southwest; Austin: Southwest; Mount Rushmore: Midwest; St. Louis: Midwest; Chicago: Midwest; New Orleans: Southeast; Nashville: Southeast; Atlanta: Southeast; the Everglades: Southeast; Richmond: Southeast; Columbia: Southeast; Raleigh: Southeast; New York City: Northeast; Boston: Northeast
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
  - Facts: Washington, D.C.: the United States; Washington, D.C.: White House
- **continents** — Continents of the World (WorldAtlas): Asia largest, Australia smallest <https://www.worldatlas.com/continents>
  - Facts: North America: continent; North America: our continent; South America: continent; South America: Amazon River; Europe: continent; Europe: Eiffel Tower; Africa: continent; Asia: continent; Asia: largest continent; Asia: Great Wall; Australia: continent; Australia: smallest continent; Antarctica: continent; Washington, D.C.: North America; Ottawa: North America; Mexico City: North America; London: Europe; Cairo: Africa; Tokyo: Asia; Sydney: Australia
- **oceans** — The World's Five Great Oceans: Pacific largest, Arctic smallest <https://www.whatarethe7continents.com/the-worlds-five-great-oceans/>
  - Facts: the Pacific Ocean: ocean; the Pacific Ocean: largest ocean; the Atlantic Ocean: ocean; the Atlantic Ocean: touches North Carolina; the Indian Ocean: ocean; the Indian Ocean: Africa and Australia; the Arctic Ocean: ocean; the Arctic Ocean: smallest ocean; the Southern Ocean: ocean; the Southern Ocean: Antarctica
- **sahara** — The Sahara: Earth's largest hot desert (Live Science) <https://www.livescience.com/23140-sahara-desert.html>
  - Facts: Africa: Sahara
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


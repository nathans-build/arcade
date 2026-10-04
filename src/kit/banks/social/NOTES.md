# Social studies bank notes: NC Standard Course of Study for Social Studies (adopted Feb 4, 2021, implemented 2021–22)

There are 48 questions per grade (624 in all). Ids `soc-g<grade>-01` to `-18` are the original items, and `-19` to `-48` were added
in the second pass. Every item is written with the correct choice first (`answer: 0`). An item is `quick` when it has no passage,
its prompt is 100 characters or fewer, and every choice is 14 characters or fewer. 538 of the 624 items are quick. Each grade
also has between 3 and 9 checkpoint items, such as primary-source excerpts, maps and timelines described in words, charts,
budgets and paychecks.

High school mapping: 9 = World History, 10 = Founding Principles of the USA and NC: Civic Literacy, 11 = American History,
12 = Economics and Personal Finance.

## Standards format
Codes are `grade.strand.standard.objective`, for example `5.C&G.1.1`. The five content strands are History (H), Geography (G),
Economics (E), Civics & Government (C&G) and Behavioral Sciences (B). The Inquiry (I) skills strand has no items. High school
codes start with a course prefix: `WH.`, `CL.` (Civic Literacy), `AH.` and `EPF.`. The EPF course uses its own strands:
E (economics), IE (income and education), **MCM (money and credit management)**, FP (financial planning) and CC (critical
consumerism / consumer and civic responsibility).

When the objective number could not be confirmed, the item uses the **standard-level** code (for example `6.H.1`). When the
objective was seen, the item uses the full code.

### Re-codes made in the second pass (original items)
- **EPF.MM.1 → EPF.MCM.\*.** Search excerpts show that the strand is `MCM`, not `MM`. Affected items: budget and the 50/30/20 rule
  go to EPF.MCM.1.1, compound interest to EPF.MCM.2.2, and credit score to EPF.MCM.3.
- EPF demand → EPF.E.1.3. Inflation and GDP → EPF.E.2.1 (macroeconomic indicators). The Fed → EPF.E.2.
- Standard-level codes were narrowed to confirmed objectives:
  - K: rules → K.C&G.1.1, needs and wants → K.E.1.1, change over time → K.H.1.1, families → K.B.1.1.
  - Grade 1: map key → 1.G.1.2, landforms and water → 1.G.1.1, traditions → 1.B.1.1.
  - Grade 2: democracy → 2.C&G.1.1, culture → 2.B.1.1.
  - Grade 3: mayor and governor → 3.C&G.1.2.
  - Grade 10: jury duty → CL.C&G.3.1.
- Per-standard progress that browsers saved under the old codes no longer matches these items, which is harmless.

## High school course placement
The state sets **no required order** for the four graduation courses (NC DPI FAQ). This bank follows the traditional NC order:
9 WH, 10 Civic Literacy, 11 American History, 12 EPF. To use 10 = American History and 11 = Civic Literacy instead, swap the
contents of `g10.ts` and `g11.ts` and update their `grade` and `id` fields.

## Coverage per grade (48 items: quick / checkpoint; strand counts)
- **K** ("The World Around Us"), 45 / 3. G 12, H 9, C&G 10, E 12, B 5.
  - Topics: maps, globes and symbols; physical features (ocean, island, landforms); location words; past, present and future;
    holidays (MLK Day, Thanksgiving); rules and consequences; community helpers; flag, Pledge and bald eagle; needs and wants;
    goods and services; jobs and banks; culture, languages and traditions.
  - Checkpoints: a classroom picture map, one-room schools then and now, and a need-versus-want choice.
- **1**, 44 / 4. G 14, H 10, C&G 9, E 9, B 6.
  - Topics: landforms (valley, desert, plain, river); map symbols; sunset direction; Earth's water; Armstrong, the Wright
    brothers, Rosa Parks and Ruby Bridges; timelines; volunteers and helpers; the town council; majority vote; scarcity; supply
    and demand; producers; saving; Lunar New Year and Kwanzaa.
  - Checkpoints: a park map with a compass rose, a personal timeline, a fair class rule, and comparing two families' traditions.
- **2**, 44 / 4. G 12, H 16, C&G 9, E 8, B 3.
  - Topics: Sacagawea, Jackie Robinson, Chavez and Huerta, Susan B. Anthony, Sequoyah, Lincoln and Clara Barton; the Moon
    landing; the Declaration; the 13 colonies; Washington, DC; absolute and relative location; settlement near rivers and on the
    Plains; majority rule; Congress; 4-year presidential terms; Bill of Rights freedoms; equality; natural, human and capital
    resources; Cinco de Mayo.
  - Checkpoints: a timeline, choosing a town site, freedom of religion, and an orchard freeze (scarcity).
- **3** ("Our Community and State"), 40 / 8. G 16, H 9, C&G 10, E 8, B 5.
  - Topics: Mount Mitchell; NC's neighbors; Asheville; climate (snow and hurricanes); the Port of Wilmington; the Lumbee in
    Robeson County; Ella Baker; museums and eyewitnesses; decades; the legislature, city council and 100 counties; sheriff and
    governor roles; entrepreneurs; shrimp and Fraser firs; Lumbee Homecoming in Pembroke; cultures in a community.
  - Checkpoints: a town map (factory site), an imagined 1918 letter (primary source), council, mayor and parks roles, an NC farm
    rankings chart, and a culture night.
- **4** (NC history), 41 / 7. H 21, G 7, C&G 9, E 7, B 4.
  - Topics: Town Creek Indian Mound; the Tuscarora War; the Qualla Boundary; Raleigh's voyages and "CROATOAN"; the Edenton Tea
    Party; Moores Creek Bridge; Harriet Jacobs; David Walker; Wilmington blockade runners; Bennett Place; mill families; the
    Great Migration; the Piedmont and Fall Line; Pamlico Sound; Fontana Dam; I-40 and I-85; the governor's term; the
    lieutenant governor; the NC Constitution's right to education; rights versus responsibilities; Henry Frye; Eastern Band
    government; the decline of textile mills; Research Triangle; the Reed gold mine (1799); factors of production; Moravian
    Salem; Highland Scots on the Cape Fear.
- **5** (United States), 42 / 6. G 14, C&G 12, H 14, B 2, E 6.
  - Topics: Lexington and Concord; Yorktown; Jefferson; the War of 1812; Appomattox; Pearl Harbor; Bell, Edison, Earhart and
    Katherine Johnson; the Southwest; the Appalachians; the Oregon Trail; the gold rush; Irish famine push factors; the Erie
    Canal; the cotton gin; Eisenhower's interstates; Angel Island; the President, House and Senate; Senate confirmation; veto
    override; the 15th and 6th Amendments; petitions; Langston Hughes; recessions; a budget; loans.
- **6** (Paleolithic era to 1400 CE), 41 / 7. H 14, G 11, C&G 9, E 8, B 6.
  - Topics: the Paleolithic; human origins in Africa; pharaohs and hieroglyphics; Constantinople; the Olmec; paper; feudalism;
    the Fertile Crescent; the Indus and Huang He; Greek city-states; Polynesian navigation; the Tiber; Timbuktu (map); Roman
    inflation; barter; the Phoenician alphabet; monsoon trade; Great Zimbabwe; monarchy, oligarchy and theocracy; the Twelve
    Tables; Athenian voting; Buddhism, Judaism and Islam.
  - Primary sources: Hammurabi law 196 (L. W. King translation) and Confucius, Analects 15.24 (Legge).
- **7** (1400 to present), 43 / 5. H 21, E 5, C&G 12, B 3, G 7.
  - Topics: Cortés; 1453; da Gama; Magellan and Elcano; Copernicus; Meiji; Sarajevo; Versailles; 1945; Sputnik; Malala;
    Nkrumah; suffragettes; Napoleon; Bolívar; Mao; the Reformation; the Enlightenment; the 1789 Declaration of the Rights of Man
    (Art. 10); the euro; forced migration; Partition; Syrian refugees; the Panama Canal; an urbanization chart; command
    economies; Adam Smith; Marx; the Taj Mahal; haiku.
- **8** (NC and U.S. history), 41 / 7. H 22, C&G 10, E 7, G 7, B 2.
  - Topics: the Lords Proprietors; Blackbeard at Ocracoke; Joseph Hewes; the Trail of Tears; Worcester v. Georgia; Dred Scott;
    Vance; the Klan during Reconstruction; the Freedmen's Bureau; Aycock (schools and disfranchisement, both stated); the 1900
    suffrage amendment; U-boats ("Torpedo Junction"); the March on Washington; an order-of-events item; the Great Wagon Road;
    the Wilmington & Weldon Railroad; Piedmont mills; the Charlotte and Raleigh metros; the Depression; the CCC; WWII bases; the
    Blue Ridge Parkway; a mill-town jobs chart; the Declaration; the 1776 and 1868 NC constitutions; Brown; NC's Hispanic
    growth; the Battle of Hayes Pond (1958).
  - Primary source: George Moses Horton (1829).
- **9** (World History), 40 / 8. H 18, E 10, B 4, C&G 10, G 6.
  - Topics: Suleiman; Zheng He; Akbar; Westphalia; the Glorious Revolution; the Congress of Vienna; Bismarck; the Opium Wars;
    the Korean armistice; Rwanda (non-graphic); the Truman Doctrine (primary source); Latin American independence; the Middle
    Passage; the Irish famine; Berlin Conference borders; Gibraltar; Leopold II's Congo; the spice trade; Dutch East India
    Company shares; the Marshall Plan; OPEC; a Bairoch manufacturing-share chart; divine right; Louis XIV; Montesquieu;
    fascism; the UN Security Council; Ho Chi Minh's 1945 declaration; Leonardo; Newton.
- **10** (Civic Literacy), 39 / 9. C&G 36, H 5, E 3, B 2, G 2.
  - Topics: separation of powers; limited government; NC's Declaration of Rights; the Supremacy Clause; the 10th Amendment; 27
    amendments; Federalist 51 and the First Amendment text (primary sources); House terms; life tenure; 9 justices; the Vice
    President; the NC House (120); NC veto override (three-fifths); the Cabinet; NC bills becoming law without signature after
    10 days; naturalization; duties versus voluntary acts; NC preregistration at 16; assembly; Shays' Rebellion; the Great and
    Three-Fifths Compromises; Anti-Federalists; Loving v. Virginia; MADD and the drinking age; federal revenue; tariffs; the
    census and reapportionment; the Paris Agreement.
- **11** (American History), 39 / 9. H 23, C&G 10, E 7, B 4, G 4.
  - Topics: the Tea Party; the Monroe Doctrine; the Indian Removal Act; Guadalupe Hidalgo; Fort Sumter; Gettysburg; 1877; 1898;
    the Berlin Airlift; 1973; Watergate; the Gulf War; Obama; the Montgomery boycott; the Dust Bowl; the 1924 quotas; the Great
    Migration; the Homestead Act; Standard Oil; the Sherman Act; unions; the Wagner Act; a 1929–41 unemployment chart; Miranda;
    the Civil Rights Act; the 1924 Indian Citizenship Act; 1988 internment reparations; the Harlem Renaissance.
  - Primary sources: Douglass (1852) and JFK (1961).
- **12** (EPF), 39 / 9. E 15, IE 8, MCM 14, FP 7, CC 4.
  - Topics: monopoly; price ceilings; an equilibrium table; surplus; recession; CPI; Fed rates; unemployment; consumer
    signals; gross pay; a FICA net-pay calculation; W-4; grants; FAFSA; apprenticeship versus a job-now comparison; fixed
    expenses; emergency funds; a budget; leasing; fixed-rate mortgages; down payments; FDIC $250,000; simple interest; monthly
    APR interest; payday loans; index funds; the Rule of 72; deductibles; philanthropy; independent reviews.

## Remaining gaps (for a next pass)
- **Grade 10** leans heavily on C&G (36 of 48). It needs more CL.B (norms and policy), CL.E (NC budget, the role of government in
  the economy), CL.G.1.1 (immigration and environment policy) and NC local government (municipal services, school boards).
- **Grade 8 B** (2 items) and **Grade 5 B and E**: add more on groups and identity (Lumbee, Tuscarora, immigrant communities)
  and on 5.E.1.2 and 5.E.1.4 (topics unknown until the objectives are confirmed).
- **Grade 4 G.1.3 and E.1.1** have one item each. Hog farming and environmental trade-offs, and Outer Banks erosion and
  lighthouse moves, would fit.
- **Grade 2 B** (3 items): add more on American values and identity.
- **Grade 7 E** (5 items): add globalization trade-offs and the economic rise of China and India.
- **Grade 11** has little on the Gilded Age West (Plains Wars, the Dawes Act) and on 1990s–2020s domestic policy.
- **Inquiry (I) strand**: there are no items. Compelling and supporting questions and source evaluation could be added as
  checkpoint items.
- **Recent events after 2020** are not covered, on purpose, to keep items stable and nonpartisan.

## Codes to verify
Codes were checked only through web-search result excerpts, because dpi.nc.gov, ASN, banzai, simbli, appstate.edu and district
sites are blocked by the sandbox proxy. Excerpt summaries can blend in the older 2010 Essential Standards, so treat the
objective texts below as likely, not certain.
- **Objective texts seen in excerpts** (used as full codes):
  - K.H.1.1, K.H.1.2, K.G.1.1, K.G.1.2, K.C&G.1.1, K.E.1.1, K.E.1.2, K.B.1.1.
  - 1.G.1.1, 1.G.1.2, 1.H.1.1, 1.C&G.1.1, 1.C&G.1.2, 1.E.1.1, 1.E.1.2, 1.B.1.1.
  - 2.H.1.1, 2.H.1.2, 2.G.1.1, 2.G.1.2, 2.C&G.1.1, 2.C&G.1.2, 2.E.1.1, 2.E.1.2, 2.B.1.1.
  - 3.H.1.1, 3.G.1.1, 3.G.1.2, 3.G.1.3, 3.C&G.1.1, 3.C&G.1.2, 3.E.1.1, 3.E.1.2, 3.B.1.1, 3.B.1.2.
  - 4.H.1.1–1.4, 4.G.1.1–1.3, 4.C&G.1.1–1.3, 4.E.1.1–1.3, 4.B.1.1–1.2.
  - All grade 5 codes used (from a district pacing guide read in full in the first pass).
  - 6.G.1.1, 6.E.1.1, 6.E.1.2, 6.C&G.1.1, 6.B.1.1.
  - 7.H.1.1, 7.H.1.2, 7.G.1.1, 7.E.1.1, 7.C&G.1.1, 7.C&G.1.2, 7.B.1.1.
  - 8.C&G.1.1, 8.E.1.1, 8.B.1.1, 8.G.1.1.
  - WH.H.1.1, WH.G.1.1, WH.E.1.1, WH.C&G.1.1.
  - CL.C&G.1.1, CL.C&G.3.1, CL.H.1.1, CL.B.1.1, CL.B.1.2, CL.E.1.2, CL.G.1.2, CL.G.1.3.
  - AH.H.1.1, AH.E.1.1, AH.G.1.1, AH.C&G.1.1, AH.B.1.1, AH.B.1.2.
  - EPF.E.1.1–1.3, EPF.E.2.1, EPF.IE.1.1–1.3, EPF.MCM.1.1–1.4, EPF.MCM.2.1–2.3, EPF.MCM.3.1, EPF.FP.1.1–1.3, EPF.CC.1.1–1.3.
- **Still standard-level (objective unknown)**:
  - K.G.1 (location words), K.H.1, K.C&G.1 (helpers, symbols), K.E.1 (jobs, money), K.B.1.
  - 1.G.1, 1.H.1 (1.H.1.2 text not seen), 1.C&G.1, 1.E.1, 1.B.1.
  - 2.G.1, 2.H.1, 2.C&G.1, 2.E.1, 2.B.1.
  - 3.G.1, 3.H.1 (3.H.1.2 text not seen), 3.C&G.1, 3.E.1.
  - 4.H.1, 4.G.1, 4.C&G.1, 4.E.1.
  - 5.E.2 (borrowing).
  - 6.H.1 (excerpts gave 6.H.1.1 and 6.H.1.2 texts that look like 2010 wording), 6.G.1, 6.C&G.1, 6.E.1.
  - 7.H.1, 7.G.1, 7.E.1, 7.C&G.1.
  - 8.H.1 (8.H.1.1 text not seen), 8.G.1, 8.E.1, 8.C&G.1.
  - WH.H.1, WH.E.1, WH.G.1, WH.C&G.1 (".1" for the standard is assumed).
  - CL.C&G.1, CL.C&G.2, CL.C&G.3, CL.H.1, CL.E.1.
  - AH.H.1, AH.C&G.1, AH.E.1, AH.G.1, AH.B.1.
  - EPF.E.1, EPF.E.2 (Fed, fiscal policy), EPF.IE.1 (W-4, net pay), EPF.MCM.3 (credit score), EPF.FP.1 (insurance,
    compound interest), EPF.CC.1 (phishing).
- **Does EPF strand CC stand for "Critical Consumerism" or "Consumer and Civic Responsibilities"?** Excerpts gave both names.
- **Is EPF.E.2.2 about microeconomic or macroeconomic indicators?** One excerpt said "microeconomic", which looks garbled. It is
  not used.
- **The Civic Literacy prefix `CL.`** appears in excerpts. One excerpt also showed `FP.C&G.*`, which may come from the older
  Founding Principles course.

## Facts double-checked during the second pass
These were checked against standard references from the author's knowledge, plus search excerpts where available. Live
pages could not be fetched.
- Dates:
  - Halifax Resolves (Apr 12, 1776); Edenton Tea Party (Oct 1774); Moores Creek Bridge (Feb 27, 1776); NC's first constitution
    (Dec 1776); NC ratification (Nov 1789); the 1868 and 1971 constitutions.
  - Reed gold (1799, Cabarrus County); Bennett Place (Apr 26, 1865, about 89,000 troops); Fontana Dam (1942–44); the Blue Ridge
    Parkway (begun 1935); the Battle of Hayes Pond (Jan 1958, Maxton).
  - Henry Frye (elected 1968; Chief Justice 2001).
- NC government:
  - NC House 120 / Senate 50; 100 counties; a 4-year governor term with a two-consecutive-term limit.
  - The lieutenant governor presides over the Senate.
  - Veto override takes three-fifths of members present and voting; a bill becomes law if not acted on in 10 days during a
    session.
  - Art. I §15 (the right to the privilege of education); preregistration at 16.
- Federal:
  - 9 justices (since 1869); 27 amendments (the 27th in 1992); FDIC $250,000 per depositor, per bank, per ownership category;
    FICA at 7.65%.
  - The Indian Citizenship Act (1924); the Civil Liberties Act (1988); the Wagner Act (1935); the Sherman Act (1890); the
    Homestead Act (1862).
- Quotations from public-domain sources (checked against well-known published wording, not a live fetch, because the proxy
  blocks most sites; spot-check against print before publishing): Federalist 51; the First Amendment; Hammurabi 196; Analects
  15.24; Horton's "On Liberty and Slavery"; Douglass (July 5, 1852); the JFK inaugural; the Truman Doctrine; DRMC Art. 10; the
  opening of Vietnam's 1945 declaration.
- Data are labeled as estimates: Bairoch manufacturing shares; Lebergott unemployment (1929 3%, 1933 25%, 1937 14%, 1938 19%,
  1941 10%); the world urban share (7/16/30/56%). The Millville chart is labeled as made up.
- Every calculation is checked by `check_math.py` (13 items): map scale, Leo's and Jada's budgets, 50/30/20, compound
  interest, the equilibrium table, the FICA net pay (and its distractors), apprenticeship versus job, Devon's budget, the down
  payment, simple interest, monthly APR, and the Rule of 72.

## Verification
The scripts are in the session scratchpad (`bank-social/`):
- `build.py` generates the g*.ts files from the original data plus `new_*.py`.
- `verify.ts` (run with `npx tsx`) checks:
  - 48 items per grade, at least 2/3 of them quick, and the quick limits;
  - unique ids in sequence, 4 distinct choices, `answer: 0`, and no all/none-of-the-above choices;
  - required fields, no passage on a quick item, and every standard code in its grade's family;
  - near-duplicate prompts within a grade (word Jaccard of 0.6 or more is an error, 0.4 or more a warning).
- `check_math.py` re-checks every calculation.
- `tsc --strict` type-checks every bank file.

All checks pass. The only warnings are 2 pairs of similar prompts, which were reviewed and are not duplicates.

## Sources (as seen through web-search excerpts unless noted)
- NC DPI, Social Studies Standard Course of Study and K–12 unpacking documents (fall 2021 implementation), dpi.nc.gov
- NC DPI, Extended Content Standards 2022 (K–8, WH, AH, Civic Literacy, EPF) and the EPF crosswalk, dpi.nc.gov
- MCS 5th Grade Social Studies Pacing Guide 22-23 (read in full in the first pass), core-docs.s3.amazonaws.com
- NC DPI Social Studies FAQ (no required high school course order)
- ECU/Banzai and ASN listings of the NC EPF standards (codes EPF.MCM.*, EPF.CC.*, EPF.FP.*, EPF.IE.*)
- District board-meeting attachments (unpacking documents for grades 7–8, WH, Civic Literacy and EPF), simbli.eboardsolutions.com
- App State History Education, Civic Literacy standards PDF; NCCEE standards revision update; IXL and TPT NC standards pages

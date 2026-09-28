import type { Question } from "./types";

// Grade 6 Mathematics — NC Standard Course of Study (2017), as taught in WCPSS.
export const math6: Question[] = [
  // ---- Ratios & Proportional Relationships ----
  {
    id: "m-rp-1", subject: "math", standard: "NC.6.RP.1", skill: "Ratio language",
    prompt: "A rover crew has 4 pilots and 10 engineers. What is the ratio of pilots to engineers in simplest form?",
    choices: ["2:5", "5:2", "4:14", "2:7"], answer: 0, quick: true,
    explanation: "4:10 — divide both parts by 2 to get 2:5. Order matters: pilots come first.",
  },
  {
    id: "m-rp-2", subject: "math", standard: "NC.6.RP.1", skill: "Ratio language",
    prompt: "3 cups of water go with 5 scoops of powder. How many scoops go with 12 cups of water?",
    choices: ["20", "14", "15", "36"], answer: 0, quick: true,
    explanation: "12 is 3 × 4, so multiply 5 by 4 too: 20 scoops.",
  },
  {
    id: "m-rp-3", subject: "math", standard: "NC.6.RP.2", skill: "Unit rates",
    prompt: "A moon buggy travels 150 km in 3 hours. What is its unit rate?",
    choices: ["50 km/h", "45 km/h", "153 km/h", "450 km/h"], answer: 0, quick: true,
    explanation: "Unit rate = 150 ÷ 3 = 50 km per 1 hour.",
  },
  {
    id: "m-rp-4", subject: "math", standard: "NC.6.RP.3", skill: "Rate & ratio problems",
    prompt: "Oxygen tanks cost $24 for 3 tanks. At that rate, how much do 7 tanks cost?",
    choices: ["$56", "$48", "$63", "$72"], answer: 0, quick: true,
    explanation: "$24 ÷ 3 = $8 per tank. 7 × $8 = $56.",
  },
  {
    id: "m-rp-5", subject: "math", standard: "NC.6.RP.4", skill: "Percents",
    prompt: "What is 30% of 80?",
    choices: ["24", "26.7", "30", "50"], answer: 0, quick: true,
    explanation: "30% = 0.30. 0.30 × 80 = 24.",
  },
  {
    id: "m-rp-6", subject: "math", standard: "NC.6.RP.4", skill: "Percents",
    prompt: "A crater is 45 m wide. That is 60% of the width of a second crater. How wide is the second crater?",
    choices: ["75 m", "27 m", "105 m", "72 m"], answer: 0,
    explanation: "45 is 60% of the whole, so whole = 45 ÷ 0.60 = 75 m. Check: 60% of 75 = 45. ✓",
  },
  {
    id: "m-rp-7", subject: "math", standard: "NC.6.RP.3", skill: "Rate & ratio problems",
    prompt: "How many centimeters are in 3.5 meters?",
    choices: ["350", "35", "3,500", "0.035"], answer: 0, quick: true,
    explanation: "1 m = 100 cm, so 3.5 × 100 = 350 cm.",
  },
  {
    id: "m-rp-8", subject: "math", standard: "NC.6.RP.2", skill: "Unit rates",
    prompt: "Which is the better buy: 6 energy bars for $9, or 10 energy bars for $14?",
    choices: ["10 for $14", "6 for $9", "They cost the same", "Not enough information"], answer: 0,
    explanation: "$9 ÷ 6 = $1.50 per bar. $14 ÷ 10 = $1.40 per bar. $1.40 is cheaper.",
  },

  // ---- The Number System ----
  {
    id: "m-ns-1", subject: "math", standard: "NC.6.NS.1", skill: "Dividing fractions",
    prompt: "What is 2/3 ÷ 1/6?",
    choices: ["4", "1/9", "2/18", "3"], answer: 0, quick: true,
    explanation: "Multiply by the reciprocal: 2/3 × 6/1 = 12/3 = 4.",
  },
  {
    id: "m-ns-2", subject: "math", standard: "NC.6.NS.1", skill: "Dividing fractions",
    prompt: "A 3/4-mile track is split into sections that are each 1/8 mile long. How many sections are there?",
    choices: ["6", "3/32", "8", "4"], answer: 0,
    explanation: "3/4 ÷ 1/8 = 3/4 × 8 = 24/4 = 6 sections.",
  },
  {
    id: "m-ns-3", subject: "math", standard: "NC.6.NS.2", skill: "Multi-digit division",
    prompt: "What is 1,512 ÷ 24?",
    choices: ["63", "62", "73", "36"], answer: 0, quick: true,
    explanation: "24 × 60 = 1,440. 1,512 − 1,440 = 72 = 24 × 3. So 60 + 3 = 63.",
  },
  {
    id: "m-ns-4", subject: "math", standard: "NC.6.NS.3", skill: "Decimal operations",
    prompt: "What is 4.5 × 1.2?",
    choices: ["5.4", "54", "0.54", "5.7"], answer: 0, quick: true,
    explanation: "45 × 12 = 540. There are 2 decimal places total, so 5.40 = 5.4.",
  },
  {
    id: "m-ns-5", subject: "math", standard: "NC.6.NS.3", skill: "Decimal operations",
    prompt: "What is 12.6 − 4.85?",
    choices: ["7.75", "8.25", "7.85", "8.75"], answer: 0, quick: true,
    explanation: "Line up decimals: 12.60 − 4.85 = 7.75.",
  },
  {
    id: "m-ns-6", subject: "math", standard: "NC.6.NS.4", skill: "GCF & LCM",
    prompt: "What is the greatest common factor of 18 and 24?",
    choices: ["6", "3", "12", "72"], answer: 0, quick: true,
    explanation: "Factors of 18: 1,2,3,6,9,18. Factors of 24: 1,2,3,4,6,8,12,24. The greatest shared one is 6.",
  },
  {
    id: "m-ns-7", subject: "math", standard: "NC.6.NS.4", skill: "GCF & LCM",
    prompt: "What is the least common multiple of 6 and 8?",
    choices: ["24", "48", "14", "2"], answer: 0, quick: true,
    explanation: "Multiples of 8: 8, 16, 24… 24 is the first one that is also a multiple of 6.",
  },
  {
    id: "m-ns-8", subject: "math", standard: "NC.6.NS.4", skill: "GCF & LCM",
    prompt: "Which shows 36 + 60 rewritten by factoring out the greatest common factor?",
    choices: ["12(3 + 5)", "6(6 + 10)", "4(9 + 15)", "3(12 + 20)"], answer: 0,
    explanation: "GCF of 36 and 60 is 12. 36 = 12 × 3 and 60 = 12 × 5, so 36 + 60 = 12(3 + 5).",
  },
  {
    id: "m-ns-9", subject: "math", standard: "NC.6.NS.5", skill: "Integers in context",
    prompt: "A crater floor is 35 meters below the Moon's surface. Which integer represents its position?",
    choices: ["−35", "35", "0", "−3.5"], answer: 0, quick: true,
    explanation: "\"Below\" the surface (0) is negative: −35.",
  },
  {
    id: "m-ns-10", subject: "math", standard: "NC.6.NS.6", skill: "Coordinate plane",
    prompt: "Reflect the point (3, −2) across the x-axis. Where does it land?",
    choices: ["(3, 2)", "(−3, −2)", "(−3, 2)", "(2, 3)"], answer: 0, quick: true,
    explanation: "Reflecting across the x-axis keeps x the same and flips the sign of y.",
  },
  {
    id: "m-ns-11", subject: "math", standard: "NC.6.NS.7", skill: "Ordering & absolute value",
    prompt: "Which list is ordered from least to greatest?",
    choices: ["−8, −3, 0, 5", "−3, −8, 0, 5", "0, −3, 5, −8", "5, 0, −3, −8"], answer: 0,
    explanation: "On a number line, −8 is farthest left, then −3, then 0, then 5.",
  },
  {
    id: "m-ns-12", subject: "math", standard: "NC.6.NS.7", skill: "Ordering & absolute value",
    prompt: "What is |−14|?",
    choices: ["14", "−14", "0", "1/14"], answer: 0, quick: true,
    explanation: "Absolute value is distance from 0, which is never negative: 14.",
  },
  {
    id: "m-ns-13", subject: "math", standard: "NC.6.NS.7", skill: "Ordering & absolute value",
    prompt: "Which statement is true?",
    choices: ["−7 < −2", "−7 > −2", "−2 < −7", "|−7| < |−2|"], answer: 0, quick: true,
    explanation: "−7 is to the left of −2 on the number line, so −7 < −2.",
  },
  {
    id: "m-ns-14", subject: "math", standard: "NC.6.NS.8", skill: "Distance on the plane",
    prompt: "What is the distance between (−4, 6) and (5, 6)?",
    choices: ["9", "1", "11", "10"], answer: 0, quick: true,
    explanation: "Same y-value, so count across: |−4| + |5| = 4 + 5 = 9 units.",
  },

  // ---- Expressions & Equations ----
  {
    id: "m-ee-1", subject: "math", standard: "NC.6.EE.1", skill: "Exponents",
    prompt: "What is 3⁴?",
    choices: ["81", "12", "64", "27"], answer: 0, quick: true,
    explanation: "3 × 3 × 3 × 3 = 81 (not 3 × 4).",
  },
  {
    id: "m-ee-2", subject: "math", standard: "NC.6.EE.1", skill: "Exponents",
    prompt: "Evaluate 2 + 3 × 4².",
    choices: ["50", "80", "146", "98"], answer: 0, quick: true,
    explanation: "Exponent first: 4² = 16. Then 3 × 16 = 48. Then 2 + 48 = 50.",
  },
  {
    id: "m-ee-3", subject: "math", standard: "NC.6.EE.2", skill: "Writing & evaluating expressions",
    prompt: "Which expression means \"5 less than a number n\"?",
    choices: ["n − 5", "5 − n", "5n", "n + 5"], answer: 0, quick: true,
    explanation: "\"5 less than n\" starts at n and takes away 5: n − 5.",
  },
  {
    id: "m-ee-4", subject: "math", standard: "NC.6.EE.2", skill: "Writing & evaluating expressions",
    prompt: "Evaluate 3x + 7 when x = 6.",
    choices: ["25", "43", "16", "39"], answer: 0, quick: true,
    explanation: "3 × 6 = 18, and 18 + 7 = 25.",
  },
  {
    id: "m-ee-5", subject: "math", standard: "NC.6.EE.3", skill: "Equivalent expressions",
    prompt: "Which expression is equivalent to 4(2y + 3)?",
    choices: ["8y + 12", "8y + 3", "6y + 7", "2y + 12"], answer: 0, quick: true,
    explanation: "Distribute the 4 to both terms: 4 × 2y = 8y and 4 × 3 = 12.",
  },
  {
    id: "m-ee-6", subject: "math", standard: "NC.6.EE.3", skill: "Equivalent expressions",
    prompt: "Which is equivalent to 3a + 5a − 2a?",
    choices: ["6a", "10a", "6a³", "8a − 2"], answer: 0, quick: true,
    explanation: "Combine like terms: 3 + 5 − 2 = 6, so 6a.",
  },
  {
    id: "m-ee-7", subject: "math", standard: "NC.6.EE.5", skill: "Solving equations & inequalities",
    prompt: "Which value of x makes x/4 > 3 true?",
    choices: ["16", "12", "8", "4"], answer: 0, quick: true,
    explanation: "16 ÷ 4 = 4, and 4 > 3. (12 ÷ 4 = 3, which is equal, not greater.)",
  },
  {
    id: "m-ee-8", subject: "math", standard: "NC.6.EE.7", skill: "Solving equations & inequalities",
    prompt: "Solve: x + 17 = 42",
    choices: ["25", "59", "35", "24"], answer: 0, quick: true,
    explanation: "Subtract 17 from both sides: x = 42 − 17 = 25.",
  },
  {
    id: "m-ee-9", subject: "math", standard: "NC.6.EE.7", skill: "Solving equations & inequalities",
    prompt: "Solve: 6m = 54",
    choices: ["9", "48", "60", "324"], answer: 0, quick: true,
    explanation: "Divide both sides by 6: m = 54 ÷ 6 = 9.",
  },
  {
    id: "m-ee-10", subject: "math", standard: "NC.6.EE.8", skill: "Solving equations & inequalities",
    prompt: "The rover can carry at most 250 kg. Which inequality shows the weight w it can carry?",
    choices: ["w ≤ 250", "w ≥ 250", "w < 250", "w > 250"], answer: 0, quick: true,
    explanation: "\"At most\" means 250 or less, so w ≤ 250.",
  },
  {
    id: "m-ee-11", subject: "math", standard: "NC.6.EE.9", skill: "Dependent & independent variables",
    prompt: "A rover drives 40 km each hour. Which equation relates distance d to hours h?",
    choices: ["d = 40h", "h = 40d", "d = h + 40", "d = 40 ÷ h"], answer: 0, quick: true,
    explanation: "Distance depends on time: each hour adds 40 km, so d = 40h.",
  },

  // ---- Geometry ----
  {
    id: "m-g-1", subject: "math", standard: "NC.6.G.1", skill: "Area of polygons",
    prompt: "What is the area of a triangle with base 10 m and height 6 m?",
    choices: ["30 m²", "60 m²", "16 m²", "32 m²"], answer: 0, quick: true,
    explanation: "A = ½ × b × h = ½ × 10 × 6 = 30 m².",
  },
  {
    id: "m-g-2", subject: "math", standard: "NC.6.G.1", skill: "Area of polygons",
    prompt: "A parallelogram has a base of 9 cm and a height of 4 cm. What is its area?",
    choices: ["36 cm²", "18 cm²", "26 cm²", "13 cm²"], answer: 0, quick: true,
    explanation: "A = b × h = 9 × 4 = 36 cm².",
  },
  {
    id: "m-g-3", subject: "math", standard: "NC.6.G.2", skill: "Volume",
    prompt: "What is the volume of a cargo box that is 2.5 m × 2 m × 4 m?",
    choices: ["20 m³", "8.5 m³", "17 m³", "40 m³"], answer: 0, quick: true,
    explanation: "V = l × w × h = 2.5 × 2 × 4 = 20 m³.",
  },
  {
    id: "m-g-4", subject: "math", standard: "NC.6.G.3", skill: "Polygons on the coordinate plane",
    prompt: "A rectangle has vertices (1, 1), (1, 5), (6, 5), and (6, 1). What is its perimeter?",
    choices: ["18 units", "20 units", "9 units", "22 units"], answer: 0,
    explanation: "Width = 6 − 1 = 5. Height = 5 − 1 = 4. Perimeter = 2(5 + 4) = 18.",
  },
  {
    id: "m-g-5", subject: "math", standard: "NC.6.G.4", skill: "Nets & surface area",
    prompt: "A cube has edges that are 3 inches long. What is its surface area?",
    choices: ["54 in²", "27 in²", "36 in²", "18 in²"], answer: 0, quick: true,
    explanation: "Each face is 3 × 3 = 9 in², and a cube has 6 faces: 6 × 9 = 54 in².",
  },

  // ---- Statistics & Probability ----
  {
    id: "m-sp-1", subject: "math", standard: "NC.6.SP.1", skill: "Statistical questions",
    prompt: "Which is a statistical question?",
    choices: [
      "How many hours do students in my class sleep each night?",
      "How old am I?",
      "What is 7 × 8?",
      "How tall is the school flagpole?",
    ], answer: 0,
    explanation: "A statistical question expects variability in the answers — each student sleeps a different amount.",
  },
  {
    id: "m-sp-2", subject: "math", standard: "NC.6.SP.3", skill: "Mean, median, range",
    prompt: "Find the mean of 4, 8, 6, 10, 7.",
    choices: ["7", "6", "8", "35"], answer: 0, quick: true,
    explanation: "Sum = 35. There are 5 values. 35 ÷ 5 = 7.",
  },
  {
    id: "m-sp-3", subject: "math", standard: "NC.6.SP.3", skill: "Mean, median, range",
    prompt: "Find the median of 3, 9, 4, 12, 7, 5.",
    choices: ["6", "7", "5.5", "9"], answer: 0, quick: true,
    explanation: "Order them: 3, 4, 5, 7, 9, 12. Two middle values: (5 + 7) ÷ 2 = 6.",
  },
  {
    id: "m-sp-4", subject: "math", standard: "NC.6.SP.3", skill: "Mean, median, range",
    prompt: "Find the range of 15, 22, 9, 30, 18.",
    choices: ["21", "30", "18", "9"], answer: 0, quick: true,
    explanation: "Range = greatest − least = 30 − 9 = 21.",
  },
  {
    id: "m-sp-5", subject: "math", standard: "NC.6.SP.5", skill: "Choosing measures of center",
    prompt: "Data: 2, 3, 3, 4, 25. Which measure best describes a typical value?",
    choices: ["Median", "Mean", "Range", "Maximum"], answer: 0, quick: true,
    explanation: "25 is an outlier that pulls the mean up to 7.4. The median (3) is not affected by it.",
  },
  {
    id: "m-sp-6", subject: "math", standard: "NC.6.SP.4", skill: "Data displays",
    prompt: "Which data display shows the median and quartiles of a data set?",
    choices: ["Box plot", "Line graph", "Circle graph", "Pictograph"], answer: 0, quick: true,
    explanation: "A box plot (box-and-whisker) is built from the minimum, Q1, median, Q3, and maximum.",
  },
  {
    id: "m-sp-7", subject: "math", standard: "NC.6.SP.5", skill: "Choosing measures of center",
    prompt: "What does the mean absolute deviation (MAD) tell you about a data set?",
    choices: [
      "How spread out the values are from the mean",
      "The middle value",
      "The most common value",
      "The total of all values",
    ], answer: 0,
    explanation: "MAD is the average distance of each value from the mean — a measure of variability.",
  },
];

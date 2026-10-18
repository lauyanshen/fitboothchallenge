const GRAINS =
  "https://foodbuyingguide.fns.usda.gov/FoodComponents/ResourceGrains";
const FRUIT =
  "https://foodbuyingguide.fns.usda.gov/FoodComponents/ResourceFruits";
const WATER = "https://www.cdc.gov/healthy-weight-growth/water-healthy-drinks/";
const c = (id, label, image, detail = "") => ({ id, label, image, detail });
const bread = [
  c("wholemeal", "Wholemeal bread", "wholemeal", "Made with wholemeal flour"),
  c("white", "White bread", "white-bread", "Made with refined wheat flour"),
];
const rice = [
  c("brown", "Brown rice", "brown-rice"),
  c("white", "White rice", "white-rice"),
];
const fruit = [
  c("apple", "Apple", "apple"),
  c("juice", "Apple juice", "juice", "Clear, filtered juice"),
];
const drinks = [
  c("water", "Water", "water"),
  c("juice", "Apple juice", "juice", "100% juice"),
];
function q(
  id,
  group,
  prompt,
  choices,
  correct,
  explanation,
  source,
  hint = "",
) {
  return {
    id,
    group,
    category: group,
    prompt,
    choices,
    correct,
    explanation,
    source,
    hint,
  };
}
export const QUESTIONS = [
  q(
    "bread-1",
    "Whole-grain clues",
    "Which bread is made with the whole grain?",
    bread,
    "wholemeal",
    "Wholemeal flour keeps all three parts of the wheat grain: bran, germ and endosperm.",
    GRAINS,
  ),
  q(
    "bread-2",
    "Whole-grain clues",
    "Which bread keeps the bran and germ?",
    bread,
    "wholemeal",
    "Wholemeal flour retains the bran and germ. Refining wheat flour removes them.",
    GRAINS,
  ),
  q(
    "bread-3",
    "Whole-grain clues",
    "Which ingredient points to a whole-grain bread?",
    bread,
    "wholemeal",
    "Look for wholemeal or whole-wheat flour in the ingredients. Colour alone cannot tell you.",
    GRAINS,
    "Read the ingredient clues below the pictures.",
  ),
  q(
    "rice-1",
    "Rice discoveries",
    "Which rice is a whole grain?",
    rice,
    "brown",
    "Brown rice keeps the bran and germ, making it a whole grain.",
    GRAINS,
  ),
  q(
    "rice-2",
    "Rice discoveries",
    "Which rice still has its bran layer?",
    rice,
    "brown",
    "Brown rice retains its bran layer. Milling white rice removes the bran and germ.",
    GRAINS,
  ),
  q(
    "rice-3",
    "Rice discoveries",
    "Which rice has had its bran and germ removed?",
    rice,
    "white",
    "White rice is milled to remove the bran and germ. Brown rice retains them.",
    GRAINS,
  ),
  q(
    "fruit-1",
    "Fruit discoveries",
    "Which keeps more of the fruit’s fibre?",
    fruit,
    "apple",
    "Whole apples retain more fibre than clear, filtered apple juice.",
    FRUIT,
  ),
  q(
    "fruit-2",
    "Fruit discoveries",
    "Which snack keeps more of the fruit’s fibre?",
    fruit,
    "apple",
    "An apple eaten with its peel keeps fibre that clear, filtered juice leaves behind.",
    FRUIT,
    "The apple is eaten with its peel.",
  ),
  q(
    "fruit-3",
    "Fruit discoveries",
    "Which option keeps the fruit’s solid flesh?",
    [
      c("orange", "Orange", "orange"),
      c("juice", "Apple juice", "juice", "Clear, filtered juice"),
    ],
    "orange",
    "Whole fruit keeps its solid flesh and fibre. Clear, filtered juice contains less fibre.",
    FRUIT,
  ),
  q(
    "water-1",
    "Drink discoveries",
    "Which drink has no sugar at all?",
    drinks,
    "water",
    "Plain water has no sugar. Even 100% fruit juice contains naturally occurring fruit sugars.",
    WATER,
  ),
  q(
    "water-2",
    "Drink discoveries",
    "Which drink provides water without calories?",
    drinks,
    "water",
    "Plain water hydrates without calories. Fruit juice contains energy from natural sugars.",
    WATER,
  ),
  q(
    "water-3",
    "Drink discoveries",
    "Which drink can contain sugar without any being added?",
    drinks,
    "juice",
    "100% apple juice contains natural fruit sugars. “No added sugar” does not mean “no sugar”.",
    FRUIT,
  ),
  q(
    "label-1",
    "Look a little closer",
    "Which bottle contains less sugar in total?",
    [
      c("a", "Apple drink A", "juice", "4 g / 100 ml · 250 ml bottle"),
      c("b", "Apple drink B", "juice", "3 g / 100 ml · 500 ml bottle"),
    ],
    "a",
    "Bottle A contains 10 g of sugar; bottle B contains 15 g. Bottle size matters too.",
    "Illustrative labels; 4 × 2.5 = 10; 3 × 5 = 15.",
    "Use the example labels. Compare the whole bottle.",
  ),
  q(
    "label-2",
    "Look a little closer",
    "Which bottle contains less sugar in total?",
    [
      c("a", "Apple drink A", "juice", "5 g / 100 ml · 200 ml bottle"),
      c("b", "Apple drink B", "juice", "3 g / 100 ml · 250 ml bottle"),
    ],
    "b",
    "Bottle A contains 10 g of sugar; bottle B contains 7.5 g. Compare the whole bottle.",
    "Illustrative labels; 5 × 2 = 10; 3 × 2.5 = 7.5.",
    "Use the example labels. Compare the whole bottle.",
  ),
  q(
    "label-3",
    "Look a little closer",
    "Which slice has more fibre?",
    [
      c("a", "Bread A", "white-bread", "2 g fibre per slice"),
      c("b", "Bread B", "wholemeal", "4 g fibre per slice"),
    ],
    "b",
    "The example label gives bread B 4 g of fibre per slice, compared with 2 g for bread A.",
    "Illustrative labels; direct numeric comparison.",
    "Read the example labels, rather than judging by colour.",
  ),
];
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function createRound(random = Math.random) {
  const groups = [...new Set(QUESTIONS.map((item) => item.group))];
  return shuffle(
    groups.map((group) => {
      const pool = QUESTIONS.filter((item) => item.group === group);
      const item = pool[Math.floor(random() * pool.length)];
      return { ...item, choices: shuffle(item.choices, random) };
    }),
    random,
  );
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
export function isBetter(result, best) {
  return (
    !best ||
    result.score > best.score ||
    (result.score === best.score && result.time < best.time)
  );
}
export function readBest() {
  try {
    const best = JSON.parse(localStorage.getItem("fit-detective-best-v1"));
    if (
      best?.date === localDate() &&
      Number.isInteger(best.score) &&
      best.score >= 0 &&
      best.score <= 5 &&
      Number.isFinite(best.time) &&
      best.time >= 0 &&
      best.time <= 30
    )
      return best;
  } catch {
    /* Storage may be unavailable. */
  }
  return null;
}
export function saveBest(result) {
  try {
    localStorage.setItem(
      "fit-detective-best-v1",
      JSON.stringify({ ...result, date: localDate() }),
    );
  } catch {
    /* Game still works without storage. */
  }
}

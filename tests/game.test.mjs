import test from "node:test";
import assert from "node:assert/strict";
import {
  QUESTIONS,
  createRound,
  shuffle,
  isBetter,
  readBest,
  saveBest,
  localDate,
} from "../src/game.js";
test("every round has five different topics and one valid answer per question", () => {
  for (let i = 0; i < 1000; i++) {
    const round = createRound();
    assert.equal(round.length, 5);
    assert.equal(new Set(round.map((q) => q.group)).size, 5);
    for (const q of round) {
      assert.equal(q.choices.length, 2);
      assert.equal(q.choices.filter((c) => c.id === q.correct).length, 1);
      assert.ok(q.explanation && q.source);
    }
  }
  assert.equal(QUESTIONS.length, 15);
});
test("shuffle does not mutate the source and can move either answer to the left", () => {
  const source = [1, 2];
  assert.deepEqual(
    shuffle(source, () => 0),
    [2, 1],
  );
  assert.deepEqual(
    shuffle(source, () => 0.99),
    [1, 2],
  );
  assert.deepEqual(source, [1, 2]);
});
test("records prioritise accuracy over speed, then faster ties", () => {
  assert.ok(isBetter({ score: 5, time: 29 }, { score: 4, time: 5 }));
  assert.ok(!isBetter({ score: 3, time: 2 }, { score: 4, time: 25 }));
  assert.ok(isBetter({ score: 4, time: 12 }, { score: 4, time: 14 }));
  assert.ok(!isBetter({ score: 4, time: 14 }, { score: 4, time: 14 }));
});
test("storage accepts current valid scores, rejects stale/corrupt data and tolerates errors", () => {
  let value;
  globalThis.localStorage = {
    getItem: () => value,
    setItem: (key, item) => {
      value = item;
    },
  };
  saveBest({ score: 4, time: 15.5 });
  assert.deepEqual(readBest(), { score: 4, time: 15.5, date: localDate() });
  value = JSON.stringify({ score: 4, time: 15, date: "2000-1-1" });
  assert.equal(readBest(), null);
  value = JSON.stringify({ score: 9, time: 15, date: localDate() });
  assert.equal(readBest(), null);
  value = "invalid";
  assert.equal(readBest(), null);
  globalThis.localStorage = {
    getItem() {
      throw Error("blocked");
    },
    setItem() {
      throw Error("blocked");
    },
  };
  assert.equal(readBest(), null);
  assert.doesNotThrow(() => saveBest({ score: 3, time: 20 }));
});

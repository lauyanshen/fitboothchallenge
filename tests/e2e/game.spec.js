import { test, expect } from "@playwright/test";
import { QUESTIONS } from "../../src/game.js";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.7;
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Start Challenge", exact: true }),
  ).toBeEnabled();
});

async function answer(page, correct = true) {
  const prompt = await page.locator("h1").innerText();
  const question = QUESTIONS.find((q) => q.prompt === prompt);
  const choice = question.choices.find((c) =>
    correct ? c.id === question.correct : c.id !== question.correct,
  );
  await page
    .getByRole("button", {
      name: choice.label + (choice.detail ? `, ${choice.detail}` : ""),
      exact: true,
    })
    .click();
}
async function complete(page, firstWrong = false) {
  for (let i = 0; i < 5; i++) {
    await answer(page, !(firstWrong && i === 0));
    await page
      .getByRole("button", {
        name: i === 4 ? "See my score" : "Next question",
        exact: true,
      })
      .click();
  }
}
test("timed round scores correctly, locks answers, pauses feedback, saves best and links to Fit+", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install();
  await page
    .getByRole("button", { name: "Start Challenge", exact: true })
    .click();
  await page.clock.fastForward(1200);
  await answer(page, false);
  await expect(page.locator(".choice:disabled")).toHaveCount(2);
  const time = await page.locator(".timer strong").innerText();
  await page.clock.fastForward(5000);
  await expect(page.locator(".timer strong")).toHaveText(time);
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  for (let i = 1; i < 5; i++) {
    await answer(page);
    await page
      .getByRole("button", {
        name: i === 4 ? "See my score" : "Next question",
        exact: true,
      })
      .click();
  }
  await expect(page.locator(".score")).toHaveText("4/5");
  await expect(page.locator(".explore")).toHaveAttribute(
    "href",
    "https://fit-plus-health.eddielau.chatgpt.site",
  );
  await expect(page.locator(".explore")).toHaveAttribute("target", "_blank");
  await page
    .getByRole("button", { name: "Back to start", exact: true })
    .last()
    .click();
  await expect(page.locator(".best")).toContainText("4/5");
  expect(errors).toEqual([]);
});
test("timer expires with no answer and shows a friendly result", async ({
  page,
}) => {
  await page.clock.install();
  await page
    .getByRole("button", { name: "Start Challenge", exact: true })
    .click();
  await page.clock.fastForward(31000);
  await expect(page.locator(".score")).toHaveText("0/5");
  await expect(page.locator(".result-caption")).toContainText("Time’s up");
  await expect(page.locator(".choice")).toHaveCount(0);
});
test("untimed play can finish and replay without creating a timed record", async ({
  page,
}) => {
  await page.clock.install();
  await page
    .getByRole("button", { name: "Take your time", exact: false })
    .click();
  await page.clock.fastForward(90000);
  await expect(page.locator(".timer strong")).toHaveText("∞");
  await complete(page);
  await expect(page.locator(".score")).toHaveText("5/5");
  expect(
    await page.evaluate(() => localStorage.getItem("fit-detective-best-v1")),
  ).toBeNull();
  await page.getByRole("button", { name: "Play again", exact: true }).click();
  await expect(page.locator(".progress-group p")).toHaveText("Question 1 of 5");
});
test("keyboard choices and instructions work", async ({ page }) => {
  await page.getByRole("button", { name: "How to play" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page
    .getByRole("button", { name: "Take your time", exact: false })
    .click();
  await page.keyboard.press("1");
  await expect(page.locator(".feedback")).toBeVisible();
  await expect(page.locator(".choice:disabled")).toHaveCount(2);
  await page.getByRole("button", { name: "Sound off", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Sound on", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
test("production game reloads and plays offline after caching", async ({
  page,
  context,
}) => {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Start Challenge", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Take your time", exact: false })
    .click();
  await complete(page);
  await expect(page.locator(".score")).toHaveText("5/5");
});
test("mobile screens stay within viewport and use visitor-facing copy", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page
    .getByRole("button", { name: "Take your time", exact: false })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await complete(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await expect(page.locator("body")).not.toContainText(
    /Booth Challenge|Next Visitor|Demo score|Prototype/,
  );
});

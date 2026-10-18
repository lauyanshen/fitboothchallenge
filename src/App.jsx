import { useEffect, useRef, useState } from "react";
import {
  ArrowRightIcon,
  HeartbeatIcon,
  MagnifyingGlassIcon,
  TrophyIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
  CheckCircleIcon,
  ArrowCounterClockwiseIcon,
  ClockIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  createRound,
  isBetter,
  readBest,
  saveBest,
  QUESTIONS,
} from "./game.js";
import "@fontsource/nunito/latin-900.css";
import "@fontsource/nunito-sans/latin-400.css";
import "@fontsource/nunito-sans/latin-600.css";
import "@fontsource/nunito-sans/latin-800.css";

const FIT_URL = "https://fit-plus-health.eddielau.chatgpt.site";
const asset = (name) => `${import.meta.env.BASE_URL}assets/${name}.webp`;
function Brand({ light = false }) {
  return (
    <span className={`brand ${light ? "brand-light" : ""}`}>
      <HeartbeatIcon weight="bold" aria-hidden="true" />
      <span>
        Fit<span className="brand-plus">+</span>
      </span>
    </span>
  );
}

export function App() {
  const [screen, setScreen] = useState("start");
  const [round, setRound] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [remaining, setRemaining] = useState(30000);
  const [untimed, setUntimed] = useState(false);
  const [sound, setSound] = useState(false);
  const [best, setBest] = useState(readBest);
  const [newBest, setNewBest] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);
  const [assetError, setAssetError] = useState(false);
  const active = useRef(false);
  const clock = useRef({ budget: 30000, start: 0 });
  const audio = useRef(null);
  const heading = useRef(null);
  const dialog = useRef(null);
  const question = round[index];
  const score = answers.filter((a) => a.correct).length;

  useEffect(() => {
    let cancelled = false;
    const names = [
      ...new Set(QUESTIONS.flatMap((q) => q.choices.map((c) => c.image))),
    ];
    Promise.all(
      names.map(
        (name) =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = asset(name);
          }),
      ),
    )
      .then(() => {
        if (!cancelled) setAssetsReady(true);
      })
      .catch(() => {
        if (!cancelled) setAssetError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    heading.current?.focus();
  }, [screen, index]);
  useEffect(() => {
    if (showInstructions) dialog.current?.showModal();
    else dialog.current?.close();
  }, [showInstructions]);

  function chime(correct) {
    if (!sound) return;
    try {
      audio.current ||= new (window.AudioContext ||
        window.webkitAudioContext)();
      audio.current.resume();
      const ctx = audio.current,
        oscillator = ctx.createOscillator(),
        gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.setValueAtTime(correct ? 660 : 330, ctx.currentTime);
      oscillator.frequency.setValueAtTime(
        correct ? 880 : 280,
        ctx.currentTime + 0.09,
      );
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.25);
    } catch {
      /* Sound is optional. */
    }
  }
  function finish(finalAnswers, left, expired = false) {
    active.current = false;
    setRemaining(left);
    setTimedOut(expired);
    setScreen("result");
    if (!untimed) {
      const result = {
        score: finalAnswers.filter((a) => a.correct).length,
        time: Math.round((30000 - left) / 100) / 10,
      };
      const previous = readBest(),
        better = isBetter(result, previous);
      setNewBest(better);
      if (better) {
        saveBest(result);
        setBest(result);
      }
    }
  }
  useEffect(() => {
    if (screen !== "play" || feedback || untimed) return;
    clock.current.start = performance.now();
    active.current = true;
    const id = window.setInterval(() => {
      const left = Math.max(
        0,
        clock.current.budget - (performance.now() - clock.current.start),
      );
      setRemaining(left);
      if (left <= 0 && active.current) {
        active.current = false;
        finish(answers, 0, true);
      }
    }, 50);
    return () => clearInterval(id);
  }, [screen, index, feedback, untimed]);
  function start(practice = false) {
    setRound(createRound());
    setIndex(0);
    setAnswers([]);
    setFeedback(null);
    setRemaining(30000);
    setUntimed(practice);
    setNewBest(false);
    setTimedOut(false);
    clock.current = { budget: 30000, start: performance.now() };
    active.current = true;
    setScreen("play");
  }
  function choose(choice) {
    if (feedback || !active.current) return;
    const left = untimed
      ? 30000
      : Math.max(
          0,
          clock.current.budget - (performance.now() - clock.current.start),
        );
    active.current = false;
    if (!untimed && left <= 0) {
      finish(answers, 0, true);
      return;
    }
    clock.current.budget = left;
    setRemaining(left);
    const correct = choice.id === question.correct;
    setAnswers((previous) => [...previous, { question, choice, correct }]);
    setFeedback({ correct, choice: choice.id });
    chime(correct);
  }
  function next() {
    if (index === round.length - 1) {
      finish(answers, clock.current.budget);
      return;
    }
    setFeedback(null);
    setIndex((previous) => previous + 1);
    active.current = true;
  }
  function home() {
    active.current = false;
    setFeedback(null);
    setScreen("start");
    setBest(readBest());
  }
  useEffect(() => {
    function keydown(event) {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey)
        return;
      if (screen === "play" && !feedback && ["1", "2"].includes(event.key)) {
        event.preventDefault();
        choose(question.choices[Number(event.key) - 1]);
      }
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  });
  const fact =
    answers.find((a) => !a.correct)?.question ||
    answers.at(-1)?.question ||
    round[0];
  const badgeTitle =
    score === 5
      ? "Super Sleuth!"
      : score >= 3
        ? "Food Detective!"
        : "Curious Explorer!";

  return (
    <div className={`app ${screen}`}>
      {screen === "start" && (
        <>
          <header className="topbar">
            <Brand />
            <button className="quiet" onClick={() => setShowInstructions(true)}>
              How to play
            </button>
          </header>
          <main className="welcome">
            <img
              className="hero"
              src={asset("hero")}
              alt="An apple, water, wholemeal bread and a magnifying glass"
              fetchPriority="high"
            />
            <div className="welcome-copy">
              <p className="eyebrow">A LITTLE CURIOSITY. A BIG DISCOVERY.</p>
              <h1 ref={heading} tabIndex={-1}>
                Food
                <br />
                Detective<span className="orange">.</span>
              </h1>
              <p className="welcome-line">
                5 questions. 30 seconds.
                <br />
                Can you get them all?
              </p>
              <button
                className="primary start-button"
                disabled={!assetsReady}
                onClick={() => start()}
              >
                {assetError
                  ? "Please refresh to try again"
                  : assetsReady
                    ? "Start Challenge"
                    : "Getting ready…"}
                <ArrowRightIcon weight="bold" />
              </button>
              <button
                className="text-button practice"
                disabled={!assetsReady}
                onClick={() => start(true)}
              >
                Take your time <span>— play without a timer</span>
              </button>
            </div>
          </main>
          <footer className="welcome-footer">
            <div className="journey">
              <span>
                <MagnifyingGlassIcon />
                Spot the clues
              </span>
              <ArrowRightIcon />
              <span>Discover something new</span>
            </div>
            {best ? (
              <div className="best">
                <TrophyIcon />
                <span>
                  Today’s best{" "}
                  <strong>
                    {best.score}/5 · {best.time.toFixed(1)}s
                  </strong>
                </span>
              </div>
            ) : (
              <span className="first-score">
                Your next small win starts here.
              </span>
            )}
          </footer>
        </>
      )}
      {screen === "play" && (
        <>
          <header className="topbar game-top">
            <div className="game-brand">
              <Brand light />
              <span className="game-name">FOOD DETECTIVE</span>
            </div>
            <button className="quiet light" onClick={home}>
              Start over
            </button>
          </header>
          <main className="game-main">
            <div className="game-status">
              <div className="progress-group">
                <ol className="steps" aria-label="Question progress">
                  {round.map((q, i) => (
                    <li
                      key={q.id}
                      aria-current={i === index ? "step" : undefined}
                      className={
                        i === index ? "current" : i < index ? "done" : ""
                      }
                    >
                      {i < index ? <CheckCircleIcon weight="fill" /> : i + 1}
                    </li>
                  ))}
                </ol>
                <p>Question {index + 1} of 5</p>
              </div>
              <div
                className={`timer ${remaining < 6000 && !untimed ? "urgent" : ""}`}
                role="timer"
                aria-label={
                  untimed
                    ? "No time limit"
                    : `${Math.ceil(remaining / 1000)} seconds left`
                }
              >
                <ClockIcon />
                <strong>
                  {untimed ? "∞" : `${Math.ceil(remaining / 1000)}s`}
                </strong>
                <span>
                  {untimed
                    ? "Take your time"
                    : feedback
                      ? "Paused"
                      : "Time left"}
                </span>
              </div>
            </div>
            <p className="question-category">{question.category}</p>
            <h1 className="question" ref={heading} tabIndex={-1}>
              {question.prompt}
            </h1>
            {question.hint && <p className="question-hint">{question.hint}</p>}
            <div className={`choices ${feedback ? "answered" : ""}`}>
              {question.choices.map((choice, i) => (
                <button
                  key={choice.id}
                  className={`choice ${feedback && choice.id === question.correct ? "correct" : ""} ${feedback && feedback.choice === choice.id && !feedback.correct ? "incorrect" : ""}`}
                  onClick={() => choose(choice)}
                  disabled={!!feedback}
                  aria-label={`${choice.label}${choice.detail ? `, ${choice.detail}` : ""}`}
                >
                  <img src={asset(choice.image)} alt="" />
                  <span className="food-name">{choice.label}</span>
                  {choice.detail && (
                    <span className="food-detail">{choice.detail}</span>
                  )}
                  <span className="choose-label">
                    {feedback ? (
                      choice.id === question.correct ? (
                        <>
                          <CheckCircleIcon weight="fill" />
                          Correct answer
                        </>
                      ) : feedback.choice === choice.id ? (
                        "Your choice"
                      ) : (
                        " "
                      )
                    ) : (
                      <>
                        Choose
                        <ArrowRightIcon weight="bold" />
                      </>
                    )}
                  </span>
                  {!feedback && (
                    <span className="key-hint" aria-hidden="true">
                      {i + 1}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {feedback ? (
              <div className="feedback" role="status">
                <div>
                  <strong>
                    {feedback.correct
                      ? "Great spotting!"
                      : "A new clue for next time."}
                  </strong>
                  <p>{question.explanation}</p>
                </div>
                <button className="primary" onClick={next}>
                  {index === 4 ? "See my score" : "Next question"}
                  <ArrowRightIcon />
                </button>
              </div>
            ) : (
              <p className="answer-hint">
                Choose one answer <span>· You can also press 1 or 2</span>
              </p>
            )}
          </main>
          <footer className="game-footer">
            <span>
              {untimed
                ? "Enjoy discovering at your own pace."
                : "The clock pauses while you read each clue."}
            </span>
            <button
              className="sound-button"
              onClick={() => setSound((value) => !value)}
              aria-pressed={sound}
            >
              {sound ? <SpeakerHighIcon /> : <SpeakerSlashIcon />}Sound{" "}
              {sound ? "on" : "off"}
            </button>
          </footer>
        </>
      )}
      {screen === "result" && (
        <>
          <aside className="result-side">
            <Brand light />
            <div className="medallion">
              <p className="result-side-title">
                Small clues.
                <br />
                Big discoveries.
              </p>
              <img
                src={asset("badge")}
                alt="Golden apple and magnifying-glass achievement badge"
              />
              <p className="eyebrow">CHALLENGE COMPLETE</p>
            </div>
            <button className="quiet light" onClick={home}>
              <ArrowCounterClockwiseIcon />
              Back to start
            </button>
          </aside>
          <main className="result-main">
            <div className="result-summary">
              <p className="score" aria-label={`${score} out of 5`}>
                {score}
                <span>/5</span>
              </p>
              <h1 ref={heading} tabIndex={-1}>
                {badgeTitle}
              </h1>
              <p className="result-caption">
                {timedOut
                  ? "Time’s up! Every clue is a new discovery."
                  : score === 5
                    ? "You spotted every clue. Brilliant work!"
                    : "Great exploring. There’s always more to discover."}
              </p>
              <div className="result-meta">
                {untimed
                  ? "Played at your own pace"
                  : `${((30000 - remaining) / 1000).toFixed(1)} seconds of detective work`}
                {newBest && (
                  <span>
                    <TrophyIcon weight="fill" /> Today’s best!
                  </span>
                )}
              </div>
            </div>
            <div className="takeaway">
              <img
                src={asset(
                  fact?.choices.find((c) => c.id === fact.correct)?.image ||
                    "apple",
                )}
                alt=""
              />
              <div>
                <p className="eyebrow">ONE THING TO REMEMBER</p>
                <p>
                  {fact?.explanation ||
                    "A little curiosity can lead to a new discovery."}
                </p>
              </div>
            </div>
            <a
              className="primary explore"
              href={FIT_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Explore Fit+
              <ArrowRightIcon weight="bold" />
            </a>
            <p className="explore-caption">
              Discover your next small win with Fit+.
            </p>
            <div className="support">
              <p>Enjoyed the challenge?</p>
              <strong>Support Fit+ with a star!</strong>
            </div>
            <div className="result-actions">
              <button className="text-button" onClick={() => start(untimed)}>
                Play again
                <ArrowCounterClockwiseIcon />
              </button>
              <button className="outline" onClick={home}>
                Back to start
                <ArrowRightIcon />
              </button>
            </div>
          </main>
        </>
      )}
      <dialog
        ref={dialog}
        className="instructions"
        aria-labelledby="instructions-title"
        onClose={() => setShowInstructions(false)}
        onClick={(e) => {
          if (e.target === dialog.current) setShowInstructions(false);
        }}
      >
        <button
          className="close"
          aria-label="Close instructions"
          onClick={() => setShowInstructions(false)}
        >
          <XIcon />
        </button>
        <h2 id="instructions-title">Follow your curiosity.</h2>
        <p>
          Choose between two foods in each of five questions. You have 30
          seconds to answer. The clock pauses while you read each explanation.
        </p>
        <p>
          Want a gentler pace? Choose <strong>Take your time</strong> to play
          without a timer.
        </p>
        <p>
          One point for every correct answer. Today’s best is saved on this
          device; untimed games don’t enter the record.
        </p>
        <p className="source-label">Curious about the facts?</p>
        <a
          href="https://foodbuyingguide.fns.usda.gov/FoodComponents/ResourceGrains"
          target="_blank"
          rel="noreferrer"
        >
          USDA · Whole grains
        </a>
        <a
          href="https://foodbuyingguide.fns.usda.gov/FoodComponents/ResourceFruits"
          target="_blank"
          rel="noreferrer"
        >
          USDA · Fruit and fibre
        </a>
        <a
          href="https://www.cdc.gov/healthy-weight-growth/water-healthy-drinks/"
          target="_blank"
          rel="noreferrer"
        >
          CDC · Water and drinks
        </a>
        <button className="primary" onClick={() => setShowInstructions(false)}>
          Got it
          <ArrowRightIcon />
        </button>
      </dialog>
    </div>
  );
}

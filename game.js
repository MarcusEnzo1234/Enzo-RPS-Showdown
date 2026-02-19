/* =========================================================
   Enzo RPS Showdown - Rock Paper Scissors
   - No frameworks, no build tools
   - Safe event listeners
   - Retro kid-friendly UI
   ========================================================= */

(() => {
  "use strict";

  // ----- DOM helpers
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // ----- Screens / UI
  const menuScreen = $("#menuScreen");
  const gameScreen = $("#gameScreen");

  const startBtn = $("#startBtn");
  const creditsBtn = $("#creditsBtn");
  const backToMenuBtn = $("#backToMenuBtn");

  const creditsModal = $("#creditsModal");
  const creditsBackBtn = $("#creditsBackBtn");

  const choiceButtons = $$(".choice-btn");

  const playerChoiceEl = $("#playerChoice");
  const computerChoiceEl = $("#computerChoice");
  const resultTextEl = $("#resultText");

  const playerScoreEl = $("#playerScore");
  const computerScoreEl = $("#computerScore");
  const tiesScoreEl = $("#tiesScore");

  const playAgainBtn = $("#playAgainBtn");
  const resetBtn = $("#resetBtn");

  // Make sure required elements exist before proceeding
  const required = [
    menuScreen, gameScreen, startBtn, creditsBtn, backToMenuBtn,
    creditsModal, creditsBackBtn,
    playerChoiceEl, computerChoiceEl, resultTextEl,
    playerScoreEl, computerScoreEl, tiesScoreEl,
    playAgainBtn, resetBtn
  ];

  if (required.some((el) => !el)) {
    // If something is missing, don't crash with null errors.
    console.warn("Some UI elements are missing. Check index.html IDs.");
    return;
  }

  // ----- Game state
  const CHOICES = ["rock", "paper", "scissors"];

  const prettyName = (choice) => {
    switch (choice) {
      case "rock": return "Rock 🪨";
      case "paper": return "Paper 📄";
      case "scissors": return "Scissors ✂️";
      default: return "—";
    }
  };

  const state = {
    playerScore: 0,
    computerScore: 0,
    ties: 0,
    lastRoundPlayed: false
  };

  // ----- Optional tiny sound effects via Web Audio (safe)
  let audioCtx = null;

  function beep(type = "click") {
    // Create audio context lazily to avoid autoplay restrictions.
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return; // Browser doesn't support it; silently ignore.
      audioCtx = new AudioContext();
    }

    // If context is suspended (common on mobile), resume on user gesture.
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }

    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();

    // Cute retro tones
    const now = audioCtx.currentTime;
    const settings = {
      click: { freq: 660, dur: 0.06 },
      win:   { freq: 880, dur: 0.12 },
      lose:  { freq: 220, dur: 0.14 },
      tie:   { freq: 440, dur: 0.10 }
    }[type] || { freq: 600, dur: 0.07 };

    o.type = "square";
    o.frequency.setValueAtTime(settings.freq, now);

    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + settings.dur);

    o.connect(g);
    g.connect(audioCtx.destination);

    o.start(now);
    o.stop(now + settings.dur + 0.02);
  }

  // ----- UI functions
  function showScreen(which) {
    if (which === "menu") {
      menuScreen.classList.add("screen--active");
      gameScreen.classList.remove("screen--active");
    } else {
      menuScreen.classList.remove("screen--active");
      gameScreen.classList.add("screen--active");
    }
  }

  function setResult(type, text) {
    resultTextEl.classList.remove("result--win", "result--lose", "result--tie", "result--idle");
    if (type === "win") resultTextEl.classList.add("result--win");
    else if (type === "lose") resultTextEl.classList.add("result--lose");
    else if (type === "tie") resultTextEl.classList.add("result--tie");
    else resultTextEl.classList.add("result--idle");

    resultTextEl.textContent = text;
  }

  function renderScores() {
    playerScoreEl.textContent = String(state.playerScore);
    computerScoreEl.textContent = String(state.computerScore);
    tiesScoreEl.textContent = String(state.ties);
  }

  function clearRoundUI() {
    playerChoiceEl.textContent = "—";
    computerChoiceEl.textContent = "—";
    setResult("idle", "Pick Rock, Paper, or Scissors!");
    state.lastRoundPlayed = false;
  }

  // ----- Game logic
  function getComputerChoice() {
    const idx = Math.floor(Math.random() * CHOICES.length);
    return CHOICES[idx];
  }

  function decideWinner(player, computer) {
    if (player === computer) return "tie";
    if (player === "rock" && computer === "scissors") return "win";
    if (player === "scissors" && computer === "paper") return "win";
    if (player === "paper" && computer === "rock") return "win";
    return "lose";
  }

  function playRound(playerChoice) {
    const computerChoice = getComputerChoice();

    playerChoiceEl.textContent = prettyName(playerChoice);
    computerChoiceEl.textContent = prettyName(computerChoice);

    const outcome = decideWinner(playerChoice, computerChoice);

    if (outcome === "win") {
      state.playerScore += 1;
      setResult("win", "You Win! 🎉");
      beep("win");
    } else if (outcome === "lose") {
      state.computerScore += 1;
      setResult("lose", "You Lose! 😵");
      beep("lose");
    } else {
      state.ties += 1;
      setResult("tie", "Tie! 🤝");
      beep("tie");
    }

    state.lastRoundPlayed = true;
    renderScores();
  }

  // ----- Modal controls
  function openCredits() {
    creditsModal.classList.add("modal--open");
    creditsModal.setAttribute("aria-hidden", "false");
  }

  function closeCredits() {
    creditsModal.classList.remove("modal--open");
    creditsModal.setAttribute("aria-hidden", "true");
  }

  // ----- Event listeners (safe, no null crashes)
  startBtn.addEventListener("click", () => {
    beep("click");
    showScreen("game");
    clearRoundUI();
    renderScores();
  });

  creditsBtn.addEventListener("click", () => {
    beep("click");
    openCredits();
  });

  creditsBackBtn.addEventListener("click", () => {
    beep("click");
    closeCredits();
  });

  // Click outside panel to close
  creditsModal.addEventListener("click", (e) => {
    const target = e.target;
    if (target && target.getAttribute && target.getAttribute("data-close") === "true") {
      beep("click");
      closeCredits();
    }
  });

  // ESC closes credits
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && creditsModal.classList.contains("modal--open")) {
      closeCredits();
    }
  });

  backToMenuBtn.addEventListener("click", () => {
    beep("click");
    showScreen("menu");
    closeCredits();
  });

  choiceButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = btn.getAttribute("data-choice");
      if (!choice) return;
      // For instant replay, just allow picking again
      playRound(choice);
    });
  });

  playAgainBtn.addEventListener("click", () => {
    beep("click");
    clearRoundUI();
  });

  resetBtn.addEventListener("click", () => {
    beep("click");
    state.playerScore = 0;
    state.computerScore = 0;
    state.ties = 0;
    renderScores();
    clearRoundUI();
    setResult("idle", "Scores reset! Pick a move!");
  });

  // ----- Initial UI
  showScreen("menu");
  closeCredits();
  renderScores();
})();

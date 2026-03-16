const vocabularyData = [
  { id: 1, word: "apple", meaning: "사과", emoji: "🍎", example: "I have a red apple." },
  { id: 2, word: "friend", meaning: "친구", emoji: "👫", example: "She is my good friend." },
  { id: 3, word: "water", meaning: "물", emoji: "💧", example: "Drink some water." },
  { id: 4, word: "happy", meaning: "행복한", emoji: "😊", example: "I feel very happy today." },
  { id: 5, word: "school", meaning: "학교", emoji: "🏫", example: "Let's go to school." },
  { id: 6, word: "book", meaning: "책", emoji: "📚", example: "Read this fun book." },
  { id: 7, word: "family", meaning: "가족", emoji: "👨‍👩‍👧‍👦", example: "I love my family." },
  { id: 8, word: "play", meaning: "놀다", emoji: "⚽", example: "Let's play outside." },
  { id: 9, word: "travel", meaning: "여행하다", emoji: "✈️", example: "We will travel by plane." },
  { id: 10, word: "sleep", meaning: "자다", emoji: "😴", example: "It is time to sleep." },
];

const QUIZ_LENGTH = 5;
const TIME_PER_QUESTION_SEC = 12;

const $ = (sel) => document.querySelector(sel);

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function sanitizeName(input) {
  return input.replace(/\s+/g, " ").trim().slice(0, 12);
}

function createChoiceButton(label, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "choice-btn";
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}

function setBadge(text, kind) {
  const badge = $("#resultBadge");
  badge.classList.remove("hidden", "badge-ok", "badge-no");
  badge.textContent = text;
  badge.classList.add(kind === "ok" ? "badge-ok" : "badge-no");
}

function hideBadge() {
  const badge = $("#resultBadge");
  badge.classList.add("hidden");
  badge.textContent = "";
}

function renderStars(starCount) {
  const stars = "⭐".repeat(clamp(starCount, 0, QUIZ_LENGTH));
  $("#starText").textContent = stars || "—";
}

function updateProgressUI(currentIndex, score) {
  const remaining = Math.max(0, QUIZ_LENGTH - currentIndex);
  $("#remainingCount").textContent = String(remaining);

  const percent = Math.round((currentIndex / QUIZ_LENGTH) * 100);
  $("#progressPercent").textContent = String(percent);
  $("#progressBar").style.width = `${percent}%`;

  renderStars(score);
}

function revealOnScrollInit() {
  const items = document.querySelectorAll(".reveal-on-scroll");
  if (items.length === 0) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      });
    },
    { threshold: 0.12 }
  );

  items.forEach((el) => io.observe(el));
}

let playerName = "";
let quiz = [];
let currentQuestionIndex = 0;
let score = 0;
let locked = false;
let timerId = null;
let timeLeft = TIME_PER_QUESTION_SEC;

function stopTimer() {
  if (timerId) window.clearInterval(timerId);
  timerId = null;
}

function setTimeLeft(sec) {
  timeLeft = clamp(sec, 0, TIME_PER_QUESTION_SEC);
  $("#timeLeft").textContent = String(timeLeft);
}

function startTimer() {
  stopTimer();
  setTimeLeft(TIME_PER_QUESTION_SEC);
  timerId = window.setInterval(() => {
    if (locked) return;
    setTimeLeft(timeLeft - 1);
    if (timeLeft <= 0) {
      onTimeout();
    }
  }, 1000);
}

function onTimeout() {
  locked = true;
  setBadge("⏱️ 시간 초과! 다음 문제로!", "no");
  const card = $("#questionCard");
  card.classList.remove("shake");
  void card.offsetWidth;
  card.classList.add("shake");
  window.setTimeout(() => {
    nextQuestion();
  }, 650);
}

function buildQuiz() {
  quiz = shuffle(vocabularyData).slice(0, QUIZ_LENGTH);
}

function renderQuestion() {
  hideBadge();
  locked = false;

  const q = quiz[currentQuestionIndex];
  if (!q) return;

  $("#wordEmoji").textContent = q.emoji;
  $("#wordText").textContent = q.word;
  $("#exampleLine").textContent = q.example;

  const meanings = vocabularyData.map((v) => v.meaning);
  const wrong = shuffle(meanings.filter((m) => m !== q.meaning)).slice(0, 3);
  const choices = shuffle([q.meaning, ...wrong]);

  const holder = $("#choices");
  holder.innerHTML = "";

  choices.forEach((label, idx) => {
    const prefix = String.fromCharCode("A".charCodeAt(0) + idx);
    const btn = createChoiceButton(`${prefix}. ${label}`, () => onPick(label, q.meaning));
    holder.appendChild(btn);
  });

  updateProgressUI(currentQuestionIndex, score);
  startTimer();
}

function lockChoices() {
  const btns = $("#choices").querySelectorAll("button");
  btns.forEach((b) => (b.disabled = true));
}

function onPick(picked, answer) {
  if (locked) return;
  locked = true;
  stopTimer();
  lockChoices();

  const isCorrect = picked === answer;
  if (isCorrect) {
    score += 1;
    setBadge("정답! ⭐ 충전!", "ok");
  } else {
    setBadge("오답! 다시 힘내자!", "no");
    const card = $("#questionCard");
    card.classList.remove("shake");
    void card.offsetWidth;
    card.classList.add("shake");
  }

  updateProgressUI(currentQuestionIndex + 1, score);
  window.setTimeout(() => nextQuestion(), 700);
}

function showFinalPanel() {
  const panel = $("#finalPanel");
  const title = $("#finalTitle");
  const desc = $("#finalDesc");
  panel.classList.remove("hidden");

  const escaped = score === QUIZ_LENGTH;
  if (escaped) {
    title.textContent = `🎉 지옥 탈출 성공! (${playerName || "도전자"})`;
    desc.textContent = "100% 달성! 화려한 폭죽(마음속으로)과 함께 경품 교환권을 받았습니다!";
    panel.classList.remove("bg-[#95A614]/15");
    panel.classList.add("bg-[#F28705]/15");
  } else {
    title.textContent = `😈 아직 탈출 실패… (${playerName || "도전자"})`;
    desc.textContent = `별 ${score}개 획득! 다음엔 5개 모두 모아서 완벽 탈출하자!`;
    panel.classList.remove("bg-[#F28705]/15");
    panel.classList.add("bg-[#95A614]/15");
  }
}

function hideFinalPanel() {
  $("#finalPanel").classList.add("hidden");
}

function nextQuestion() {
  currentQuestionIndex += 1;
  if (currentQuestionIndex >= QUIZ_LENGTH) {
    stopTimer();
    locked = true;
    lockChoices();
    updateProgressUI(QUIZ_LENGTH, score);
    showFinalPanel();
    return;
  }
  renderQuestion();
}

function scrollToQuiz() {
  const el = $("#quiz");
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetGame() {
  stopTimer();
  currentQuestionIndex = 0;
  score = 0;
  locked = false;
  buildQuiz();
  hideFinalPanel();
  renderQuestion();
}

function wireForm() {
  const form = $("#startForm");
  const input = $("#playerName");
  const error = $("#formError");
  const badge = $("#playerNameBadge");

  function setError(msg) {
    if (!msg) {
      error.textContent = "";
      error.classList.add("hidden");
      return;
    }
    error.textContent = msg;
    error.classList.remove("hidden");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = sanitizeName(input.value);
    if (!name) {
      setError("이름(닉네임)을 꼭 적어줘! (예: 지오 / 윤오)");
      input.focus();
      return;
    }
    setError("");
    playerName = name;
    badge.textContent = playerName;
    resetGame();
    scrollToQuiz();
  });

  input.addEventListener("input", () => {
    const name = sanitizeName(input.value);
    if (name) setError("");
  });
}

function wireRestartButtons() {
  const restart = () => {
    resetGame();
    scrollToQuiz();
  };

  $("#restartButton").addEventListener("click", restart);
  $("#restartTopButton").addEventListener("click", restart);
  $("#restartFooterButton").addEventListener("click", restart);
}

function init() {
  revealOnScrollInit();
  wireForm();
  wireRestartButtons();

  // Initial state (quiz locked until form is submitted)
  buildQuiz();
  $("#choices").innerHTML = "";
  $("#playerNameBadge").textContent = "아직 없음";
  updateProgressUI(0, 0);
  setTimeLeft(TIME_PER_QUESTION_SEC);
  hideFinalPanel();
}

document.addEventListener("DOMContentLoaded", init);



window.TEST_ENGINE = (() => {
  let pack = null;
  let session = null;
  let timerInterval = null;

  function initEngine(loadedPack) {
    validatePack(loadedPack);
    pack = loadedPack;
    session = createSession(pack);

    if (!window.TEST_UI || typeof window.TEST_UI.renderStartScreen !== "function") {
      throw new Error("TEST_UI.renderStartScreen is not available.");
    }

    window.TEST_UI.renderStartScreen(pack);
  }

  function validatePack(loadedPack) {
    if (!loadedPack) throw new Error("No test pack loaded.");
    if (!loadedPack.packId) throw new Error("Pack is missing packId.");
    if (!Array.isArray(loadedPack.questions) || loadedPack.questions.length === 0) {
      throw new Error("Pack is missing questions.");
    }
    if (!Array.isArray(loadedPack.sections) || loadedPack.sections.length === 0) {
      throw new Error("Pack is missing sections.");
    }
  }

  function createSession(loadedPack) {
    return {
      sessionId: makeSessionId(),
      packId: loadedPack.packId,
      examType: loadedPack.examType,
      level: loadedPack.level,
      version: loadedPack.version,
      status: "ready",
      timezone: loadedPack.timezone || "Asia/Tokyo",

      studentName: "",
      studentPin: "",

      startedAtTokyo: "",
      finishedAtTokyo: "",
      durationSec: 0,

      currentQuestionIndex: -1,
      currentSectionId: "",

      answers: {},
      flags: {},
      events: [],
      questionStats: {},

      timer: {
        startedAtMs: 0,
        endedAtMs: 0,
        elapsedSec: 0
      }
    };
  }

  function setStudentInfo({ studentName = "", studentPin = "" } = {}) {
    ensureSession();
    session.studentName = studentName.trim();
    session.studentPin = studentPin.trim();
  }

  function startTest() {
    ensureSession();
    ensurePack();

    if (session.status !== "ready") return;

    session.status = "in_progress";
    session.startedAtTokyo = getTokyoTimestamp();
    session.timer.startedAtMs = Date.now();
    session.timer.elapsedSec = 0;

    logEvent("TEST_START", {
      packId: pack.packId,
      examType: pack.examType,
      level: pack.level,
      version: pack.version
    });

    startTimerLoop();
    goToQuestion(0, { isInitial: true });
  }

  function goToQuestion(index, options = {}) {
    ensureInProgress();

    if (index < 0 || index >= pack.questions.length) return;

    const prevIndex = session.currentQuestionIndex;
    const prevQuestion = prevIndex >= 0 ? pack.questions[prevIndex] : null;
    const nextQuestion = pack.questions[index];

    if (prevQuestion && !options.isInitial) {
      exitQuestion(prevQuestion, nextQuestion.questionId);
    }

    session.currentQuestionIndex = index;
    session.currentSectionId = nextQuestion.sectionId;

    enterQuestion(prevQuestion ? prevQuestion.questionId : null, nextQuestion);

    renderCurrentQuestion();
  }

  function nextQuestion() {
    ensureInProgress();
    if (session.currentQuestionIndex < pack.questions.length - 1) {
      goToQuestion(session.currentQuestionIndex + 1);
    }
  }

  function prevQuestion() {
    ensureInProgress();
    if (session.currentQuestionIndex > 0) {
      goToQuestion(session.currentQuestionIndex - 1);
    }
  }

  function selectAnswer(questionId, choiceIndex) {
    ensureInProgress();

    const current = getCurrentQuestion();
    if (!current || current.questionId !== questionId) return;

    const prevAnswer = session.answers[questionId];
    const stats = getOrCreateQuestionStats(current);

    if (prevAnswer === undefined) {
      session.answers[questionId] = choiceIndex;
      stats.finalAnswerIndex = choiceIndex;
      if (stats.firstAnsweredAtSec === null) {
        stats.firstAnsweredAtSec = getElapsedSec();
      }

      logEvent("ANSWER_SELECT", {
        selectedIndex: choiceIndex
      });
    } else if (prevAnswer !== choiceIndex) {
      session.answers[questionId] = choiceIndex;
      stats.finalAnswerIndex = choiceIndex;
      stats.answerChangeCount += 1;
      stats.lastChangedAtSec = getElapsedSec();

      logEvent("ANSWER_CHANGE", {
        fromIndex: prevAnswer,
        toIndex: choiceIndex,
        changeCount: stats.answerChangeCount
      });
    }

    renderCurrentQuestion();
  }

  function toggleFlag(questionId) {
    ensureInProgress();

    const current = getCurrentQuestion();
    if (!current || current.questionId !== questionId) return;

    const stats = getOrCreateQuestionStats(current);
    const nextFlag = !Boolean(session.flags[questionId]);

    session.flags[questionId] = nextFlag;
    stats.flagged = nextFlag;

    logEvent("FLAG_TOGGLE", {
      flagged: nextFlag
    });

    renderCurrentQuestion();
  }

  function submitTest() {
    ensureInProgress();

    const current = getCurrentQuestion();
    if (current) {
      exitQuestion(current, null);
    }

    stopTimerLoop();

    session.status = "submitted";
    session.finishedAtTokyo = getTokyoTimestamp();
    session.timer.endedAtMs = Date.now();
    session.durationSec = getElapsedSec();
    session.timer.elapsedSec = session.durationSec;

    logEvent("TEST_SUBMIT", {
      totalAnswered: Object.keys(session.answers).length,
      totalFlagged: Object.values(session.flags).filter(Boolean).length
    });

    const result =
      window.TEST_SCORING && typeof window.TEST_SCORING.scoreSession === "function"
        ? window.TEST_SCORING.scoreSession(session, pack)
        : null;

    if (window.TEST_UI && typeof window.TEST_UI.renderResultScreen === "function") {
      window.TEST_UI.renderResultScreen(result, session);
    }
  }

  function getCurrentQuestion() {
    if (!pack || !session) return null;
    if (session.currentQuestionIndex < 0) return null;
    return pack.questions[session.currentQuestionIndex] || null;
  }

  function getSession() {
    return session;
  }

  function getPack() {
    return pack;
  }

  function renderCurrentQuestion() {
    const question = getCurrentQuestion();
    if (!question) return;

    if (!window.TEST_UI || typeof window.TEST_UI.renderQuestionScreen !== "function") {
      throw new Error("TEST_UI.renderQuestionScreen is not available.");
    }

    window.TEST_UI.renderQuestionScreen(question, session, pack);
  }

  function enterQuestion(fromQuestionId, question) {
    const stats = getOrCreateQuestionStats(question);
    stats.visitCount += 1;
    stats.enteredAtSec = getElapsedSec();
    stats.lastEnteredAtSec = stats.enteredAtSec;

    logEvent("QUESTION_ENTER", {
      fromQuestionId,
      toQuestionId: question.questionId,
      visitNumber: stats.visitCount
    }, question);
  }

  function exitQuestion(question, toQuestionId) {
    const stats = getOrCreateQuestionStats(question);
    const nowSec = getElapsedSec();
    const enteredAt = stats.enteredAtSec ?? nowSec;
    const dwellSecThisVisit = Math.max(0, nowSec - enteredAt);

    stats.totalTimeSpentSec += dwellSecThisVisit;
    stats.lastExitedAtSec = nowSec;
    stats.enteredAtSec = null;

    logEvent("QUESTION_EXIT", {
      toQuestionId,
      dwellSecThisVisit
    }, question);
  }

  function getOrCreateQuestionStats(question) {
    const qid = question.questionId;

    if (!session.questionStats[qid]) {
      session.questionStats[qid] = {
        questionId: qid,
        visitCount: 0,
        enteredAtSec: null,
        lastEnteredAtSec: null,
        lastExitedAtSec: null,
        totalTimeSpentSec: 0,
        answerChangeCount: 0,
        finalAnswerIndex: null,
        flagged: false,
        firstAnsweredAtSec: null,
        lastChangedAtSec: null
      };
    }

    return session.questionStats[qid];
  }

  function logEvent(type, payload = {}, question = null) {
    if (!window.TEST_EVENTS || typeof window.TEST_EVENTS.logEvent !== "function") {
      throw new Error("TEST_EVENTS.logEvent is not available.");
    }

    const q = question || getCurrentQuestion();
    const sectionId = q ? q.sectionId : session.currentSectionId || null;
    const questionId = q ? q.questionId : null;

    window.TEST_EVENTS.logEvent(session, {
      type,
      sectionId,
      questionId,
      payload
    });
  }

  function startTimerLoop() {
    stopTimerLoop();

    timerInterval = setInterval(() => {
      session.timer.elapsedSec = getElapsedSec();

      if (window.TEST_UI && typeof window.TEST_UI.renderTimer === "function") {
        window.TEST_UI.renderTimer(session.timer.elapsedSec, pack.totalTimeLimitSec);
      }
    }, 1000);
  }

  function stopTimerLoop() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function getElapsedSec() {
    if (!session || !session.timer.startedAtMs) return 0;
    return Math.floor((Date.now() - session.timer.startedAtMs) / 1000);
  }

  function getTokyoTimestamp() {
    return new Date().toLocaleString("sv-SE", {
      timeZone: "Asia/Tokyo",
      hour12: false
    }).replace(" ", "T");
  }

  function makeSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function ensurePack() {
    if (!pack) throw new Error("Pack not loaded.");
  }

  function ensureSession() {
    if (!session) throw new Error("Session not created.");
  }

  function ensureInProgress() {
    ensureSession();
    if (session.status !== "in_progress") {
      throw new Error("Test is not in progress.");
    }
  }

  return {
    initEngine,
    createSession,
    setStudentInfo,
    startTest,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    selectAnswer,
    toggleFlag,
    submitTest,
    getCurrentQuestion,
    getSession,
    getPack
  };
})();

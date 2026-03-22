
window.TEST_UI = (() => {
  const appId = "app";

  function getRoot() {
    const root = document.getElementById(appId);
    if (!root) throw new Error(`#${appId} container not found.`);
    return root;
  }

  function renderStartScreen(pack) {
    const root = getRoot();

    root.innerHTML = `
      <div class="screen start-screen">
        <div class="card">
          <h1>${escapeHtml(pack.title)}</h1>
          <p><strong>Level:</strong> ${escapeHtml(pack.level)}</p>
          <p><strong>Questions:</strong> ${pack.totalQuestions}</p>
          <p><strong>Time:</strong> ${formatTime(pack.totalTimeLimitSec)}</p>

          <div class="field">
            <label for="studentName">Student Name</label>
            <input id="studentName" type="text" autocomplete="off" />
          </div>

          <div class="field">
            <label for="studentPin">PIN</label>
            <input id="studentPin" type="text" autocomplete="off" />
          </div>

          <button id="startBtn" type="button">Start Test</button>
        </div>
      </div>
    `;

    const startBtn = document.getElementById("startBtn");
    startBtn.addEventListener("click", () => {
      const studentName = document.getElementById("studentName")?.value || "";
      const studentPin = document.getElementById("studentPin")?.value || "";

      window.TEST_ENGINE.setStudentInfo({ studentName, studentPin });
      window.TEST_ENGINE.startTest();
    });
  }

  function renderQuestionScreen(question, session, pack) {
    const root = getRoot();
    const currentIndex = session.currentQuestionIndex;
    const total = pack.questions.length;
    const selectedIndex = session.answers[question.questionId];
    const flagged = Boolean(session.flags[question.questionId]);
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === total - 1;

    const choicesHtml = question.choices
      .map((choice, index) => {
        const selectedClass = selectedIndex === index ? " selected" : "";
        return `
          <button
            class="choice-btn${selectedClass}"
            type="button"
            data-choice-index="${index}"
          >
            <span class="choice-label">${String.fromCharCode(65 + index)}.</span>
            <span class="choice-text">${escapeHtml(choice)}</span>
          </button>
        `;
      })
      .join("");

    root.innerHTML = `
      <div class="screen question-screen">
        <div class="topbar">
          <div class="topbar-left">
            <div><strong>${escapeHtml(pack.title)}</strong></div>
            <div>Question ${question.number} / ${total}</div>
            <div>Section: ${escapeHtml(getSectionTitle(pack, question.sectionId))}</div>
          </div>
          <div class="topbar-right">
            <div id="timerDisplay">Time: ${formatTime(session.timer.elapsedSec)}</div>
          </div>
        </div>

        <div class="progress-wrap">
          <div class="progress-text">${currentIndex + 1} of ${total}</div>
          <progress value="${currentIndex + 1}" max="${total}"></progress>
        </div>

        <div class="card">
          ${
            question.passage
              ? `<div class="passage-block">${escapeHtml(question.passage)}</div>`
              : ""
          }

          <h2 class="prompt">${escapeHtml(question.prompt)}</h2>

          <div class="choices">
            ${choicesHtml}
          </div>

          <div class="actions">
            <button id="flagBtn" type="button">${flagged ? "Unflag" : "Flag"}</button>
            <div class="nav-actions">
              <button id="backBtn" type="button" ${isFirst ? "disabled" : ""}>Back</button>
              ${
                isLast
                  ? `<button id="submitBtn" type="button">Submit</button>`
                  : `<button id="nextBtn" type="button">Next</button>`
              }
            </div>
          </div>
        </div>
      </div>
    `;

    bindQuestionActions(question);
  }

  function bindQuestionActions(question) {
    document.querySelectorAll(".choice-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const choiceIndex = Number(btn.dataset.choiceIndex);
        window.TEST_ENGINE.selectAnswer(question.questionId, choiceIndex);
      });
    });

    const flagBtn = document.getElementById("flagBtn");
    if (flagBtn) {
      flagBtn.addEventListener("click", () => {
        window.TEST_ENGINE.toggleFlag(question.questionId);
      });
    }

    const backBtn = document.getElementById("backBtn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        window.TEST_ENGINE.prevQuestion();
      });
    }

    const nextBtn = document.getElementById("nextBtn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        window.TEST_ENGINE.nextQuestion();
      });
    }

    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
      submitBtn.addEventListener("click", () => {
        const ok = window.confirm("Submit your test?");
        if (ok) {
          window.TEST_ENGINE.submitTest();
        }
      });
    }
  }

  function renderTimer(elapsedSec, totalTimeLimitSec = 0) {
    const timerEl = document.getElementById("timerDisplay");
    if (!timerEl) return;

    if (totalTimeLimitSec > 0) {
      const remaining = Math.max(0, totalTimeLimitSec - elapsedSec);
      timerEl.textContent = `Time Left: ${formatTime(remaining)}`;
    } else {
      timerEl.textContent = `Time: ${formatTime(elapsedSec)}`;
    }
  }

function renderResultScreen(result, session) {
  const root = getRoot();

  if (!result) {
    root.innerHTML = `<div class="card"><h1>No result data</h1></div>`;
    return;
  }

  // 🔥 LEARNER CLASSIFICATION
  const learnerType = classifyLearner(result);

  const sectionRows = (result.sectionResults || [])
    .map(s => `
      <tr>
        <td>${escapeHtml(s.title)}</td>
        <td>${s.correct}/${s.total}</td>
        <td>${s.percent}%</td>
      </tr>
    `).join("");

  const skillRows = (result.skillResults || [])
    .map(s => `
      <tr>
        <td>${escapeHtml(s.skill)}</td>
        <td>${escapeHtml(s.subskill)}</td>
        <td>${s.correct}/${s.total}</td>
        <td>${s.percent}%</td>
      </tr>
    `).join("");

  root.innerHTML = `
    <div class="screen result-screen">
      <div class="card">

        <h1>Test Result</h1>

        <p><strong>Student:</strong> ${escapeHtml(session.studentName || "-")}</p>
        <p><strong>Score:</strong> ${result.totalCorrect}/${result.totalQuestions} (${result.scorePercent}%)</p>
        <p><strong>Time:</strong> ${formatTime(result.durationSec)}</p>

        <hr/>

        <h2>Learner Type</h2>
        <p><strong>${learnerType.type}</strong></p>
        <p>${learnerType.description}</p>

        <hr/>

        <h2>Behavior</h2>
        <p>Changes: ${result.behavior.totalChanges}</p>
        <p>Revisits: ${result.behavior.totalRevisits}</p>
        <p>Flags: ${result.behavior.totalFlags}</p>
        <p>Struggles: ${result.behavior.struggleCount}</p>
        <p>Fast Guesses: ${result.behavior.fastGuessCount}</p>

        <h2>Timing</h2>
        <p>Total Time: ${formatTime(result.timing.totalTime)}</p>
        <p>Average: ${result.timing.avgTime.toFixed(1)}s</p>
        <p>Fast Answers: ${result.timing.fast}</p>
        <p>Slow Answers: ${result.timing.slow}</p>

        <h2>Stability</h2>
        <p>Stable: ${result.stability.stable}</p>
        <p>Unstable: ${result.stability.unstable}</p>

        <hr/>

        <h2>Sections</h2>
        <table>
          <tr><th>Section</th><th>Score</th><th>%</th></tr>
          ${sectionRows}
        </table>

        <h2>Skills</h2>
        <table>
          <tr><th>Skill</th><th>Sub</th><th>Score</th><th>%</th></tr>
          ${skillRows}
        </table>

      </div>
    </div>
  `;
}

  

  function getSectionTitle(pack, sectionId) {
    const section = pack.sections.find((s) => s.sectionId === sectionId);
    return section ? section.title : sectionId;
  }

  function formatTime(totalSeconds) {
    const safe = Math.max(0, Number(totalSeconds) || 0);
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }


  function classifyLearner(result) {
  const b = result.behavior;
  const t = result.timing;
  const s = result.stability;

  // 🔥 Fast guesser
  if (b.fastGuessCount > result.totalQuestions * 0.3) {
    return {
      type: "Fast Guesser",
      description: "Answers quickly but accuracy drops. Likely guessing instead of processing."
    };
  }

  // 🔥 Overthinker
  if (t.slow > result.totalQuestions * 0.4 && s.unstable > s.stable) {
    return {
      type: "Overthinker",
      description: "Spends too long and changes answers often. Knowledge exists but confidence is low."
    };
  }

  // 🔥 Careful + accurate
  if (t.slow > result.totalQuestions * 0.3 && result.scorePercent > 70) {
    return {
      type: "Careful Processor",
      description: "Takes time but understands well. Strong but not automatic yet."
    };
  }

  // 🔥 Stable learner
  if (s.stable > s.unstable && result.scorePercent > 70) {
    return {
      type: "Stable Performer",
      description: "Consistent answers with solid accuracy. Good confidence and understanding."
    };
  }

  return {
    type: "Developing Learner",
    description: "Mixed performance. Needs more repetition and structured practice."
  };
}

  return {
    renderStartScreen,
    renderQuestionScreen,
    renderTimer,
    renderResultScreen
  };
})();

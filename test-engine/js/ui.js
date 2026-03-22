
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
      root.innerHTML = `
        <div class="screen result-screen">
          <div class="card">
            <h1>Test Submitted</h1>
            <p>No result data available.</p>
          </div>
        </div>
      `;
      return;
    }

    const sectionRows = (result.sectionResults || [])
      .map(
        (section) => `
          <tr>
            <td>${escapeHtml(section.title || section.sectionId)}</td>
            <td>${section.correct} / ${section.total}</td>
            <td>${section.percent}%</td>
          </tr>
        `
      )
      .join("");

    const skillRows = (result.skillResults || [])
      .map(
        (skill) => `
          <tr>
            <td>${escapeHtml(skill.skill)}</td>
            <td>${escapeHtml(skill.subskill)}</td>
            <td>${skill.correct} / ${skill.total}</td>
            <td>${skill.percent}%</td>
          </tr>
        `
      )
      .join("");

    root.innerHTML = `
      <div class="screen result-screen">
        <div class="card">
          <h1>Test Result</h1>

          <p><strong>Student:</strong> ${escapeHtml(session.studentName || "-")}</p>
          <p><strong>PIN:</strong> ${escapeHtml(session.studentPin || "-")}</p>
          <p><strong>Submitted:</strong> ${escapeHtml(session.finishedAtTokyo || "-")}</p>

          <hr />

          <p><strong>Score:</strong> ${result.totalCorrect} / ${result.totalQuestions} (${result.scorePercent}%)</p>
          <p><strong>Time Used:</strong> ${formatTime(result.durationSec || 0)}</p>

          <h2>Sections</h2>
          <table>
            <thead>
              <tr>
                <th>Section</th>
                <th>Score</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              ${sectionRows}
            </tbody>
          </table>

          <h2>Skills</h2>
          <table>
            <thead>
              <tr>
                <th>Skill</th>
                <th>Subskill</th>
                <th>Score</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              ${skillRows}
            </tbody>
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

  return {
    renderStartScreen,
    renderQuestionScreen,
    renderTimer,
    renderResultScreen
  };
})();

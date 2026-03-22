
window.TEST_SCORING = (() => {

  function scoreSession(session, pack) {
    if (!session) throw new Error("Session is required.");
    if (!pack) throw new Error("Pack is required.");

    const questionResults = buildQuestionResults(session, pack);
    const sectionResults = buildSectionResults(questionResults, pack);
    const skillResults = buildSkillResults(questionResults);

    const behaviorSummary = buildBehaviorSummary(questionResults);
    const timingSummary = buildTimingSummary(questionResults);
    const stabilitySummary = buildStabilitySummary(questionResults);

    const totalCorrect = questionResults.filter(q => q.isCorrect).length;
    const totalQuestions = questionResults.length;
    const scorePercent = percent(totalCorrect, totalQuestions);

    return buildFinalResult(session, pack, {
      totalCorrect,
      totalQuestions,
      scorePercent,
      questionResults,
      sectionResults,
      skillResults,
      behaviorSummary,
      timingSummary,
      stabilitySummary
    });
  }

  // 🔥 CORE QUESTION DATA (ENHANCED)
  function buildQuestionResults(session, pack) {
    return pack.questions.map((question) => {
      const stats = session.questionStats[question.questionId] || makeEmptyQuestionStats(question.questionId);

      const finalAnswerIndex =
        session.answers[question.questionId] !== undefined
          ? session.answers[question.questionId]
          : stats.finalAnswerIndex;

      const isCorrect = finalAnswerIndex === question.correctIndex;
      const section = getSection(pack, question.sectionId);
      const expected = section?.expectedPerQuestionSec || 0;
      const time = stats.totalTimeSpentSec || 0;

      const tooLongLevel = getTooLongLevel(time, expected);

      // 🔥 NEW SIGNALS
      const speedCategory =
        time < 2 ? "fast" :
        expected && time > expected * 1.5 ? "slow" :
        "normal";

      const decisionType =
        !isCorrect && speedCategory === "fast" ? "fast_guess" :
        !isCorrect && speedCategory === "slow" ? "slow_confusion" :
        isCorrect && speedCategory === "slow" ? "slow_correct" :
        "normal";

      const confidenceLevel =
        stats.answerChangeCount === 0 && isCorrect ? "confident_correct" :
        stats.answerChangeCount > 0 && isCorrect ? "correct_after_change" :
        stats.answerChangeCount > 1 && !isCorrect ? "unstable_wrong" :
        "normal";

      const struggle =
        time > expected * 2 ||
        stats.answerChangeCount >= 2 ||
        stats.visitCount > 2;

      return {
        questionId: question.questionId,
        number: question.number,
        sectionId: question.sectionId,
        sectionTitle: section?.title || question.sectionId,
        skill: question.skill,
        subskill: question.subskill,
        difficulty: question.difficulty,

        finalAnswerIndex,
        correctIndex: question.correctIndex,
        isCorrect,

        visitCount: stats.visitCount || 0,
        revisited: (stats.visitCount || 0) > 1,
        totalTimeSpentSec: time,
        answerChangeCount: stats.answerChangeCount || 0,
        flaggedFinal: Boolean(session.flags[question.questionId] ?? stats.flagged),

        tooLongLevel,

        // 🔥 NEW INTELLIGENCE
        speedCategory,
        decisionType,
        confidenceLevel,
        struggle
      };
    });
  }

  // SECTION
  function buildSectionResults(questionResults, pack) {
    return pack.sections.map((section) => {
      const items = questionResults.filter(q => q.sectionId === section.sectionId);
      const correct = items.filter(q => q.isCorrect).length;
      const total = items.length;
      const timeUsedSec = items.reduce((s, q) => s + q.totalTimeSpentSec, 0);

      return {
        sectionId: section.sectionId,
        title: section.title,
        correct,
        total,
        percent: percent(correct, total),
        avgTime: total ? round1(timeUsedSec / total) : 0
      };
    });
  }

  // SKILL
  function buildSkillResults(questionResults) {
    const map = new Map();

    questionResults.forEach(q => {
      const key = `${q.skill}__${q.subskill}`;
      if (!map.has(key)) {
        map.set(key, { skill: q.skill, subskill: q.subskill, correct: 0, total: 0 });
      }

      const row = map.get(key);
      row.total++;
      if (q.isCorrect) row.correct++;
    });

    return Array.from(map.values()).map(r => ({
      ...r,
      percent: percent(r.correct, r.total)
    }));
  }

  // 🔥 BEHAVIOR (clean + unified)
  function buildBehaviorSummary(qs) {
    return {
      totalChanges: qs.reduce((s, q) => s + q.answerChangeCount, 0),
      totalRevisits: qs.reduce((s, q) => s + Math.max(0, q.visitCount - 1), 0),
      totalFlags: qs.filter(q => q.flaggedFinal).length,
      struggleCount: qs.filter(q => q.struggle).length,
      fastGuessCount: qs.filter(q => q.decisionType === "fast_guess").length
    };
  }

  // TIMING
  function buildTimingSummary(qs) {
    const total = qs.reduce((s, q) => s + q.totalTimeSpentSec, 0);

    return {
      totalTime: total,
      avgTime: qs.length ? total / qs.length : 0,
      fast: qs.filter(q => q.speedCategory === "fast").length,
      slow: qs.filter(q => q.speedCategory === "slow").length
    };
  }

  // STABILITY
  function buildStabilitySummary(qs) {
    return {
      stable: qs.filter(q => q.answerChangeCount === 0).length,
      unstable: qs.filter(q => q.answerChangeCount > 0).length
    };
  }

  function buildFinalResult(session, pack, d) {
    return {
      sessionId: session.sessionId,
      packId: pack.packId,

      studentName: session.studentName,
      studentPin: session.studentPin,

      startedAtTokyo: session.startedAtTokyo,
      finishedAtTokyo: session.finishedAtTokyo,
      durationSec: session.durationSec,

      totalCorrect: d.totalCorrect,
      totalQuestions: d.totalQuestions,
      scorePercent: d.scorePercent,

      sectionResults: d.sectionResults,
      skillResults: d.skillResults,

      behavior: d.behaviorSummary,
      timing: d.timingSummary,
      stability: d.stabilitySummary,

      questions: d.questionResults
    };
  }

  function getSection(pack, id) {
    return pack.sections.find(s => s.sectionId === id) || null;
  }

  function getTooLongLevel(actual, expected) {
    if (!expected) return "normal";
    if (actual > expected * 2.5) return "very_long";
    if (actual > expected * 1.5) return "long";
    return "normal";
  }

  function percent(c, t) {
    return t ? Math.round((c / t) * 100) : 0;
  }

  function round1(v) {
    return Math.round(v * 10) / 10;
  }

  function makeEmptyQuestionStats(id) {
    return {
      questionId: id,
      visitCount: 0,
      totalTimeSpentSec: 0,
      answerChangeCount: 0,
      finalAnswerIndex: null,
      flagged: false
    };
  }

  return { scoreSession };

})();

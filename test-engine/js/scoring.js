
window.TEST_SCORING = (() => {
     function scoreSession(session, pack) {
  if (!session) throw new Error("Session is required.");
  if (!pack) throw new Error("Pack is required.");

  // 1. Base layer (your current system)
  const questionResults = buildQuestionResults(session, pack);

  // 2. Core breakdowns
  const sectionResults = buildSectionResults(questionResults, pack);
  const skillResults = buildSkillResults(questionResults);

  // 3. NEW: behavior + timing pulled from session (NOT questionResults)
  const behaviorSummary = buildBehaviorSummary(session, questionResults);
  const timingSummary = buildTimingSummary(session);
  const stabilitySummary = buildStabilitySummary(session);

  // 4. Core score
  const totalCorrect = questionResults.filter(q => q.isCorrect).length;
  const totalQuestions = questionResults.length;
  const scorePercent = percent(totalCorrect, totalQuestions);

  // 5. Final object (expanded, future-proof)
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


  function buildBehaviorSummary(session, questionResults) {
  let totalChanges = 0;
  let totalRevisits = 0;
  let totalFlags = Object.keys(session.flags || {}).length;

  Object.values(session.questionStats || {}).forEach(q => {
    totalChanges += q.changes || 0;
    totalRevisits += q.revisits || 0;
  });

  return {
    totalChanges,
    totalRevisits,
    totalFlags
  };
}

  function buildTimingSummary(session) {
  let totalTime = 0;
  let count = 0;
  let fast = 0;
  let slow = 0;

  Object.values(session.questionStats || {}).forEach(q => {
    const t = q.timeSpent || 0;

    totalTime += t;
    count++;

    if (t < 2) fast++;
    if (t > 8) slow++;
  });

  return {
    totalTime,
    avgTime: count ? totalTime / count : 0,
    fastAnswers: fast,
    slowAnswers: slow
  };
}

  function buildStabilitySummary(session) {
  let stable = 0;
  let unstable = 0;

  Object.values(session.questionStats || {}).forEach(q => {
    if ((q.changes || 0) === 0) {
      stable++;
    } else {
      unstable++;
    }
  });

  return {
    stableAnswers: stable,
    unstableAnswers: unstable
  };
}



  
  function buildQuestionResults(session, pack) {
    return pack.questions.map((question) => {
      const stats = session.questionStats[question.questionId] || makeEmptyQuestionStats(question.questionId);
      const finalAnswerIndex =
        session.answers[question.questionId] !== undefined
          ? session.answers[question.questionId]
          : stats.finalAnswerIndex;

      const isCorrect = finalAnswerIndex === question.correctIndex;
      const section = getSection(pack, question.sectionId);
      const expectedPerQuestionSec = section?.expectedPerQuestionSec || 0;
      const tooLongLevel = getTooLongLevel(stats.totalTimeSpentSec, expectedPerQuestionSec);

      const speedCategory =
  stats.totalTimeSpentSec < 2 ? "fast" :
  stats.totalTimeSpentSec > expectedPerQuestionSec * 1.5 ? "slow" :
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
  stats.totalTimeSpentSec > expectedPerQuestionSec * 2 ||
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
        isAnswered: finalAnswerIndex !== null && finalAnswerIndex !== undefined,
        isCorrect,
        speedCategory,
        decisionType,
        speedCategory,
        decisionType,
        confidenceLevel,
        struggle,   

        visitCount: stats.visitCount || 0,
        revisited: (stats.visitCount || 0) > 1,
        totalTimeSpentSec: stats.totalTimeSpentSec || 0,
        answerChangeCount: stats.answerChangeCount || 0,
        flaggedFinal: Boolean(session.flags[question.questionId] ?? stats.flagged),
        tooLongLevel,

        firstAnsweredAtSec: stats.firstAnsweredAtSec,
        lastChangedAtSec: stats.lastChangedAtSec
      };
    });
  }

  function buildSectionResults(questionResults, pack) {
    return pack.sections.map((section) => {
      const items = questionResults.filter((q) => q.sectionId === section.sectionId);
      const correct = items.filter((q) => q.isCorrect).length;
      const total = items.length;
      const timeUsedSec = items.reduce((sum, q) => sum + q.totalTimeSpentSec, 0);
      const avgQuestionTimeSec = total > 0 ? round1(timeUsedSec / total) : 0;
      const longQuestionCount = items.filter((q) => q.tooLongLevel === "long").length;
      const veryLongQuestionCount = items.filter((q) => q.tooLongLevel === "very_long").length;

      return {
        sectionId: section.sectionId,
        title: section.title,
        correct,
        total,
        percent: percent(correct, total),
        timeUsedSec,
        avgQuestionTimeSec,
        longQuestionCount,
        veryLongQuestionCount
      };
    });
  }

  function buildSkillResults(questionResults) {
    const bucket = new Map();

    for (const q of questionResults) {
      const key = `${q.skill}__${q.subskill}`;
      if (!bucket.has(key)) {
        bucket.set(key, {
          skill: q.skill,
          subskill: q.subskill,
          correct: 0,
          total: 0
        });
      }

      const row = bucket.get(key);
      row.total += 1;
      if (q.isCorrect) row.correct += 1;
    }

    return Array.from(bucket.values())
      .map((row) => ({
        ...row,
        percent: percent(row.correct, row.total)
      }))
      .sort((a, b) => {
        if (a.skill !== b.skill) return a.skill.localeCompare(b.skill);
        return a.subskill.localeCompare(b.subskill);
      });
  }

  function buildBehaviorSummary(questionResults, pack) {
    const longQuestions = questionResults.filter((q) => q.tooLongLevel === "long").map(miniQuestionSummary);
    const veryLongQuestions = questionResults.filter((q) => q.tooLongLevel === "very_long").map(miniQuestionSummary);
    const highChangeQuestions = questionResults
      .filter((q) => q.answerChangeCount >= 2)
      .map(miniQuestionSummary);
    const revisitedQuestions = questionResults
      .filter((q) => q.visitCount > 1)
      .map(miniQuestionSummary);
    const flaggedQuestions = questionResults
      .filter((q) => q.flaggedFinal)
      .map(miniQuestionSummary);

    const totalAnswerChanges = questionResults.reduce((sum, q) => sum + q.answerChangeCount, 0);
    const totalRevisits = questionResults.reduce((sum, q) => sum + Math.max(0, q.visitCount - 1), 0);
    const totalFlagged = flaggedQuestions.length;

    return {
      totalAnswerChanges,
      totalRevisits,
      totalFlagged,
      longQuestions,
      veryLongQuestions,
      highChangeQuestions,
      revisitedQuestions,
      flaggedQuestions
    };
  }

  function buildFinalResult(session, pack, derived) {
    return {
      sessionId: session.sessionId,
      packId: pack.packId,
      examType: pack.examType,
      level: pack.level,
      title: pack.title,
      version: pack.version,
      timezone: pack.timezone,

      studentName: session.studentName,
      studentPin: session.studentPin,

      startedAtTokyo: session.startedAtTokyo,
      finishedAtTokyo: session.finishedAtTokyo,
      durationSec: session.durationSec,

      totalCorrect: derived.totalCorrect,
      totalQuestions: derived.totalQuestions,
      scorePercent: derived.scorePercent,

      sectionResults: derived.sectionResults,
      skillResults: derived.skillResults,
      questionResults: derived.questionResults,
      behaviorSummary: derived.behaviorSummary
    };
  }

  function getSection(pack, sectionId) {
    return pack.sections.find((s) => s.sectionId === sectionId) || null;
  }

  function getTooLongLevel(actualSec, expectedSec) {
    if (!expectedSec || expectedSec <= 0) return "normal";
    if (actualSec > expectedSec * 2.5) return "very_long";
    if (actualSec > expectedSec * 1.5) return "long";
    return "normal";
  }

  function percent(correct, total) {
    if (!total) return 0;
    return Math.round((correct / total) * 100);
  }

  function round1(value) {
    return Math.round(value * 10) / 10;
  }

  function miniQuestionSummary(q) {
    return {
      questionId: q.questionId,
      number: q.number,
      sectionId: q.sectionId,
      skill: q.skill,
      subskill: q.subskill
    };
  }

  function makeEmptyQuestionStats(questionId) {
    return {
      questionId,
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

  return {
    scoreSession,
    buildQuestionResults,
    buildSectionResults,
    buildSkillResults,
    buildBehaviorSummary,
    buildFinalResult
  };
})();

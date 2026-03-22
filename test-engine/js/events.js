
window.TEST_EVENTS = (() => {
  function logEvent(session, config) {
    if (!session) throw new Error("Session is required for logEvent.");
    if (!config || !config.type) throw new Error("Event type is required.");

    const event = makeEvent(session, config);
    appendEvent(session, event);
    return event;
  }

  function makeEvent(session, config) {
    return {
      eventId: makeEventId(),
      sessionId: session.sessionId,
      type: config.type,
      timestampTokyo: getTokyoTimestamp(),
      tSec: getElapsedSec(session),
      questionId: config.questionId ?? null,
      sectionId: config.sectionId ?? null,
      payload: config.payload ?? {}
    };
  }

  function appendEvent(session, event) {
    session.events.push(event);
  }

  function getTokyoTimestamp() {
    return new Date()
      .toLocaleString("sv-SE", {
        timeZone: "Asia/Tokyo",
        hour12: false
      })
      .replace(" ", "T");
  }

  function getElapsedSec(session) {
    if (!session?.timer?.startedAtMs) return 0;
    return Math.floor((Date.now() - session.timer.startedAtMs) / 1000);
  }

  function makeEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  return {
    logEvent,
    makeEvent,
    appendEvent,
    getTokyoTimestamp,
    getElapsedSec
  };
})();

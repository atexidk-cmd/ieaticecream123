const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
admin.initializeApp();

/* Change this if you're not in Central time (list: https://ss64.com/list-timezones.html) */
const TIMEZONE = "America/Chicago";

/* Fires at 9am, 12pm, 3pm, 6pm and 9pm local time - a ~3hr cadence through the day
   plus a distinct "before bed" nudge at 9pm. Edit the hour list to change cadence. */
exports.sendReminders = onSchedule(
  { schedule: "0 9,12,15,18,21 * * *", timeZone: TIMEZONE },
  async () => {
    const hourStr = new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE,
      hour: "numeric",
      hour12: false,
    }).format(new Date());
    const isNight = parseInt(hourStr, 10) >= 20;

    const title = isNight ? "One last check-in 🌙" : "Bunny check-in 🐰";
    const body = isNight
      ? "Before bed - log today's routines so nothing gets missed."
      : "Quick nudge to update your planner.";

    const db = admin.firestore();
    const snap = await db.collection("pushTokens").get();
    const tokens = [];
    snap.forEach((doc) => {
      const t = doc.data().token;
      if (t) tokens.push(t);
    });
    if (!tokens.length) {
      console.log("No registered tokens, skipping.");
      return;
    }

    const res = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      webpush: { fcmOptions: { link: "/index.html" } },
    });

    // Prune tokens Firebase says are dead (uninstalled app, revoked permission, etc.)
    const deadTokens = [];
    res.responses.forEach((r, i) => {
      const code = r.error && r.error.code;
      if (
        !r.success &&
        (code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token")
      ) {
        deadTokens.push(tokens[i]);
      }
    });
    if (deadTokens.length) {
      const batch = db.batch();
      snap.forEach((doc) => {
        if (deadTokens.indexOf(doc.data().token) >= 0) batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`Removed ${deadTokens.length} dead token(s).`);
    }

    console.log(
      `Sent to ${tokens.length} token(s): ${res.successCount} ok, ${res.failureCount} failed.`
    );
  }
);

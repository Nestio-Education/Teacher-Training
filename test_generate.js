import ACTIVITY_BANK from "./src/data/academicActivityBank.js";
const ACADEMIC_ACTIVITY_BANK = ACTIVITY_BANK;

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const getAcademicPoolFromMonth = ({ category, subject, startMonth }) =>
  ACADEMIC_ACTIVITY_BANK
    .filter(a => a.category === category && a.subject === subject && a.month >= startMonth)
    .sort((a, b) => a.month - b.month || a.set - b.set || a.activityNumber - b.activityNumber);

const generateAcademicScheduleFromDataset = ({ category, subject, startMonth, startDate, durationWeeks, maxActivitiesPerDay }) => {
  const pool = getAcademicPoolFromMonth({ category, subject, startMonth });
  if (pool.length === 0) return { error: "No content found for that Category/Subject/Start Month." };

  const buckets = [];
  const seen = new Set();
  pool.forEach(a => {
    const key = `${a.month}-${a.set}`;
    if (!seen.has(key)) {
      seen.add(key);
      buckets.push({ month: a.month, set: a.set, items: [] });
    }
    buckets.find(b => b.month === a.month && b.set === a.set).items.push(a);
  });

  if (durationWeeks > buckets.length) {
    return {
      error: `Only ${buckets.length} week(s) of ${category} ${subject} content available starting from Month ${startMonth}. Reduce the duration or choose an earlier start month / different subject.`,
    };
  }

  const weeks = [];
  let cur = new Date(startDate);
  for (let w = 0; w < durationWeeks; w++) {
    const weekDays = [];
    while (weekDays.length < 5) {
      const dow = cur.getDay();
      if (dow !== 0 && dow !== 6) weekDays.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(weekDays);
  }

  const schedule = [];
  weeks.forEach((weekDays, weekIndex) => {
    const items = buckets[weekIndex].items; 
    let cursor = 0;
    weekDays.forEach(d => {
      const activities = [];
      for (let i = 0; i < maxActivitiesPerDay; i++) {
        const a = items[cursor % items.length]; 
        cursor++;
        activities.push({
          order: i + 1,
          contentTitle: a.keyConcept,
          moduleTitle: a.title,
          contentType: a.format || a.subject,
          durationMinutes: 30, 
          materials: "",
          purpose: a.keyConcept,
          howToConduct: a.content,
          facilitatorRole: "",
          expectedOutcomes: "",
          instructions: a.content,
          objectives: a.keyConcept,
        });
      }
      schedule.push({ date: d.toISOString().split("T")[0], dayOfWeek: WEEKDAY_NAMES[d.getDay()], activities });
    });
  });

  const totalActivities = schedule.reduce((sum, day) => sum + day.activities.length, 0);
  const endMonth = buckets[buckets.length - 1].month;
  const title = startMonth === endMonth
    ? `${category} · ${subject} · Month ${startMonth}`
    : `${category} · ${subject} · Months ${startMonth}–${endMonth}`;

  return { course: { title }, totalActivities, totalDays: schedule.length, durationWeeks, schedule };
};

console.log(generateAcademicScheduleFromDataset({
  category: "FLN", subject: "Literacy", startMonth: 1, startDate: "2026-08-12", durationWeeks: 2, maxActivitiesPerDay: 2
}));

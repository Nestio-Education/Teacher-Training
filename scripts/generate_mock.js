import fs from "fs";

const bank = [];
for (let month = 1; month <= 6; month++) {
  for (let set = 1; set <= 4; set++) {
    for (let act = 1; act <= 20; act++) {
      bank.push({
        category: "FLN",
        subject: "Literacy",
        month,
        set,
        activityNumber: act,
        keyConcept: `Letter ${String.fromCharCode(64 + ((act % 26) || 26))}`,
        title: `M${month} S${set} Act ${act}`,
        format: "Activity",
        content: `Instructions for Month ${month} Set ${set} Activity ${act}`
      });
      bank.push({
        category: "FLN",
        subject: "Numeracy",
        month,
        set,
        activityNumber: act,
        keyConcept: `Number ${act}`,
        title: `M${month} S${set} Act ${act}`,
        format: "Activity",
        content: `Instructions for Month ${month} Set ${set} Activity ${act}`
      });
    }
  }
}

fs.writeFileSync("src/data/academicActivityBank.js", "const ACADEMIC_ACTIVITY_BANK = " + JSON.stringify(bank, null, 2) + ";\nexport default ACADEMIC_ACTIVITY_BANK;");

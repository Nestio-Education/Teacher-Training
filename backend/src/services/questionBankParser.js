// Start: Prajwal — parses uploaded Question Bank files into { sections: [...] }
import mammoth from "mammoth";
import * as XLSX from "xlsx";

const DOMAIN_ID_MAP = {
  "PHYSICAL DEVELOPMENT": "gross_fine_motor",
  "COGNITIVE DEVELOPMENT": "cognitive",
  "SOCIAL-EMOTIONAL DEVELOPMENT": "social_emotional",
  "LANGUAGE & COMMUNICATION": "language",
  "ADAPTIVE (SELF-HELP) SKILLS": "adaptive",
  "SENSORY & AESTHETIC DEVELOPMENT": "sensory_regulation",
};
const DOMAIN_CODE = {
  gross_fine_motor: "gfm",
  cognitive: "cog",
  social_emotional: "sem",
  language: "lang",
  adaptive: "ada",
  sensory_regulation: "sen",
};

function slugify(s) {
  return String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

/**
 * Parses a .docx or .doc question bank following domain & question headings, or pipe/item formats.
 */
export async function parseDocxQuestionBank(buffer) {
  let rawText = "";
  try {
    const res = await mammoth.extractRawText({ buffer });
    rawText = res.value || "";
  } catch (err) {
    // Legacy binary .doc fallback: extract printable character streams from binary buffer
    rawText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
  }

  const text = rawText.replace(/\r\n/g, "\n");

  const domainPattern = /(?:DOMAIN|SECTION|Domain|Section)\s+(\d+):\s*(.+)/g;
  const domainMatches = [...text.matchAll(domainPattern)];

  if (domainMatches.length > 0) {
    const sections = [];
    for (let i = 0; i < domainMatches.length; i++) {
      const m = domainMatches[i];
      const domainNum = parseInt(m[1], 10);
      const domainTitleRaw = m[2].trim();
      const sectionId = DOMAIN_ID_MAP[domainTitleRaw.toUpperCase()] || slugify(domainTitleRaw);
      const code = DOMAIN_CODE[sectionId] || slugify(domainTitleRaw).slice(0, 4);

      const start = m.index + m[0].length;
      const end = i + 1 < domainMatches.length ? domainMatches[i + 1].index : text.length;
      const block = text.slice(start, end);

      const qPattern = /(?:Question|\d+\.)\s*(\d+)?:?\s*(.+)/gi;
      const qMatches = [...block.matchAll(qPattern)];

      const items = [];
      for (let j = 0; j < qMatches.length; j++) {
        const qm = qMatches[j];
        const qNum = qm[1] ? parseInt(qm[1], 10) : j + 1;
        const qTitle = qm[2].split("\n")[0].trim();
        const qStart = qm.index + qm[0].length;
        const qEnd = j + 1 < qMatches.length ? qMatches[j + 1].index : block.length;
        const qBlock = block.slice(qStart, qEnd);

        const milestoneM = qBlock.match(/Milestone:\s*(.+)/);
        let milestoneRaw = milestoneM ? milestoneM[1].trim() : "";
        const ageM = milestoneRaw.match(/Age\s+([\d.\-]+)/);
        const targetAge = ageM ? ageM[1] : "";
        const milestone = milestoneRaw.replace(/\s*\(Level[^)]*\)\s*/, "").trim();

        const qTextM = qBlock.match(/(Does the child[^?]*\?)/i) || qBlock.match(/([A-Z][^?]*\?)/);
        const qText = qTextM ? qTextM[1].replace(/\s+/g, " ").trim() : qTitle;

        const actBlockM = qBlock.match(/Activities to observe\/implement:?\s*([\s\S]+?)(?=Rating Scale|$)/i);
        const actBlock = actBlockM ? actBlockM[1] : "";
        const actLines = actBlock.split(/\n(?=\d+\.\s*)/).map(l => l.replace(/\s+/g, " ").trim()).filter(l => l.length > 5);

        items.push({
          id: `${code}_${qNum}`,
          title: qTitle,
          milestone,
          targetAge,
          text: qText,
          activities: actLines.length > 0 ? actLines : undefined,
          ratingScale: ["Not yet", "Emerging", "Achieved"],
        });
      }

      if (items.length > 0) {
        sections.push({
          id: sectionId,
          number: domainNum,
          title: domainTitleRaw.replace(/\b\w/g, c => c.toUpperCase()),
          items,
        });
      }
    }
    if (sections.length > 0) return { sections };
  }

  // Fallback to line-by-line pipe/item parser for any custom Word document layout
  return parseFlexibleTextQuestionBank(text);
}

function parseFlexibleTextQuestionBank(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const sections = [];
  let currentSection = {
    id: "domain_1",
    number: 1,
    title: "Domain 1: Physical & Motor Development",
    items: []
  };

  lines.forEach((line, idx) => {
    const secMatch = line.match(/^(?:SECTION|DOMAIN|Domain|Section)\s*(\d+)?:?\s*(.+)$/i);
    if (secMatch && !line.includes("|") && !line.includes("Does the child")) {
      if (currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      const title = secMatch[2].replace(/^:\s*/, "").trim();
      currentSection = {
        id: slugify(title) || `sec_${sections.length + 1}`,
        number: secMatch[1] ? parseInt(secMatch[1], 10) : sections.length + 1,
        title: title || `Domain ${sections.length + 1}`,
        items: []
      };
      return;
    }

    if (line.includes("|")) {
      const parts = line.split("|").map(p => p.trim());
      if (parts.length >= 2) {
        const idOrNum = parts[0].replace(/^\d+\.\s*/, "");
        const title = parts[1];
        const qText = parts[2] || title;
        currentSection.items.push({
          id: idOrNum || `q_${currentSection.items.length + 1}`,
          title: title,
          milestone: "General",
          targetAge: "",
          text: qText,
          ratingScale: ["Not yet", "Emerging", "Achieved"]
        });
        return;
      }
    }

    const numQMatch = line.match(/^(\d+)\.\s*(?:Question\s*\d+:?\s*)?([^:—-]+)[:—-]?\s*(.*)$/i);
    if (numQMatch) {
      const title = numQMatch[2].trim();
      const qText = numQMatch[3].trim() || title;
      if (title.length > 2) {
        currentSection.items.push({
          id: `q_${currentSection.number}_${numQMatch[1]}`,
          title: title,
          milestone: "General",
          targetAge: "",
          text: qText,
          ratingScale: ["Not yet", "Emerging", "Achieved"]
        });
      }
    }
  });

  if (currentSection.items.length > 0) {
    sections.push(currentSection);
  }

  if (sections.length === 0 || sections.flatMap(s => s.items).length === 0) {
    throw new Error("Could not parse questions from this document. Please ensure questions are formatted clearly in sections.");
  }

  return { sections };
}

/**
 * Parses a .xlsx question bank. Expected columns (header row):
 * Domain Number | Domain Title | Question ID | Question Title | Milestone | Target Age | Question Text | Activity 1 | Activity 2 | Activity 3
 */
export function parseXlsxQuestionBank(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheetName = wb.SheetNames.includes("QuestionBank") ? "QuestionBank" : wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 }).filter(r => r && r.length > 0);
  if (rows.length < 2) throw new Error("The uploaded sheet has no data rows.");

  const header = rows[0].map(h => String(h || "").trim().toLowerCase());
  const col = (name) => header.findIndex(h => h.includes(name));

  const idxDomainNum = col("domain number");
  const idxDomainTitle = col("domain title");
  const idxQId = col("question id");
  const idxQTitle = col("question title");
  const idxMilestone = col("milestone");
  const idxTargetAge = col("target age");
  const idxQText = col("question text");
  const idxAct1 = col("activity 1");
  const idxAct2 = col("activity 2");
  const idxAct3 = col("activity 3");

  if ([idxDomainNum, idxDomainTitle, idxQId, idxQTitle, idxQText].some(i => i === -1)) {
    throw new Error("Sheet is missing required columns. Please use the downloaded question-bank template.");
  }

  const sectionsMap = new Map();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const domainTitle = String(row[idxDomainTitle] || "").trim();
    if (!domainTitle) continue;
    const domainNum = Number(row[idxDomainNum]) || sectionsMap.size + 1;
    const sectionId = DOMAIN_ID_MAP[domainTitle.toUpperCase()] || slugify(domainTitle);

    if (!sectionsMap.has(sectionId)) {
      sectionsMap.set(sectionId, { id: sectionId, number: domainNum, title: domainTitle, items: [] });
    }

    const activities = [idxAct1, idxAct2, idxAct3]
      .map(idx => (idx > -1 ? String(row[idx] || "").trim() : ""))
      .filter(Boolean);

    sectionsMap.get(sectionId).items.push({
      id: String(row[idxQId] || "").trim(),
      title: String(row[idxQTitle] || "").trim(),
      milestone: idxMilestone > -1 ? String(row[idxMilestone] || "").trim() : "",
      targetAge: idxTargetAge > -1 ? String(row[idxTargetAge] || "").trim() : "",
      text: String(row[idxQText] || "").trim(),
      activities,
    });
  }

  const sections = [...sectionsMap.values()].sort((a, b) => a.number - b.number);
  if (sections.length === 0) throw new Error("No valid question rows were found.");
  return { sections };
}
// End: Prajwal

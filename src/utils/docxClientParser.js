import mammoth from "mammoth";

export async function parseClientDocx(arrayBuffer) {
  const res = await mammoth.extractRawText({ arrayBuffer });
  const text = (res.value || "").replace(/\r\n/g, "\n");

  const domainPattern = /(?:DOMAIN|SECTION|Domain|Section)\s+(\d+):\s*(.+)/g;
  const domainMatches = [...text.matchAll(domainPattern)];

  const questions = [];
  if (domainMatches.length > 0) {
    for (let i = 0; i < domainMatches.length; i++) {
      const m = domainMatches[i];
      const domainTitleRaw = m[2].trim();

      const start = m.index + m[0].length;
      const end = i + 1 < domainMatches.length ? domainMatches[i + 1].index : text.length;
      const block = text.slice(start, end);

      const qPattern = /(?:###\s*|\*\*\s*)?Question\s+(\d+)\s*:?\s*(.+)/gi;
      const qMatches = [...block.matchAll(qPattern)];

      for (let j = 0; j < qMatches.length; j++) {
        const qm = qMatches[j];
        const qTitle = (qm[2] || "").split("\n")[0].replace(/\*+/g, "").trim();

        if (!qTitle || /\d+\s+Questions/i.test(qTitle)) continue;

        const qStart = qm.index + qm[0].length;
        const qEnd = j + 1 < qMatches.length ? qMatches[j + 1].index : block.length;
        const qBlock = block.slice(qStart, qEnd);

        const milestoneM = qBlock.match(/Milestone:\s*(.+)/);
        let milestoneRaw = milestoneM ? milestoneM[1].trim() : "";
        const milestone = milestoneRaw.replace(/\s*\(Level[^)]*\)\s*/, "").trim();

        const qTextM = qBlock.match(/(Does the child[^?\n]*\?)/i) || qBlock.match(/(\*?During[^?\n]*\?)/i) || qBlock.match(/([A-Z][^?\n]*\?)/);
        const qText = qTextM ? qTextM[1].replace(/\*+/g, "").replace(/\s+/g, " ").trim() : qTitle;

        const hasCantDo = /Can't do/i.test(qBlock) || /Does Independently/i.test(qBlock);
        const ratingScale = hasCantDo
          ? ["1 (Can't do)", "2 (Emerging)", "3 (Does Independently)"]
          : ["1 (Not yet)", "2 (Emerging)", "3 (Achieved)"];

        const domainName = domainTitleRaw.replace(/\b\w/g, c => c.toUpperCase());

        questions.push({
          question: qTitle && qText && qTitle !== qText ? `${qTitle}: ${qText}` : (qText || qTitle),
          options: ratingScale,
          correctAnswer: ratingScale[ratingScale.length - 1],
          domain: domainName,
          milestone: milestone || domainName
        });
      }
    }
  }

  // Fallback match if no explicit DOMAIN headers found
  if (questions.length === 0) {
    const qPattern = /(?:###\s*|\*\*\s*)?Question\s+(\d+)\s*:?\s*(.+)/gi;
    const qMatches = [...text.matchAll(qPattern)];
    for (let j = 0; j < qMatches.length; j++) {
      const qm = qMatches[j];
      const qTitle = (qm[2] || "").split("\n")[0].replace(/\*+/g, "").trim();
      if (qTitle && !/\d+\s+Questions/i.test(qTitle)) {
        questions.push({
          question: qTitle,
          options: ["1 (Not yet)", "2 (Emerging)", "3 (Achieved)"],
          correctAnswer: "3 (Achieved)",
          domain: "General Assessment"
        });
      }
    }
  }

  return questions;
}

import mammoth from "mammoth";

/**
 * Parses an uploaded .docx into ONE course: H1 headings become modules
 * (chapters), H2 headings become lessons within the current module, H3 and
 * paragraphs/bullets accumulate into the current lesson's notes.
 *
 * Defensive handling: an H1 only starts a real module if an H2 appears
 * before the next H1. If another H1 appears first -- even with plain
 * paragraphs in between (e.g. an italic subtitle line under a banner
 * heading) -- the earlier H1 is treated as a banner/subtitle and skipped,
 * rather than creating a near-empty module. This was found necessary
 * against a real test document where a module's own title paragraph was
 * styled as Heading 1, immediately followed by the chapter's own Heading 1
 * with a short italic paragraph in between -- a naive "next block is h1"
 * check misses this; the fix scans forward past intervening paragraphs.
 */
export async function parseChapterCourseDocx(buffer, filenameFallback = "Untitled Course") {
  const { value: html } = await mammoth.convertToHtml({ buffer });

  const blockRe = /<(h1|h2|h3|p|ul|ol)>([\s\S]*?)<\/\1>/g;
  const blocks = [];
  let m;
  while ((m = blockRe.exec(html))) {
    const tag = m[1];
    if (tag === "ul" || tag === "ol") {
      const items = [...m[2].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((li) =>
        stripTags(li[1]).trim()
      );
      if (items.length) blocks.push({ tag: "bullets", items });
      continue;
    }
    const text = stripTags(m[2]).trim();
    if (text) blocks.push({ tag, text });
  }

  const META_RE = /^Category:\s*(.+?)\s+Level:\s*(.+?)\s+Duration:\s*(.+)$/;
  const course = {
    title: prettifyFilename(filenameFallback),
    category: "Foundations of ECE",
    level: "Beginner",
    duration: "",
    description: "",
    objectives: "",
    modules: [],
  };

  let currentModule = null;
  let currentLesson = null;
  let sawAnyH1 = false;

  // An H1 counts as a real module start only if an H2 appears before the
  // next H1 (or end of doc). Otherwise it's a banner/subtitle -- skip it.
  const bannerH1Indices = new Set();
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].tag !== "h1") continue;
    let isBanner = false;
    for (let j = i + 1; j < blocks.length; j++) {
      if (blocks[j].tag === "h2") break;
      if (blocks[j].tag === "h1") { isBanner = true; break; }
    }
    if (isBanner) bannerH1Indices.add(i);
  }

  const startModule = (title) => {
    currentModule = { title, contents: [] };
    course.modules.push(currentModule);
    currentLesson = null;
  };
  const startLesson = (title) => {
    if (!currentModule) startModule(title); // safety: H2 before any H1
    currentLesson = { title, notesParts: [] };
    currentModule.contents.push(currentLesson);
  };
  const appendToCurrent = (text) => {
    if (currentLesson) {
      currentLesson.notesParts.push(text);
    } else if (currentModule) {
      startLesson(currentModule.title);
      currentLesson.notesParts.push(text);
    } else {
      course.description = course.description ? `${course.description}\n\n${text}` : text;
    }
  };

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];

    if (b.tag === "h1") {
      sawAnyH1 = true;
      if (bannerH1Indices.has(i)) continue;
      startModule(b.text);
      continue;
    }
    if (b.tag === "h2") {
      startLesson(b.text);
      continue;
    }
    if (b.tag === "h3") {
      appendToCurrent(`**${b.text}**`);
      continue;
    }
    if (b.tag === "bullets") {
      appendToCurrent(b.items.map((it) => `• ${it}`).join("\n"));
      continue;
    }

    const metaMatch = b.text.match(META_RE);
    if (metaMatch && !sawAnyH1) {
      course.category = metaMatch[1].trim();
      course.level = metaMatch[2].trim();
      course.duration = metaMatch[3].trim();
      continue;
    }
    if (b.text.startsWith("Title:") && !sawAnyH1) {
      course.title = b.text.replace(/^Title:\s*/, "").trim() || course.title;
      continue;
    }
    if (b.text.startsWith("Description:") && !sawAnyH1) {
      course.description = b.text.replace(/^Description:\s*/, "");
      continue;
    }
    if (b.text.startsWith("Learning Objectives:") && !sawAnyH1) {
      course.objectives = b.text.replace(/^Learning Objectives:\s*/, "");
      continue;
    }
    appendToCurrent(b.text);
  }

  for (const mod of course.modules) {
    if (mod.contents.length === 0) {
      mod.contents.push({ title: mod.title, notesParts: [] });
    }
    mod.contents = mod.contents.map((lesson, idx) => ({
      title: lesson.title,
      type: "reading", // coerced to "document" by mapFormModulesToCourse on save
      notes: lesson.notesParts.join("\n\n"),
      suggestedDuration: `${Math.max(10, Math.round(lesson.notesParts.join(" ").split(" ").length / 130) * 5)} min read`,
      order: idx,
    }));
  }
  course.modules = course.modules.map((mod, idx) => ({
    title: mod.title,
    description: "",
    order: idx,
    contents: mod.contents,
  }));

  return course;
}

function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&nbsp;/g, " ");
}

// Fallback title when no explicit "Title:" line is present in the document.
// Turns "Course_1_Foundations_Objectives_and_Structure.docx" into
// "Course 1 Foundations Objectives and Structure" instead of leaving
// underscores/hyphens in a title shown directly in the admin UI.
function prettifyFilename(filename) {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

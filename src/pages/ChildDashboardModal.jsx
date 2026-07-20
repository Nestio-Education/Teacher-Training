// Prajwal start
import { useState, useEffect } from "react";
import { SectionCard, S, Badge, StatusBadge } from "../components/Shared";

/* ─────────────────────────────────────────
   Child Dashboard — Module 1
   (Child Profile & Assessment)
   Spec ref: Teacher_Portal_Functional_Spec.pdf
   Section 2 — Child Profile & Assessment
   3 tabs: Child Profile / Child Assessment / Activity Suggestions
───────────────────────────────────────── */
const RATING_FULL = ["Can't do", "1", "2", "3", "Does Independently"];
const RATING_NO_INDEPENDENT = ["Can't do", "1", "2", "3"];

const SECTIONS = [
  {
    id: "gross_fine_motor",
    number: "1",
    title: "Gross & Fine Motor Skills",
    items: [
      {
        id: "1.1",
        text: "Walks up and down stairs with alternating feet",
        activities: [
          "Stair Climbing Practice — Set up a safe, low staircase and encourage alternating feet while supervising.",
          "Step-Up Game — Step up and down on a sturdy step or platform, alternating feet each time.",
          "Obstacle Course — Include stairs in a simple course, prompting alternating feet.",
        ],
      },
      {
        id: "1.2",
        text: "Runs smoothly and stops without falling",
        activities: [
          'Run and Stop Game — Run back and forth, calling out "Stop!" to practice halting smoothly.',
          "Chase the Ball — Roll or toss a ball and have the child run after it, then stop quickly.",
          "Follow-the-Leader — Run behind you, mimicking actions including smooth stops.",
        ],
      },
      {
        id: "1.3",
        text: "Jumps forward with both feet leaving the ground",
        activities: [
          "Jumping over a Line — Jump forward over a drawn line, increasing distance over time.",
          "Animal Jumps — Pretend to be frogs or kangaroos, jumping forward with both feet.",
          "Obstacle Course — Jump over small objects to get past each obstacle.",
        ],
      },
      {
        id: "1.4",
        text: "Pedals a tricycle or ride-on toy",
        activities: [
          "Tricycle Riding Practice — Practice pedaling on a smooth, flat area.",
          "Obstacle Course with Ride-On Toy — Pedal around cones or markers.",
          "Race to a Target — Pedal to reach a target placed at a distance.",
        ],
      },
      {
        id: "1.5",
        text: "Begins catching a ball with hands (not just trapping it against body)",
        activities: [
          "Toss and Catch — Gently toss a soft ball at short distances, catching with hands.",
          "Bounce and Catch — Catch the ball after one bounce.",
          "Catch with a Partner — Toss back and forth, gradually increasing distance and timing.",
        ],
      },
      {
        id: "1.6",
        text: "Uses crayons or pencil with good control",
        activities: [
          "Drawing Shapes — Draw simple shapes like circles, squares, triangles with control.",
          "Coloring Pictures — Color inside the lines on large, simple designs.",
          "Tracing Activities — Trace dotted lines to build fine motor control.",
        ],
      },
      {
        id: "1.7",
        text: "Builds a tower of 6 or more blocks",
        activities: [
          "Block Stacking Challenge — Stack blocks as high as possible, aiming for 6+.",
          "Tower Building with Different Shapes — Experiment with different block shapes and arrangements.",
          "Block Balance Game — Take turns adding blocks without the tower falling.",
        ],
      },
      {
        id: "1.8",
        text: "Turns book pages one at a time",
        activities: [
          "Page Turning Practice — Use a sturdy board book, turning one page at a time.",
          "Story Time with Instructions — Prompt page turns at the right moments in a story.",
          "Interactive Book with Flaps — Open flaps or turn pages one at a time together.",
        ],
      },
    ],
  },
  {
    id: "cognitive",
    number: "2",
    title: "Cognitive Development",
    items: [
      {
        id: "2.1",
        text: "Engages in more complex pretend play (e.g., acts out stories with toys)",
        activities: [
          'Pretend Kitchen Play — "Cook" and serve meals, acting out a story with toys.',
          "Animal Role Play — Create a story where animal figurines talk and interact.",
          "Dollhouse Play — Act out daily activities like feeding, dressing, and bedtime.",
        ],
      },
      {
        id: "2.2",
        text: "Completes 5-6 piece puzzles or shape sorters",
        activities: [
          "Shape Sorting Challenge — Practice placing shapes into matching slots independently.",
          "Progressive Puzzles — Start with 2-3 piece puzzles and gradually work up to 5-6 pieces.",
        ],
      },
      {
        id: "2.3",
        text: 'Understands concepts of "Big" and "Small"',
        ratingScale: RATING_NO_INDEPENDENT,
        activities: [
          "Sorting Objects by Size — Sort objects into big and small groups, discussing differences.",
          "Big and Small Game — Identify which of two objects is big and which is small.",
          "Story with Size Comparison — Point out big vs. small characters/objects in a story.",
        ],
      },
      {
        id: "2.4",
        text: 'Can follow multi-step instructions (e.g., "Pick up your shoes and put them in the closet")',
        activities: [
          'Clean-Up Game — Follow two-step instructions like "pick up toys and put them in the basket."',
          "Treasure Hunt — Follow two or three steps to find and bring an item.",
          "Toy Organization — Sort blocks by color into different containers in sequence.",
        ],
      },
      {
        id: "2.5",
        text: "Recognizes and names some colors and shapes",
        activities: [
          "Color/Shape Sorting — Sort objects by color or shape, naming each as you go.",
          "Treasure Hunt — Find items of a named color or shape around the room.",
          "Shape & Color Matching Cards — Match cards showing the same color or shape.",
        ],
      },
      {
        id: "2.6",
        text: "Matches objects to pictures (e.g., matches a cup to a picture of a cup)",
        activities: [
          "Object and Picture Matching Cards — Match real objects to cards showing the same object.",
          "Picture-Object Hunt — Find the real object in the room matching a shown picture.",
          "Storybook Object Matching — Point to a pictured object and find its match nearby.",
        ],
      },
      {
        id: "2.7",
        text: 'Starts understanding time concepts (e.g., "Today", "Tomorrow", "Soon")',
        activities: [
          'Daily Routine Discussion — Use time words like "soon" and "later" during daily activities.',
          "Calendar Exploration — Explain today, tomorrow, and the days of the week on a calendar.",
          "Story Time with Time Concepts — Discuss when events happen in a story.",
        ],
      },
    ],
  },
  {
    id: "social_emotional",
    number: "3",
    title: "Social-Emotional Development",
    items: [
      {
        id: "3.1",
        text: "Shows empathy (e.g., may try to comfort a crying friend or doll)",
        activities: [
          'Comforting a Doll — Comfort a "sad" doll with a toy, hug, or kind words.',
          "Helping a Friend — Notice when a peer is upset and offer help.",
          "Empathy Storytelling — Discuss how a story character feels and how to help.",
        ],
      },
      {
        id: "3.2",
        text: "Engages in cooperative play with peers (shares, takes turns)",
        activities: [
          "Turn-Taking Game — Roll a ball back and forth, taking turns.",
          "Building Together — Build something together with a peer using blocks.",
          "Sharing Toys — Share and take turns with a toy during playtime.",
        ],
      },
      {
        id: "3.3",
        text: "Imitates adults and peers in play and everyday actions (e.g., pretending to cook)",
        activities: [
          "Pretend Cooking — Imitate stirring and serving in a pretend kitchen.",
          "Role-Playing with Dolls — Imitate feeding, bedtime, and talking to dolls.",
          "Imitate Chores — Imitate sweeping or dusting with a small broom.",
        ],
      },
      {
        id: "3.4",
        text: 'Follows simple social rules (e.g., waiting in line, saying "Please" and "Thank you")',
        activities: [
          "Playing Waiting Games — Wait for a turn during a rolling or swing game.",
          'Practice Saying "Please" and "Thank You" — Use polite words during snack or play.',
          'Social Role-Play — Practice "excuse me" and "may I please" in pretend store/restaurant play.',
        ],
      },
      {
        id: "3.5",
        text: "Begins to show interest in making friends",
        activities: [
          "Playdate Interaction — Greet a friend, share toys, and engage in simple activities together.",
          "Cooperative Play — Build a tower or complete a puzzle together with another child.",
          "Group Storytime — Sit with peers and discuss the story together.",
        ],
      },
      {
        id: "3.6",
        text: "May have fears or anxiety about specific things (e.g., darkness, loud noises)",
        activities: [
          "Nighttime Routine Practice — Comforting bedtime routine with soft lighting or a nightlight.",
          "Desensitization to Loud Noises — Gradually increase volume of a sound with reassurance.",
          "Comforting Reassurance — Acknowledge fears and offer comforting words or actions.",
        ],
      },
      {
        id: "3.7",
        text: "Expresses a wider range of emotions and uses words to express feelings",
        activities: [
          "Emotion Charades — Act out emotions and discuss how each one feels.",
          "Feelings Books — Discuss characters' feelings and the child's own feelings.",
          "Emotion Cards — Pick a card matching how they feel at different moments.",
        ],
      },
    ],
  },
  {
    id: "language",
    number: "4",
    title: "Language Development",
    items: [
      {
        id: "4.1",
        text: "Uses 3-4 word sentences consistently",
        activities: [
          "Sentence Building with Toys — Form 3-4 word sentences about toy scenarios.",
          "Prompted Conversations — Answer open-ended questions with 3-4 word sentences.",
          "Storytelling with Pictures — Describe pictures using 3-4 word sentences.",
        ],
      },
      {
        id: "4.2",
        text: "Has a vocabulary of 200+ words",
        activities: [
          "Interactive Reading — Point to and name objects, animals, and people in books.",
          "Labeling Everyday Items — Label objects and actions around the house.",
          "Sing Songs and Nursery Rhymes — Sing along and fill in missing words.",
        ],
      },
      {
        id: "4.3",
        text: "Names familiar people and objects (family members and favorite toys)",
        activities: [
          "Family Photo Book — Name each family member or toy from photos.",
          "Interactive Toy Play — Name favorite toys and identify family members in play.",
          "Name Recognition Game — Point to or bring the correct named person or toy.",
        ],
      },
      {
        id: "4.4",
        text: 'Asks simple "Why" and "What" questions',
        activities: [
          'Storytime Q&A — Ask and prompt "what" and "why" questions during reading.',
          "Explore Cause and Effect — Ask questions based on cause-and-effect observations.",
          "Daily Routine Discussions — Prompt questions during everyday activities.",
        ],
      },
      {
        id: "4.5",
        text: 'Follows multi-step directions (e.g., "Get your shoes and come to the door")',
        activities: [
          'Treasure Hunt — "Find your toy car and bring it to me."',
          'Clean-Up Time — "Pick up the blocks and put them in the basket."',
          'Obstacle Course — "Walk to the chair, pick up the ball, and bring it back."',
        ],
      },
      {
        id: "4.6",
        text: "Can state own name and age",
        activities: [
          "Name and Age Song — Sing a song including the child's name and age.",
          'Interactive Mirror Play — Ask "Who is that?" and "How old are you?" in front of a mirror.',
          "Family Introduction Game — Introduce themselves with name and age at gatherings.",
        ],
      },
      {
        id: "4.7",
        text: 'Uses pronouns (e.g., "He", "She", "It") correctly',
        activities: [
          'Doll Play — Refer to dolls using pronouns like "He is happy."',
          'Picture Book Pronouns — Ask "Who is she?" or "What is he doing?" about pictures.',
          "Family Pronouns — Identify people in family photos using pronouns.",
        ],
      },
    ],
  },
  {
    id: "adaptive",
    number: "5",
    title: "Adaptive (Self-Help) Skills",
    items: [
      {
        id: "5.1",
        text: "Fully feeds self with spoon and begins using fork more effectively",
        activities: [
          "Snack Time Practice — Use a spoon and fork with foods like yogurt or mashed potatoes.",
          "Play Kitchen — Practice utensil use while pretending to cook and serve food.",
          "Mealtime Assistance — Use a fork for pasta or cut-up fruit with minimal help.",
        ],
      },
      {
        id: "5.2",
        text: "Drinks from a cup without spilling",
        activities: [
          "Cup Practice with Water — Take small sips while holding the cup steady.",
          "Cup Challenge Game — Carry a cup of water from one spot to another without spilling.",
          "Meal Time Practice — Drink independently from a small, spill-proof cup.",
        ],
      },
      {
        id: "5.3",
        text: "Begins to dress and undress with minimal help",
        activities: [
          "Dress-Up Play — Put on and take off a jacket or shirt with minimal assistance.",
          'Interactive Clothing Game — "Find the sleeves" or "put your feet in the pants."',
          "Morning Routine Practice — Try putting on socks, shoes, or pants during dressing.",
        ],
      },
      {
        id: "5.4",
        text: "Participates in toilet training and stays dry for longer periods",
        activities: [
          "Regular Bathroom Breaks — Sit on the potty at regular intervals with positive reinforcement.",
          "Potty Training Books — Read books about using the toilet and staying dry.",
          "Reward System — Use a sticker chart to celebrate dry periods or potty successes.",
        ],
      },
      {
        id: "5.5",
        text: "Brushes teeth with some assistance",
        activities: [
          "Brush Together — Brush teeth alongside the child, demonstrating the motions.",
          "Toothbrush Play — Demonstrate brushing on a toy or doll first.",
          "Sing a Toothbrush Song — Guide their hand while singing a brushing song.",
        ],
      },
      {
        id: "5.6",
        text: "Helps in simple household tasks (e.g., cleaning up toys, helping set the table)",
        activities: [
          "Toy Clean-Up Time — Put toys back into bins or baskets, with praise for each task.",
          "Setting the Table — Place napkins, cups, or utensils on the table.",
          "Wipe Down Surfaces — Wipe tables, counters, or low shelves with a cloth.",
        ],
      },
      {
        id: "5.7",
        text: "Washes and dries hands independently",
        activities: [
          "Hand-Washing Routine — Turn on the tap, apply soap, scrub 20 seconds, and rinse.",
          "Pretend Play with Water — Practice the steps with a toy sink or doll.",
          "Hand Drying Practice — Dry hands properly with their own small towel.",
        ],
      },
    ],
  },
  {
    id: "sensory_regulation",
    number: "6",
    title: "Sensory and Emotional Regulation",
    items: [
      {
        id: "6.1",
        text: "Adjusts to change in routine with minimal upset",
        activities: [
          "Visual Schedule — Review a picture schedule of the day's activities.",
          "Role-Playing Changes — Practice routine changes with toys or dolls.",
          "Practice Transitions — Give a warning before moving between activities.",
        ],
      },
      {
        id: "6.2",
        text: "Can play alone for short periods (10-15 minutes)",
        activities: [
          "Independent Puzzle Play — Complete a simple puzzle without adult intervention.",
          "Drawing or Coloring — Color or draw independently with you nearby.",
          "Building Blocks — Build towers or structures alone.",
        ],
      },
      {
        id: "6.3",
        text: "Enjoys sensory activities (e.g., finger painting, playing with playdough)",
        activities: [
          "Finger Painting — Explore colors and textures with washable paints.",
          "Playdough Exploration — Mold, squish, and shape playdough with tools.",
          "Sensory Bins — Scoop and pour rice, sand, or water beads with small toys.",
        ],
      },
      {
        id: "6.4",
        text: "Manages frustration better, though may still have tantrums when upset",
        activities: [
          'Deep Breathing Exercises — Practice "smell a flower, blow out a candle" breathing.',
          "Emotion Cards or Books — Identify emotions and appropriate ways to express frustration.",
          "Calm-Down Corner — Use a cozy space with pillows and soothing toys to self-regulate.",
        ],
      },
      {
        id: "6.5",
        text: 'Begins to verbalize emotions (e.g., "I am mad", "I am happy")',
        activities: [
          "Emotion Flashcards — Identify facial expressions and match them to feelings.",
          "Feelings Chart — Point to or say which emotion they are feeling each day.",
          "Storytelling with Emotions — Discuss how characters feel and share their own feelings.",
        ],
      },
    ],
  },
];


const OVERALL_OPTIONS = [
  { value: "on_track", label: "On Track (49 – 72)" },
  { value: "slight_delay", label: "Slight Delay (25 – 48) — provide details below" },
  { value: "significant_delay", label: "Significant Delay (1 – 24) — provide details below" },
  { value: "other", label: "Other" },
];

function scoreOf(rating) {
  if (rating === "Can't do") return 0;
  if (rating === "Does Independently") return 4;
  if (rating === "1" || rating === "2" || rating === "3") return Number(rating);
  return null;
}
const ASSESSMENT_DOMAINS = [
  "Cognitive",
  "Language",
  "Literacy",
  "Numeracy",
  "Social-Emotional",
  "Physical & Motor Skills",
  "Creativity",
  "School Readiness",
];

const ASSESSMENT_STAGES = ["Baseline", "Midline", "Endline"];

/* TODO(backend): replace with real API calls once the Activity Engine
   endpoints from the DB/UI Integration Spec are wired up:
   - GET child profile          -> /children/:id
   - GET assessments            -> /children/:id/assessments
   - GET activity_recommendations joined with activities
   For now this renders with empty/placeholder state so the screen and
   flow can be reviewed before the backend contract lands. */

function ChildProfileTab({ child, editing, setEditing, form, setForm, onSave, saving }) {
  const field = (label, key, type = "text") => (
    <div>
      <label style={S.label}>{label}</label>
      {editing ? (
        type === "textarea" ? (
          <textarea
            style={{ ...S.input, height: 70, resize: "vertical" }}
            value={form[key] || ""}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        ) : (
          <input
            type={type}
            style={S.input}
            value={form[key] || ""}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        )
      ) : (
        <div style={{ fontSize: 13, color: "#374151", padding: "8px 0" }}>{form[key] || "Not added"}</div>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionCard title="Basic Information">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={S.label}>Child ID</label>
            <div style={{ fontSize: 13, color: "#9ca3af", padding: "8px 0" }}>{child.id}</div>
          </div>
          {field("Full Name", "name")}
          {field("Date of Birth", "dob", "date")}
          <div>
            <label style={S.label}>Age</label>
            <div style={{ fontSize: 13, color: "#374151", padding: "8px 0" }}>
              {form.dob ? Math.floor((Date.now() - new Date(form.dob)) / 3.15576e10) + " yrs" : "—"}
            </div>
          </div>
          <div>
            <label style={S.label}>Gender</label>
            {editing ? (
              <select style={S.input} value={form.gender || ""} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">Select…</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <div style={{ fontSize: 13, color: "#374151", padding: "8px 0" }}>{form.gender || "Not set"}</div>
            )}
          </div>
          {field("Admission Date", "admissionDate", "date")}
          <div>
            <label style={S.label}>Current Level (Milestone-based)</label>
            <div style={{ padding: "8px 0" }}>
              <Badge children="Auto-derived from latest assessment" color="#7c3aed" bg="#ede9fe" />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Additional Details">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {field("Parent/Guardian Name", "parentName")}
          {field("Contact Number", "contactNumber", "tel")}
          {field("Blood Group", "bloodGroup")}
          {field("Emergency Contact", "emergencyContact")}
        </div>
        {field("Address", "address", "textarea")}
        <div style={{ height: 12 }} />
        {field("Medical Conditions", "medicalConditions", "textarea")}
        <div style={{ height: 12 }} />
        {field("Allergies", "allergies", "textarea")}
        <div style={{ height: 12 }} />
        {field("Special Needs", "specialNeeds", "textarea")}
        <div style={{ height: 12 }} />
        {field("Interests", "interests")}
        <div style={{ height: 12 }} />
        {field("Notes", "notes", "textarea")}
      </SectionCard>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        {editing ? (
          <button onClick={onSave} disabled={saving} style={S.primaryBtn}>
            {saving ? "Saving..." : "💾 Save"}
          </button>
        ) : (
          <button onClick={() => setEditing(true)} style={S.primaryBtn}>
            ✏️ Edit Profile
          </button>
        )}
      </div>
    </div>
  );
}

function computeSectionScores(answers) {
  return SECTIONS.map((section) => {
    let score = 0;
    let max = 0;
    section.items.forEach((item) => {
      const scale = item.ratingScale || RATING_FULL;
      const itemMax = scale.includes("Does Independently") ? 4 : 3;
      max += itemMax;
      const s = scoreOf(answers[item.id]);
      if (s !== null) score += s;
    });
    return { id: section.id, title: section.title, score, max };
  });
}

const PIE_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4"];

function SectionPieChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.score, 0);

  if (total === 0) {
    return (
      <div style={{ padding: 30, textAlign: "center", color: "#94a3b8", border: "1px dashed #cbd5e1", borderRadius: 12 }}>
        Rate at least one item and save the assessment to see the section-wise breakdown.
      </div>
    );
  }

  const cx = 110, cy = 110, radius = 90;
  let cumulative = 0;
  const slices = data
    .filter((d) => d.score > 0)
    .map((d, i) => {
      const fraction = d.score / total;
      const startAngle = cumulative * 2 * Math.PI;
      cumulative += fraction;
      const endAngle = cumulative * 2 * Math.PI;
      const x1 = cx + radius * Math.sin(startAngle);
      const y1 = cy - radius * Math.cos(startAngle);
      const x2 = cx + radius * Math.sin(endAngle);
      const y2 = cy - radius * Math.cos(endAngle);
      const largeArc = fraction > 0.5 ? 1 : 0;
      const path =
        fraction >= 0.999
          ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius} Z`
          : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      return { ...d, path, fraction, color: PIE_COLORS[i % PIE_COLORS.length] };
    });

  return (
    <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
      <svg width={220} height={220} viewBox="0 0 220 220">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth={2} />
        ))}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: s.color, display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontWeight: 700, color: "#1c1917" }}>{s.title}</span>
            <span style={{ color: "#6b7280" }}>
              {s.score}/{s.max} pts · {Math.round(s.fraction * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChildAssessmentTab({ child }) {
  const [stage, setStage] = useState("Baseline");
  const [savedAssessments, setSavedAssessments] = useState({});
  const [answers, setAnswers] = useState({});
  const [openActivities, setOpenActivities] = useState({});
  const [overallStatus, setOverallStatus] = useState("");
  const [otherStatusText, setOtherStatusText] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [nextAssessmentDate, setNextAssessmentDate] = useState("");
  const [assessmentDate, setAssessmentDate] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const storageKey = `assessment_${child?.id}`;

  // Load any previously saved assessments for this child (stand-in for a real API call)
  useEffect(() => {
    if (!child) return;
    try {
      const raw = localStorage.getItem(storageKey);
      setSavedAssessments(raw ? JSON.parse(raw) : {});
    } catch {
      setSavedAssessments({});
    }
    setStage("Baseline");
  }, [child]); // eslint-disable-line react-hooks/exhaustive-deps

  // Populate the form whenever the stage changes or saved data updates
  useEffect(() => {
    const rec = savedAssessments[stage];
    setAnswers(rec?.answers || {});
    setOverallStatus(rec?.overallStatus || "");
    setOtherStatusText(rec?.otherStatusText || "");
    setRecommendation(rec?.recommendation || "");
    setNextAssessmentDate(rec?.nextAssessmentDate || "");
    setAssessmentDate(rec?.assessmentDate || "");
  }, [stage, savedAssessments]);

  const totalItems = SECTIONS.reduce((sum, s) => sum + s.items.length, 0);
  const answeredCount = Object.keys(answers).length;
  const totalScore = Object.values(answers).reduce((sum, r) => {
    const s = scoreOf(r);
    return sum + (s === null ? 0 : s);
  }, 0);

  const toggleActivities = (id) => setOpenActivities((p) => ({ ...p, [id]: !p[id] }));
  const setAnswer = (id, value) => setAnswers((p) => ({ ...p, [id]: value }));

  const handleSaveAssessment = () => {
    const sectionScores = computeSectionScores(answers);
    const record = {
      answers,
      overallStatus,
      otherStatusText,
      recommendation,
      nextAssessmentDate,
      assessmentDate,
      sectionScores,
      savedAt: Date.now(),
    };
    const updated = { ...savedAssessments, [stage]: record };
    setSavedAssessments(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
    // TODO(backend): POST record to /children/:id/assessments once the endpoint exists
    setSavedMsg(`${stage} assessment saved!`);
    setTimeout(() => setSavedMsg(""), 3000);
  };

  const currentSectionScores = savedAssessments[stage]?.sectionScores || computeSectionScores({});

  const stageBtn = (s) => (
    <button
      key={s}
      onClick={() => setStage(s)}
      style={{
        ...S.exportBtn,
        background: stage === s ? "#1e40af" : "white",
        color: stage === s ? "white" : "#6b7280",
        borderColor: stage === s ? "#1e40af" : "#e5e7eb",
      }}
    >
      {s}
      {savedAssessments[s] && <span style={{ marginLeft: 6 }}>✓</span>}
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 8 }}>{ASSESSMENT_STAGES.map(stageBtn)}</div>

      <SectionCard title={`${stage} Assessment`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={S.label}>Assessment Date</label>
            <input
              type="date"
              style={S.input}
              value={assessmentDate}
              onChange={(e) => setAssessmentDate(e.target.value)}
            />
          </div>
          <div>
            <label style={S.label}>Assessed By</label>
            <div style={{ fontSize: 13, color: "#374151", padding: "8px 0" }}>
              Auto-filled from logged-in teacher
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#1e293b",
            color: "#f1f5f9",
            borderRadius: 10,
            padding: "0.7rem 1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.85rem",
            marginBottom: 16,
          }}
        >
          <span>{answeredCount} / {totalItems} items rated</span>
          <span>Running score: {totalScore}</span>
        </div>

        {SECTIONS.map((section) => (
          <div key={section.id} style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "0.5rem",
                borderBottom: "2px solid #1e293b",
                paddingBottom: "0.4rem",
                marginBottom: "0.8rem",
              }}
            >
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#8a6a4f" }}>
                {section.number}
              </span>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1c1917", margin: 0 }}>
                {section.title}
              </h3>
            </div>

            {section.items.map((item) => {
              const scale = item.ratingScale || RATING_FULL;
              const currentValue = answers[item.id];
              const hasActivities = item.activities?.length > 0;
              const isOpen = !!openActivities[item.id];

              return (
                <div
                  key={item.id}
                  style={{
                    background: "white",
                    border: "1px solid #e4e2da",
                    borderRadius: 10,
                    padding: "0.9rem 1rem",
                    marginBottom: "0.6rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <p style={{ margin: 0, fontSize: 13, color: "#1c1917", flex: 1 }}>
                      <span style={{ color: "#8a6a4f", fontWeight: 700 }}>{item.id}</span>{" "}
                      {item.text}
                    </p>
                    {currentValue && <span style={{ color: "#5b7a5b", fontWeight: "bold" }}>✓</span>}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {scale.map((option) => {
                      const selected = currentValue === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setAnswer(item.id, option)}
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "5px 10px",
                            borderRadius: 999,
                            border: selected ? "1px solid #1e293b" : "1px solid #d8d5cb",
                            background: selected ? "#1e293b" : "#f7f7f5",
                            color: selected ? "#f4f2ec" : "#4b4f45",
                            cursor: "pointer",
                          }}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  {hasActivities && (
                    <div style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={() => toggleActivities(item.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 11,
                          color: "#8a6a4f",
                          fontWeight: 600,
                          padding: 0,
                        }}
                      >
                        {isOpen ? "Hide" : "Show"} suggested activities {isOpen ? "▲" : "▼"}
                      </button>
                      {isOpen && (
                        <ul style={{ margin: "0.5rem 0 0", paddingLeft: 18, fontSize: 12, color: "#4b4f45", lineHeight: 1.5 }}>
                          {item.activities.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1c1917", marginBottom: 8 }}>
            Overall Developmental Progress
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {OVERALL_OPTIONS.map((opt) => (
              <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#4b4f45", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="overallStatus"
                  checked={overallStatus === opt.value}
                  onChange={() => setOverallStatus(opt.value)}
                />
                {opt.label}
              </label>
            ))}
            {overallStatus === "other" && (
              <input
                type="text"
                value={otherStatusText}
                onChange={(e) => setOtherStatusText(e.target.value)}
                placeholder="Please specify details"
                style={{ ...S.input, marginTop: 6 }}
              />
            )}
          </div>

          <label style={S.label}>Recommendations / Next Steps</label>
          <textarea
            style={{ ...S.input, height: 70, resize: "vertical", marginBottom: 12 }}
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            placeholder="Enter recommended activities, therapies, or observations..."
          />

          <label style={S.label}>Next Follow-up Assessment Date</label>
          <input
            type="date"
            style={{ ...S.input, marginBottom: 16 }}
            value={nextAssessmentDate}
            onChange={(e) => setNextAssessmentDate(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={handleSaveAssessment} style={S.primaryBtn}>
            💾 Save {stage} Assessment
          </button>
          {savedMsg && <span style={{ fontSize: 12, color: "#059669", fontWeight: 700 }}>✓ {savedMsg}</span>}
        </div>
      </SectionCard>

      <SectionCard title="📈 Section-wise Score Breakdown">
        <SectionPieChart data={currentSectionScores} />
      </SectionCard>
    </div>
  );
}
function ActivitySuggestionsTab({ child }) {
  // TODO(backend): fetch from activity_recommendations joined with activities,
  // grouped by weak domain, for this child's most recent assessment_id.
  const recommendations = []; // placeholder — empty until wired to backend

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {recommendations.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", background: "white", borderRadius: 16, border: "1px dashed #cbd5e1", color: "#94a3b8" }}>
          No activity recommendations yet. These are generated automatically after an assessment
          is submitted, targeting the child's lowest-scoring domains.
        </div>
      ) : (
        recommendations.map((group) => (
          <SectionCard key={group.domain} title={`${group.domain} — Needs Support`}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
              {group.activities.map((a) => (
                <div key={a.activityId} style={{ background: "white", borderRadius: 14, padding: 16, border: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1c1917" }}>{a.name}</div>
                    <StatusBadge status={a.status || "assigned"} />
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>{a.objective}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}><strong>Materials:</strong> {a.materials}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}><strong>Duration:</strong> {a.duration}</div>
                  <Badge children={a.difficulty} color="#7c3aed" bg="#ede9fe" />
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button style={{ ...S.exportBtn, flex: 1, fontSize: 11 }}>Mark Completed</button>
                    <button style={{ ...S.exportBtn, flex: 1, fontSize: 11 }}>Add Observation</button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        ))
      )}
    </div>
  );
}

export default function ChildDashboardModal({ child, onClose }) {
  const [tab, setTab] = useState("profile");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: child?.name || "" });

  useEffect(() => {
    setForm({ name: child?.name || "" });
    setTab("profile");
    setEditing(false);
  }, [child]);

  const handleSaveProfile = () => {
    setSaving(true);
    // TODO(backend): call updateChildProfile(child.id, form) once endpoint exists
    setTimeout(() => {
      setSaving(false);
      setEditing(false);
    }, 400);
  };

  const tabBtn = (key, label, icon) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "9px 16px",
        border: "none",
        borderRadius: 10,
        background: tab === key ? "#dbeafe" : "transparent",
        color: tab === key ? "#1e40af" : "#6b7280",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      <span>{icon}</span> {label}
    </button>
  );

  if (!child) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 1200,
        backdropFilter: "blur(4px)",
        overflowY: "auto",
        padding: "32px 16px",
      }}
    >
      <div style={{ background: "#f8fafc", borderRadius: 20, width: "100%", maxWidth: 960, boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #e5e7eb", background: "white", borderRadius: "20px 20px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👶</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1c1917" }}>{child.name}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>Roll No: {child.rollNo}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, padding: "12px 24px 0", background: "white", borderBottom: "1px solid #f1f5f9" }}>
          {tabBtn("profile", "Child Profile", "🧾")}
          {tabBtn("assessment", "Child Assessment", "📊")}
          {tabBtn("activities", "Activity Suggestions", "🎯")}
        </div>

        {/* Content */}
        <div style={{ padding: 24, maxHeight: "70vh", overflowY: "auto" }}>
          {tab === "profile" && (
            <ChildProfileTab child={child} editing={editing} setEditing={setEditing} form={form} setForm={setForm} onSave={handleSaveProfile} saving={saving} />
          )}
          {tab === "assessment" && <ChildAssessmentTab child={child} />}
          {tab === "activities" && <ActivitySuggestionsTab child={child} />}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #e5e7eb", background: "white", borderRadius: "0 0 20px 20px", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={S.exportBtn}>← Back</button>
        </div>
      </div>
    </div>
  );
}
// Prajwal end

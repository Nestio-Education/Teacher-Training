// Duplicated from frontend src/pages/ChildDashboardModal.jsx
// TODO: Consolidate into a single shared file in a future iteration

const RATING_FULL = ["Can't do", "1", "2", "3", "Does Independently"];
const RATING_NO_INDEPENDENT = ["Can't do", "1", "2", "3"];

export const SECTIONS = [
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

export function scoreOf(rating) {
  if (rating === "Can't do") return 0;
  if (rating === "Does Independently") return 4;
  if (rating === "1" || rating === "2" || rating === "3") return Number(rating);
  return null;
}

export function computeSectionScores(answers) {
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

const ACADEMIC_YEAR_START_MONTH = 4; // April

export function getAcademicYear(dateInput) {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  // getMonth() is 0-indexed. April is 3. 
  // If we start in month 4 (April), getMonth() >= 3.
  if (date.getMonth() >= (ACADEMIC_YEAR_START_MONTH - 1)) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
}

// Child Assessment Sections & Milestones Data
// Comprehensive Multi Age-Group Support:
// - Age 1–2 Years (40 Questions across 5 Domains)
// - Age 2–3 Years (40 Questions across 5 Domains)
// - Age 3–4 Years (48 Questions across 6 Domains)
// - Age 4–5 Years (48 Questions across 6 Domains)

export const RATING_FULL = ["Can't do", "1", "2", "3", "Does Independently"];
export const RATING_NO_INDEPENDENT = ["Can't do", "1", "2", "3"];

export const RATING_SCALE_3 = [
  "1 (Can't do)",
  "2 (Emerging)",
  "3 (Does Independently)"
];



export const SECTIONS_1_2_YEARS = [
  {
    id: "physical",
    number: "1",
    title: "Domain 1: Physical Development",
    items: [
      {
        id: "1.1",
        title: "Gross Motor - Walking",
        milestone: "Walks alone with few falls (Level 1, Age 1-1.5)",
        targetAge: "1–1.5 Years",
        text: "During the observation, does the child demonstrate the ability to walk independently with some stability?",
        activities: [
          "Toy Collection Walk – Place toys at different spots and encourage the child to walk independently to collect them.",
          "Follow Me Walking – Encourage the child to follow an adult while walking across the room.",
          "Walk to the Favorite Object – Place a favorite toy a short distance away and encourage the child to walk towards it."
        ]
      },
      {
        id: "1.2",
        title: "Gross Motor - Climbing",
        milestone: "Climbs onto low furniture (Level 1, Age 1-1.5)",
        targetAge: "1–1.5 Years",
        text: "Does the child attempt to climb onto low surfaces or objects with confidence and safety?",
        activities: [
          "Cushion Climb – Arrange firm cushions/low foam blocks and encourage the child to climb up and down safely.",
          "Sofa Climbing Practice – With supervision, encourage the child to climb onto a low sofa or mattress.",
          "Obstacle Adventure – Create a simple obstacle area with low objects to climb over."
        ]
      },
      {
        id: "1.3",
        title: "Gross Motor - Stair Climbing",
        milestone: "Walks up stairs with help (Level 1, Age 1-1.5)",
        targetAge: "1–1.5 Years",
        text: "With assistance, does the child demonstrate the ability to walk up stairs one step at a time?",
        activities: [
          "Stair Climbing with Support – Hold the child's hand and encourage them to walk up stairs one step at a time.",
          "Reach the Toy on the Step – Place a favorite toy on a higher step and encourage climbing with assistance.",
          "Step-Up Practice – Use a low step stool and encourage stepping up and down with support."
        ]
      },
      {
        id: "1.4",
        title: "Gross Motor - Running",
        milestone: "Runs without falling frequently (Level 2, Age 1.5-2)",
        targetAge: "1.5–2 Years",
        text: "Does the child demonstrate the ability to run with increasing speed and balance?",
        activities: [
          "Chase and Run – Play a gentle chasing game and encourage the child to run after an adult.",
          "Run to the Target – Place a toy at a short distance and encourage the child to run towards it.",
          "Animal Running Game – Pretend to run like different animals and encourage imitation."
        ]
      },
      {
        id: "1.5",
        title: "Gross Motor - Kicking",
        milestone: "Kicks ball forward (Level 2, Age 1.5-2)",
        targetAge: "1.5–2 Years",
        text: "Does the child demonstrate the ability to kick a ball forward with coordination?",
        activities: [
          "Ball Kick Practice – Place a soft ball in front and encourage kicking forward.",
          "Kick into the Goal – Create a simple goal using boxes/cones and encourage kicking towards it.",
          "Roll and Kick – Roll a ball towards the child and encourage stopping and kicking it back."
        ]
      },
      {
        id: "1.6",
        title: "Gross Motor - Jumping",
        milestone: "Begins to jump with both feet (Level 2, Age 1.5-2)",
        targetAge: "1.5–2 Years",
        text: "Does the child attempt to jump using both feet together with developing coordination?",
        activities: [
          "Jump on the Spot – Encourage bending slightly and attempting a jump with both feet together.",
          "Jump Over a Line – Place a rope/tape line on the floor and encourage jumping across it.",
          "Jumping Circles – Place paper circles on the floor and encourage jumping from one to another."
        ]
      },
      {
        id: "1.7",
        title: "Fine Motor - Building",
        milestone: "Builds a tower (2-3 blocks) (Level 3, Age 1-1.5)",
        targetAge: "1–1.5 Years",
        text: "Does the child demonstrate the ability to stack blocks or objects to build a simple tower?",
        activities: [
          "Stack Cubes – Provide blocks and encourage stacking them one on top of another.",
          "Knock It Down – Allow the child to build and then knock down the tower for repeated practice.",
          "Sort by Color/Size – Encourage sorting blocks before stacking to develop cognitive skills alongside motor skills."
        ]
      },
      {
        id: "1.8",
        title: "Fine Motor - Pincer Grasp",
        milestone: "Uses a pincer grasp (Level 3, Age 1-1.5)",
        targetAge: "1–1.5 Years",
        text: "Does the child demonstrate the ability to pick up small objects using thumb and forefinger?",
        activities: [
          "Pick Up Cereal – Place small cereal pieces on a surface and encourage picking up with thumb and forefinger.",
          "Sort Small Toys – Provide small objects of different colors and encourage sorting them into containers.",
          "Playdough Exploration – Provide soft playdough for poking, pinching, and shaping to strengthen finger muscles."
        ]
      }
    ]
  },
  {
    id: "cognitive",
    number: "2",
    title: "Domain 2: Cognitive Development",
    items: [
      {
        id: "2.1",
        title: "Visual Recognition",
        milestone: "Recognizes familiar images in books (Level 1, Age 1-1.5)",
        targetAge: "1–1.5 Years",
        text: "Does the child demonstrate the ability to identify or point to familiar images in books?",
        activities: [
          "Picture Book Exploration – Sit with the child and explore a picture book containing familiar objects, animals, and people.",
          "Find the Picture – Ask the child to find a familiar image such as a ball, dog, or car.",
          "Family Photo Book – Create a simple book using family photographs and encourage identification of familiar faces."
        ]
      },
      {
        id: "2.2",
        title: "Understanding Positional Concepts",
        milestone: "Understands 'in' and 'out' concepts (Level 1, Age 1-1.5)",
        targetAge: "1–1.5 Years",
        text: "Does the child demonstrate understanding of 'in' and 'out' through hands-on exploration?",
        activities: [
          "Put It In – Provide a box and toys and encourage placing toys inside the box.",
          "Take It Out – Place objects inside a container and encourage removing them one by one.",
          "Ball and Basket Play – Encourage placing balls into a basket and then taking them out again."
        ]
      },
      {
        id: "2.3",
        title: "Shape Sorting",
        milestone: "Completes shape sorter with help (Level 1, Age 1-1.5)",
        targetAge: "1–1.5 Years",
        text: "With guidance, does the child demonstrate the ability to match shapes to their correct openings?",
        activities: [
          "Shape Sorter Exploration – Provide a shape sorter toy and guide the child to place shapes into correct openings.",
          "Match the Shape – Show one shape at a time and help the child find the matching slot.",
          "Trial and Try Again – Allow experimentation with different shapes while providing gentle support."
        ]
      },
      {
        id: "2.4",
        title: "Matching Objects",
        milestone: "Matches objects by color or shape (Level 2, Age 1.5-2)",
        targetAge: "1.5–2 Years",
        text: "Does the child demonstrate the ability to group similar objects by color or shape?",
        activities: [
          "Color Matching Basket – Provide objects of different colors and encourage grouping similar colors together.",
          "Shape Pairing Game – Place matching shapes on the floor and encourage finding pairs.",
          "Sort and Group – Offer everyday objects of different colors/shapes and encourage sorting into groups."
        ]
      },
      {
        id: "2.5",
        title: "Puzzle Completion",
        milestone: "Completes simple insert puzzles (Level 2, Age 1.5-2)",
        targetAge: "1.5–2 Years",
        text: "Does the child demonstrate the ability to complete simple puzzles with increasing independence?",
        activities: [
          "Animal Insert Puzzle – Provide a simple insert puzzle with large pieces and encourage correct placement.",
          "Shape Puzzle Challenge – Offer a basic shape puzzle and guide matching shapes to correct spaces.",
          "Independent Puzzle Time – Allow completion of a simple puzzle with minimal assistance."
        ]
      },
      {
        id: "2.6",
        title: "Verbal Counting",
        milestone: "Counts objects verbally (1-3) (Level 2, Age 1.5-2)",
        targetAge: "1.5–2 Years",
        text: "Does the child demonstrate early counting skills by verbally counting up to three objects?",
        activities: [
          "Count the Blocks – Place up to three blocks and count them together aloud.",
          "Snack Counting – Count pieces of fruit or crackers during snack time.",
          "Toy Counting Game – Ask the child to count up to three toys while pointing to each object."
        ]
      },
      {
        id: "2.7",
        title: "Following Simple Directions",
        milestone: "Understands simple questions (Level 4, Age 1.5-2)",
        targetAge: "1.5–2 Years",
        text: "Does the child demonstrate understanding of simple questions and instructions?",
        activities: [
          "Where's the Dog? – Ask simple questions about objects in the room.",
          "Can You...? – Give simple instructions like 'Can you pick up the ball?'",
          "What's That? – Point to objects and ask the child to identify them."
        ]
      },
      {
        id: "2.8",
        title: "Problem Solving",
        milestone: "Uses trial-and-error (Level 4, Age 1.5-2)",
        targetAge: "1.5–2 Years",
        text: "Does the child demonstrate problem-solving skills through trial and error?",
        activities: [
          "Fit the Shape – Observe how the child attempts to fit shapes into a sorter.",
          "How Do I Open This? – Provide a container with a lid and observe exploration.",
          "Get the Toy – Place a toy slightly out of reach with a tool available to retrieve it."
        ]
      }
    ]
  },
  {
    id: "social",
    number: "3",
    title: "Domain 3: Socio-Emotional Development",
    items: [
      {
        id: "3.1",
        title: "Social Engagement with Caregiver",
        milestone: "Enjoys playing with caregiver (Level 1, Age 1-1.5)",
        targetAge: "1–1.5 Years",
        text: "Does the child demonstrate joy and engagement during interactive play with the caregiver?",
        activities: [
          "Peek-a-Boo Play – Play peek-a-boo using a cloth, hands, or by hiding behind furniture.",
          "Roll the Ball Together – Sit facing the child and roll a ball back and forth.",
          "Action Song Time – Sing action songs with movements such as clapping, waving, or stomping."
        ]
      },
      {
        id: "3.2",
        title: "Recognition of Family",
        milestone: "Recognizes own name and family members (Level 1, Age 1-1.5)",
        targetAge: "1–1.5 Years",
        text: "Does the child demonstrate recognition of family members and respond to their own name?",
        activities: [
          "Family Photo Recognition – Show photographs and encourage pointing to familiar people.",
          "Name Calling Game – Call the child's name from different parts of the room and observe response.",
          "Who Is This? – Show pictures of family members and ask simple questions like 'Where is Mama?'"
        ]
      },
      {
        id: "3.3",
        title: "Parallel Play",
        milestone: "Enjoys peer presence but plays side-by-side (Level 1, Age 1-1.5)",
        targetAge: "1–1.5 Years",
        text: "Does the child demonstrate comfort playing alongside peers without necessarily interacting directly?",
        activities: [
          "Side-by-Side Block Play – Provide similar blocks to two children and encourage parallel play.",
          "Shared Play Mat – Arrange toys on a large mat and allow children to play beside one another.",
          "Drawing Together – Provide paper and crayons to children seated side by side."
        ]
      },
      {
        id: "3.4",
        title: "Expressing Affection",
        milestone: "Expresses affection openly (Level 2, Age 1.5-2)",
        targetAge: "1.5–2 Years",
        text: "Does the child demonstrate affectionate behaviours towards others and objects?",
        activities: [
          "Hug the Teddy – Provide a soft toy and encourage hugging, cuddling, or caring for it.",
          "Greeting Family Members – Encourage greeting with a smile, hug, or wave.",
          "Caring for a Doll – Provide a doll and encourage feeding, hugging, or putting it to sleep."
        ]
      },
      {
        id: "3.5",
        title: "Imitation of Peers",
        milestone: "Imitates peers' actions (Level 2, Age 1.5-2)",
        targetAge: "1.5–2 Years",
        text: "Does the child demonstrate the ability to observe and copy actions of other children?",
        activities: [
          "Copy My Action – Encourage one child to perform simple actions while another child copies.",
          "Follow a Friend – Invite children to imitate a peer's movements during play.",
          "Group Movement Game – Play an action song and encourage children to copy each other's movements."
        ]
      },
      {
        id: "3.6",
        title: "Empathy Development",
        milestone: "Shows empathy (hugs a crying friend) (Level 2, Age 1.5-2)",
        targetAge: "1.5–2 Years",
        text: "Does the child demonstrate caring behaviours towards others who appear distressed?",
        activities: [
          "Comfort the Teddy – Pretend a teddy bear is sad and encourage comforting with a hug or gentle touch.",
          "Feelings Picture Cards – Show pictures of children displaying different emotions and discuss how they may feel.",
          "Caring Role Play – Use dolls/puppets to act out situations where someone feels upset and encourage offering comfort."
        ]
      },
      {
        id: "3.7",
        title: "Waiting for Turns",
        milestone: "Waits for a turn with reminders (Level 4, Age 1.5-2)",
        targetAge: "1.5–2 Years",
        text: "With reminders, does the child demonstrate the ability to wait for a turn during activities?",
        activities: [
          "1-2-3 Wait – Use a countdown to help the child understand waiting.",
          "Patience Queue – Practice taking turns during a simple activity.",
          "Take Turns on a Swing – Use playground equipment to practice turn-taking."
        ]
      },
      {
        id: "3.8",
        title: "Participating in Group Activities",
        milestone: "Engages in simple group activities (Level 3, Age 1-1.5)",
        targetAge: "1–1.5 Years",
        text: "Does the child participate in simple group activities with other children?",
        activities: [
          "Ring Around the Rosy – Participate in simple group circle games.",
          "Follow the Leader – Copy simple movements as a group.",
          "Group Dance – Move to music together with other children."
        ]
      }
    ]
  },
  {
    id: "adaptive",
    number: "4",
    title: "Domain 4: Adaptive (Self-Help) Skills",
    items: [
      {
        id: "4.1",
        title: "Self-Feeding Beginnings",
        milestone: "Begins trying to use spoon more skillfully (Level 1, Age 1-1.5)",
        targetAge: "1–1.5 Years",
        text: "Does the child demonstrate emerging ability to use a spoon for self-feeding?",
        activities: [
          "Spoon Scooping Practice – Provide soft foods and encourage scooping with a spoon.",
          "Transfer Game with Spoon – Transfer safe objects from one bowl to another using a spoon.",
          "Mealtime Independence – Allow holding and using a spoon during meals with minimal assistance."
        ]
      },
      {
        id: "4.2",
        title: "Oral Care Participation",
        milestone: "Starts brushing teeth with help (Level 1, Age 1-1.5)",
        targetAge: "1–1.5 Years",
        text: "Does the child participate in toothbrushing routines with assistance?",
        activities: [
          "Toothbrush Exploration – Provide a child-safe toothbrush and encourage exploration.",
          "Mirror Brushing Time – Stand together and model brushing movements.",
          "Brush Together – Brush alongside the child and encourage copying the actions."
        ]
      },
      {
        id: "4.3",
        title: "Advanced Self-Feeding",
        milestone: "Eats with spoon with little spilling (Level 1, Age 1-1.5)",
        targetAge: "1–1.5 Years",
        text: "Does the child demonstrate increased control when using a spoon, with minimal spilling?",
        activities: [
          "Self-Feeding Practice – Offer foods that are easy to scoop and encourage independent spoon use.",
          "Thick Food Scooping – Provide thicker foods that stay on the spoon more easily.",
          "Mealtime Routine – Encourage completing several spoonfuls independently during meals."
        ]
      },
      {
        id: "4.4",
        title: "Independent Feeding",
        milestone: "Uses spoon and cup independently with minimal spilling (Level 2, Age 1.5-2)",
        targetAge: "1.5–2 Years",
        text: "Does the child demonstrate ability to use both spoon and cup with minimal assistance?",
        activities: [
          "Snack and Drink Time – Encourage using both a spoon and cup independently during meals.",
          "Water Practice – Provide small amounts of water and allow independent cup practice.",
          "Independent Meal Routine – Support completing a meal using a spoon and cup with minimal assistance."
        ]
      },
      {
        id: "4.5",
        title: "Dressing Participation",
        milestone: "Helps put on clothes (Level 2, Age 1.5-2)",
        targetAge: "1.5–2 Years",
        text: "Does the child participate in dressing routines by helping to put on clothing?",
        activities: [
          "Arm Through Sleeve – Encourage placing arms into sleeves while dressing.",
          "Dress-Up Play – Use simple dress-up clothes and encourage helping to wear them.",
          "Clothing Assistance Routine – Invite assisting during dressing by pulling clothes into position."
        ]
      },
      {
        id: "4.6",
        title: "Simple Clothing Removal",
        milestone: "Removes simple clothing (Level 3, Age 1-1.5)",
        targetAge: "1–1.5 Years",
        text: "Does the child demonstrate ability to remove simple items of clothing?",
        activities: [
          "Take Off Socks – Encourage removing socks independently.",
          "Pull Off a Hat – Practice removing hats.",
          "Dress-Up Game – Use dress-up clothes for practicing putting on and taking off."
        ]
      },
      {
        id: "4.7",
        title: "Toileting Readiness",
        milestone: "Uses toilet with reminders (Level 2, Age 1.5-2)",
        targetAge: "1.5–2 Years",
        text: "With reminders and support, does the child participate in toileting routines?",
        activities: [
          "Toilet Routine Practice – Take the child to the toilet at regular times.",
          "Potty Story Time – Read simple books about toilet routines.",
          "Reminder and Reward System – Provide gentle reminders and positive encouragement."
        ]
      },
      {
        id: "4.8",
        title: "Pincer Grasp for Self-Help",
        milestone: "Uses pincer grasp (Level 3, Age 1-1.5)",
        targetAge: "1–1.5 Years",
        text: "Does the child demonstrate pincer grasp skills needed for self-help activities?",
        activities: [
          "Pick Up Cereal – Pick up small food pieces for self-feeding.",
          "Sort Small Toys – Practice sorting objects using thumb and forefinger.",
          "Playdough Exploration – Pinch, pull, and manipulate materials."
        ]
      }
    ]
  },
  {
    id: "sensory",
    number: "5",
    title: "Domain 5: Sensory & Emotional Regulation",
    items: [
      {
        id: "5.1",
        title: "Texture Exploration",
        milestone: "Tries new textures (soft/hard food) (Level 1, Age 1-1.5)",
        targetAge: "1–1.5 Years",
        text: "Does the child demonstrate willingness to explore and taste foods of different textures?",
        activities: [
          "Texture Food Exploration – Offer soft foods and harder foods for touching and tasting.",
          "Sensory Basket – Create a basket with safe objects of different textures for exploring.",
          "Texture Touch Game – Invite feeling and comparing different materials."
        ]
      },
      {
        id: "5.2",
        title: "Sensory Preferences",
        milestone: "Notices and avoids unpleasant textures (Level 1, Age 1-1.5)",
        targetAge: "1–1.5 Years",
        text: "Does the child demonstrate clear preferences or aversions to certain textures?",
        activities: [
          "Texture Choice Activity – Provide varied textures and observe which ones are preferred or avoided.",
          "Sensory Sorting – Encourage separating textures they like from those they dislike.",
          "Gentle Texture Introduction – Gradually introduce new textures at their own pace."
        ]
      },
      {
        id: "5.3",
        title: "Sensory Preferences - Sounds",
        milestone: "Shows clear preferences for textures/sounds (Level 1, Age 1-1.5)",
        targetAge: "1–1.5 Years",
        text: "Does the child demonstrate preferences for specific sounds or auditory experiences?",
        activities: [
          "Sound Exploration – Play different sounds and observe reactions.",
          "Texture Preference Board – Provide materials with different textures and encourage choosing favorites.",
          "Favorite Sensory Play – Offer sensory activities using preferred textures and sounds."
        ]
      },
      {
        id: "5.4",
        title: "Messy Play Engagement",
        milestone: "Enjoys messy activities like sand/water play (Level 2, Age 1.5-2)",
        targetAge: "1.5–2 Years",
        text: "Does the child demonstrate enjoyment and engagement in messy sensory activities?",
        activities: [
          "Water Play Tub – Provide containers and water for pouring and splashing.",
          "Sand Play Exploration – Allow scooping, digging, and pouring sand using tools.",
          "Sensory Tray Play – Create a tray with rice, sand, or water beads for exploration."
        ]
      },
      {
        id: "5.5",
        title: "Emotional Regulation with Support",
        milestone: "Begins to regulate emotions when guided (Level 2, Age 1.5-2)",
        targetAge: "1.5–2 Years",
        text: "With adult guidance, does the child demonstrate emerging ability to regulate emotions?",
        activities: [
          "Deep Breathing with Adult – Model slow breathing and encourage copying during calm moments.",
          "Emotion Picture Cards – Show pictures of different emotions and discuss how people may feel.",
          "Calm Down Corner – Create a quiet space with support where the child can relax."
        ]
      },
      {
        id: "5.6",
        title: "Emotion Recognition in Self",
        milestone: "Recognizes emotions in self/others (Level 2, Age 1.5-2)",
        targetAge: "1.5–2 Years",
        text: "Does the child demonstrate ability to recognize and label emotions in themselves?",
        activities: [
          "Mirror Emotions Game – Encourage making happy, sad, or surprised faces while looking in a mirror.",
          "Emotion Matching Cards – Use picture cards showing different emotions.",
          "Storybook Feelings Discussion – Read simple stories and discuss how characters may be feeling."
        ]
      },
      {
        id: "5.7",
        title: "Emotion Recognition in Others",
        milestone: "Recognizes emotions in others (Level 4, Age 1.5-2)",
        targetAge: "1.5–2 Years",
        text: "Does the child demonstrate ability to recognize and respond to emotions in others?",
        activities: [
          "Guess the Feeling – Show picture cards and ask the child to identify how the person might feel.",
          "Emotion Charades – Act out emotions and ask the child to identify them.",
          "Feeling Storytime – Use books with emotional content and discuss character feelings."
        ]
      },
      {
        id: "5.8",
        title: "Self-Comforting",
        milestone: "Comforts self (Level 4, Age 1.5-2)",
        targetAge: "1.5–2 Years",
        text: "Does the child demonstrate ability to self-soothe using comforting strategies?",
        activities: [
          "Find Your Thumb – Observe if the child uses thumb-sucking for comfort.",
          "Hug a Blanket – Provide a comfort object and observe its use.",
          "Cozy Corner – Create a quiet space where the child can go to calm down."
        ]
      }
    ]
  }
];


export const SECTIONS_2_3_YEARS = [
  {
    id: "physical",
    number: "1",
    title: "Domain 1: Physical Development",
    items: [
      {
        id: "1.1",
        title: "Running, Stopping and Turning",
        milestone: "Runs smoothly, stops and turns easily (Level 3 | Age 2–2.5 Years | Month 1)",
        targetAge: "2–2.5 Years",
        text: "Does the child demonstrate the ability to run smoothly, stop, and change direction while maintaining body control?",
        activities: [
          "Running Path Game – Set up a simple path using cones or toys. Encourage the child to run, stop at a signal, and turn around.",
          "Freeze and Run – Let the child run while music plays. When the music stops, ask the child to freeze and then change direction.",
          "Follow the Leader Run – Run, stop, and change direction while encouraging the child to copy the movements."
        ]
      },
      {
        id: "1.2",
        title: "Jumping With Both Feet",
        milestone: "Jumps with both feet off the ground (Level 3 | Age 2–2.5 Years | Month 2)",
        targetAge: "2–2.5 Years",
        text: "Does the child jump using both feet together and lift both feet off the ground?",
        activities: [
          "Jump Over Line – Place a tape line or rope on the floor and encourage the child to jump over it using both feet.",
          "Animal Jump Game – Ask the child to pretend to be a frog or rabbit and jump with both feet.",
          "Cushion Jumping – Place soft cushions or mats and encourage the child to jump safely from one to another."
        ]
      },
      {
        id: "1.3",
        title: "Walking on Tiptoes",
        milestone: "Walks on tiptoes briefly (Level 3 | Age 2–2.5 Years | Month 5)",
        targetAge: "2–2.5 Years",
        text: "Can the child walk on tiptoes for a short distance while maintaining balance?",
        activities: [
          "Tiptoe Race – Mark a short path and encourage the child to walk from start to finish on tiptoes.",
          "Quiet Mouse Game – Ask the child to pretend to be a little mouse walking quietly on tiptoes.",
          "Tiptoe Path – Create a path using tape or floor markers and ask the child to follow it on tiptoes."
        ]
      },
      {
        id: "1.4",
        title: "Running and Changing Direction",
        milestone: "Runs easily, changes direction quickly (Level 4 | Age 2.5–3 Years | Month 1)",
        targetAge: "2.5–3 Years",
        text: "Can the child run around objects and change direction without falling or knocking them over?",
        activities: [
          "Zigzag Running – Place cones or toys in a zigzag pattern and encourage the child to run around them.",
          "Red Light, Green Light – Ask the child to run on 'Green Light' and stop or change direction on 'Red Light.'",
          "Chase the Ball – Roll a ball in different directions and encourage the child to run after it."
        ]
      },
      {
        id: "1.5",
        title: "Balancing on One Foot",
        milestone: "Balances on one foot for 3–5 seconds (Level 4 | Age 2.5–3 Years | Month 3)",
        targetAge: "2.5–3 Years",
        text: "Can the child balance on one foot for 3–5 seconds without losing balance?",
        activities: [
          "Flamingo Stand – Ask the child to stand on one foot while counting slowly to five.",
          "Balance Challenge – Encourage the child to see how long they can stand on one foot without touching the ground.",
          "Reach and Balance – Place a toy nearby and ask the child to balance on one foot while reaching toward it."
        ]
      },
      {
        id: "1.6",
        title: "Hopping on One Foot",
        milestone: "Hops on one foot a few times (Level 4 | Age 2.5–3 Years | Month 4)",
        targetAge: "2.5–3 Years",
        text: "Does the child demonstrate the ability to hop on one foot multiple times while maintaining balance?",
        activities: [
          "Hop Like a Bunny – Encourage the child to hop on one foot while pretending to be a bunny.",
          "Hop Between Circles – Draw circles on the floor and ask the child to hop from one circle to another using one foot.",
          "Hop and Count Game – Ask the child to hop while counting each hop aloud."
        ]
      },
      {
        id: "1.7",
        title: "Kicking a Ball Forward",
        milestone: "Kicks a ball forward (Level 3 | Age 2–2.5 Years)",
        targetAge: "2–2.5 Years",
        text: "Can the child kick a stationary ball forward toward a target?",
        activities: [
          "Kick the Ball – Place a soft ball in front of the child and encourage them to kick it forward.",
          "Target Kick – Place a large target or box a short distance away and ask the child to kick the ball toward it.",
          "Ball Path Game – Create a simple path and encourage the child to kick the ball along the path."
        ]
      },
      {
        id: "1.8",
        title: "Fine-Motor Pincer Control",
        milestone: "Uses a pincer grip to pick up small objects (Level 3 | Age 2–2.5 Years)",
        targetAge: "2–2.5 Years",
        text: "Can the child pick up small safe objects using the thumb and finger with controlled movement?",
        activities: [
          "Pick Up Cereal – Ask the child to pick up small pieces of cereal using the thumb and finger.",
          "Small Toy Sorting – Encourage the child to pick up and place small safe objects into separate containers.",
          "Playdough Pinching – Give playdough and ask the child to pinch and make small pieces using the fingers."
        ]
      }
    ]
  },
  {
    id: "cognitive",
    number: "2",
    title: "Domain 2: Cognitive Development",
    items: [
      {
        id: "2.1",
        title: "Cause-and-Effect Understanding",
        milestone: "Understands simple cause-effect relationships (Level 3 | Age 2–2.5 Years | Month 1)",
        targetAge: "2–2.5 Years",
        text: "Can the child understand that one action can produce a result?",
        activities: [
          "Push and See – Provide a toy with a button, lever, or switch and encourage the child to operate it.",
          "Rolling Ball Ramp – Let the child roll balls down ramps of different heights and observe what happens.",
          "Water Pouring Activity – Give two cups and allow the child to pour water from one cup into another."
        ]
      },
      {
        id: "2.2",
        title: "Completing a Simple Puzzle",
        milestone: "Completes simple puzzles (3–4 pieces) (Level 3 | Age 2–2.5 Years | Month 2)",
        targetAge: "2–2.5 Years",
        text: "Can the child complete a simple 3–4-piece puzzle by fitting the pieces correctly?",
        activities: [
          "Animal Puzzle Time – Give the child a 3–4-piece animal puzzle to complete.",
          "Shape Puzzle Board – Ask the child to fit shapes into their correct spaces.",
          "Picture Match Puzzle – Cut a familiar picture into 3–4 large pieces and ask the child to assemble it."
        ]
      },
      {
        id: "2.3",
        title: "Sorting by Colour and Shape",
        milestone: "Matches objects by multiple attributes (Level 3 | Age 2–2.5 Years | Month 5)",
        targetAge: "2–2.5 Years",
        text: "Can the child sort objects using more than one feature, such as colour and shape?",
        activities: [
          "Colour and Shape Sorting – Ask the child to sort blocks by colour and shape.",
          "Button Sorting Game – Give safe counters of different colours and sizes and ask the child to group them.",
          "Toy Basket Sorting – Ask the child to sort toys according to size and type."
        ]
      },
      {
        id: "2.4",
        title: "Recognizing Basic Shapes",
        milestone: "Recognizes and names basic shapes (Level 4 | Age 2.5–3 Years | Month 2)",
        targetAge: "2.5–3 Years",
        text: "Can the child identify and name basic shapes such as a circle, square, and triangle?",
        activities: [
          "Shape Hunt – Hide circles, squares, and triangles and ask the child to find and name them.",
          "Shape Matching Cards – Give the child shape cards and ask them to match identical shapes.",
          "Draw the Shape – Show a simple shape and ask the child to trace or draw it."
        ]
      },
      {
        id: "2.5",
        title: "Counting 1–10",
        milestone: "Counts 1–10 with help (Level 4 | Age 2.5–3 Years | Month 4)",
        targetAge: "2.5–3 Years",
        text: "Can the child count objects from 1 to 10 with support?",
        activities: [
          "Count the Blocks – Give ten blocks and encourage the child to count them while stacking.",
          "Snack Counting – Ask the child to count pieces of fruit or crackers.",
          "Toy Counting Basket – Place toys in a basket and ask the child to count them while taking them out."
        ]
      },
      {
        id: "2.6",
        title: "Recognizing Numbers",
        milestone: "Recognizes numbers 1–10 (Level 4 | Age 2.5–3 Years | Month 6)",
        targetAge: "2.5–3 Years",
        text: "Can the child recognize and identify numbers from 1 to 10?",
        activities: [
          "Number Flash Cards – Show number cards from 1 to 10 and ask the child to identify them.",
          "Hop to the Number – Place number cards on the floor and ask the child to move to the number you call.",
          "Number Matching Game – Ask the child to match a number card with the corresponding quantity of objects."
        ]
      },
      {
        id: "2.7",
        title: "Remembering Past Events",
        milestone: "Shows memory of past events (Level 4 | Age 2.5–3 Years)",
        targetAge: "2.5–3 Years",
        text: "Can the child remember and talk about something that happened earlier?",
        activities: [
          "Breakfast Recall – Ask, 'What did you eat for breakfast?'",
          "Yesterday Recall – Ask, 'Where did you go yesterday?'",
          "Remember the Story – Read a short familiar story and ask the child what happened."
        ]
      },
      {
        id: "2.8",
        title: "Following Three-Step Directions",
        milestone: "Follows 3-step directions (Level 4 | Age 2.5–3 Years)",
        targetAge: "2.5–3 Years",
        text: "Can the child follow three simple instructions in the correct order?",
        activities: [
          "Pick–Put–Close – Ask the child to pick up a toy, put it in the box, and close the box.",
          "Jump–Clap–Spin – Ask the child to jump, clap, and then spin.",
          "Touch–Touch–Wave – Ask the child to touch their head, touch their toes, and wave."
        ]
      }
    ]
  },
  {
    id: "social",
    number: "3",
    title: "Domain 3: Social Development",
    items: [
      {
        id: "3.1",
        title: "Showing Affection",
        milestone: "Demonstrates affection for caregivers and familiar people (Level 3 | Age 2–2.5 Years | Month 1)",
        targetAge: "2–2.5 Years",
        text: "Does the child show affection or positive interaction toward familiar caregivers or people?",
        activities: [
          "Family Hug Time – Encourage the child to greet a familiar person with a hug or wave.",
          "Caring for a Doll – Encourage the child to hug, feed, or tuck a doll into bed.",
          "Thank You Circle – Encourage the child to smile, wave, hug, or say 'thank you' after receiving help."
        ]
      },
      {
        id: "3.2",
        title: "Showing Empathy",
        milestone: "Begins showing empathy and comforts peers (Level 3 | Age 2–2.5 Years | Month 2)",
        targetAge: "2–2.5 Years",
        text: "When another person or child is upset, does the child attempt to comfort or help them?",
        activities: [
          "Comforting a Doll – Pretend that a doll is sad and encourage the child to comfort it.",
          "Helping a Friend – Give the child an opportunity to help another child.",
          "Feelings Story Time – Read a short story about a sad character and ask the child how they could help."
        ]
      },
      {
        id: "3.3",
        title: "Cooperative Play",
        milestone: "Begins cooperative play in small groups (Level 3 | Age 2–2.5 Years | Month 3)",
        targetAge: "2–2.5 Years",
        text: "Can the child participate in a shared activity with two or three other children?",
        activities: [
          "Build Together – Encourage two or three children to build a tower together.",
          "Ball Passing Circle – Ask children to pass a ball to one another.",
          "Group Art Activity – Give children one large sheet of paper and encourage them to create one picture together."
        ]
      },
      {
        id: "3.4",
        title: "Pretend and Role Play",
        milestone: "Enjoys pretend play and role play (Level 4 | Age 2.5–3 Years | Month 2)",
        targetAge: "2.5–3 Years",
        text: "Can the child participate in simple pretend play using familiar roles?",
        activities: [
          "Pretend Kitchen Play – Encourage the child to prepare and serve pretend food.",
          "Doctor Role Play – Give the child a toy doctor kit and encourage them to care for a doll.",
          "Shopkeeper Game – Let the child pretend to be a shopkeeper or customer."
        ]
      },
      {
        id: "3.5",
        title: "Sharing Toys",
        milestone: "Shares toys more consistently (Level 4 | Age 2.5–3 Years | Month 4)",
        targetAge: "2.5–3 Years",
        text: "Can the child share a toy with another child and wait for their turn?",
        activities: [
          "Toy Sharing Circle – Give children one toy at a time and encourage them to pass it to the next child.",
          "Turn-Taking Board Game – Encourage the child to wait for their turn before moving a piece.",
          "Shared Block Building – Give children blocks and encourage them to share materials while building."
        ]
      },
      {
        id: "3.6",
        title: "Initiating Play",
        milestone: "Takes initiative in play and shows empathy and understanding (Level 4 | Age 2.5–3 Years | Month 6)",
        targetAge: "2.5–3 Years",
        text: "Can the child initiate interaction by inviting another child to join a play activity?",
        activities: [
          "Invite a Friend to Play – Encourage the child to invite another child to play.",
          "Choose a Game – Give the child two play options and encourage them to invite a peer.",
          "Start a Ball Game – Encourage the child to begin a simple ball game with another child."
        ]
      },
      {
        id: "3.7",
        title: "Taking Turns",
        milestone: "Shows turn-taking in play (Level 4 | Age 2.5–3 Years)",
        targetAge: "2.5–3 Years",
        text: "Can the child wait for and take their turn during a shared game?",
        activities: [
          "Roll the Ball Back – Children take turns rolling a ball to each other.",
          "Pass a Toy – Ask children to pass one toy around the group.",
          "Take Turns Stacking – Children take turns adding blocks to a tower."
        ]
      },
      {
        id: "3.8",
        title: "Helping Others",
        milestone: "Helps others and demonstrates responsibility (Level 4 | Age 2.5–3 Years)",
        targetAge: "2.5–3 Years",
        text: "Can the child willingly help another child or adult with a simple task?",
        activities: [
          "Helping Hands – Ask the child to help a friend with materials.",
          "Clean-Up Helper – Encourage the child to help put toys away.",
          "Classroom Helper – Give the child a simple responsibility such as carrying materials."
        ]
      }
    ]
  },
  {
    id: "emotional",
    number: "4",
    title: "Domain 4: Emotional Development",
    items: [
      {
        id: "4.1",
        title: "Calming After Being Upset",
        milestone: "Calms down after brief upset (Level 3 | Age 2–2.5 Years | Month 1)",
        targetAge: "2–2.5 Years",
        text: "Can the child calm down after becoming briefly upset with support?",
        activities: [
          "Calm Corner Time – Provide a quiet space with soft toys or cushions.",
          "Deep Breathing with Teddy – Encourage the child to hold a teddy and take slow breaths.",
          "Gentle Music Break – Play soft music and encourage the child to sit quietly or cuddle a familiar toy."
        ]
      },
      {
        id: "4.2",
        title: "Seeking Comfort",
        milestone: "Seeks comfort objects when stressed (Level 3 | Age 2–2.5 Years | Month 2)",
        targetAge: "2–2.5 Years",
        text: "Does the child seek or accept a familiar comfort object when feeling stressed or upset?",
        activities: [
          "Comfort Toy Time – Offer the child's familiar blanket or stuffed toy.",
          "Story and Snuggle – Read a familiar story while the child holds the comfort object.",
          "Quiet Rest Corner – Provide a comfortable space where the child can use familiar comfort items."
        ]
      },
      {
        id: "4.3",
        title: "Using Calming Activities",
        milestone: "Engages in calming activities when upset (Level 3 | Age 2–2.5 Years | Month 3)",
        targetAge: "2–2.5 Years",
        text: "Can the child engage in a simple calming activity when upset?",
        activities: [
          "Bubble Breathing – Encourage the child to take slow breaths while blowing bubbles.",
          "Sensory Bottle Play – Allow the child to watch and gently shake a sensory bottle.",
          "Coloring for Calm – Provide crayons and paper for quiet coloring."
        ]
      },
      {
        id: "4.4",
        title: "Expressing Feelings With Words",
        milestone: "Uses words to express feelings (Level 4 | Age 2.5–3 Years | Month 2)",
        targetAge: "2.5–3 Years",
        text: "Can the child use simple words to tell how they are feeling?",
        activities: [
          "Emotion Cards – Show happy, sad, angry and scared faces and ask the child to name the feeling.",
          "Feelings Mirror Game – Make different facial expressions together and name the emotions.",
          "How Do You Feel Today? – Ask the child how they feel and encourage a simple verbal response."
        ]
      },
      {
        id: "4.5",
        title: "Self-Soothing",
        milestone: "Demonstrates self-soothing skills (Level 4 | Age 2.5–3 Years | Month 5)",
        targetAge: "2.5–3 Years",
        text: "Can the child use a calming strategy to help themselves settle when upset?",
        activities: [
          "Calm Down Basket – Allow the child to choose a soft toy, book, or sensory item.",
          "Slow Counting Activity – Encourage the child to count slowly from one to five while breathing slowly.",
          "Stretch and Relax – Guide the child through simple stretching and slow breathing."
        ]
      },
      {
        id: "4.6",
        title: "Responding to Changes",
        milestone: "Responds calmly to changes (Level 4 | Age 2.5–3 Years | Month 6)",
        targetAge: "2.5–3 Years",
        text: "Can the child remain reasonably calm when a familiar routine or activity changes?",
        activities: [
          "Visual Schedule Activity – Show the child a picture schedule and explain a small change.",
          "Role-Playing Changes – Use dolls or toys to act out a change in routine.",
          "Change the Activity – Give advance notice before changing from one familiar activity to another."
        ]
      },
      {
        id: "4.7",
        title: "Recognizing Others' Emotions",
        milestone: "Recognizes emotions in others (Level 4 | Age 2.5–3 Years)",
        targetAge: "2.5–3 Years",
        text: "Can the child identify how another person is feeling from their face, voice, or situation?",
        activities: [
          "Emotion Matching Game – Show different facial expressions and ask the child to identify the feeling.",
          "Emotion Charades – Act out a feeling and ask the child to guess it.",
          "Feelings Story – Read a short story and ask how the character feels."
        ]
      },
      {
        id: "4.8",
        title: "Comforting an Upset Peer",
        milestone: "Comforts others and shows empathy (Level 4 | Age 2.5–3 Years)",
        targetAge: "2.5–3 Years",
        text: "When another child is upset, can the child respond with comfort or help?",
        activities: [
          "Helping a Friend – Encourage the child to offer help when a peer is upset.",
          "Comfort a Doll – Pretend that a doll is crying and ask the child what they can do.",
          "Kind Words Activity – Encourage the child to use simple comforting words."
        ]
      }
    ]
  },
  {
    id: "aesthetic",
    number: "5",
    title: "Domain 5: Aesthetic Development",
    items: [
      {
        id: "5.1",
        title: "Creating Simple Crafts",
        milestone: "Creates simple crafts (Level 4 | Age 2.5–3 Years)",
        targetAge: "2.5–3 Years",
        text: "Can the child create a simple craft using basic art materials?",
        activities: [
          "Glue Shapes – Give paper shapes and allow the child to glue them onto paper.",
          "Make a Face – Provide simple paper shapes and encourage the child to create a face.",
          "Texture Art – Let the child create a picture using safe materials such as fabric or paper."
        ]
      },
      {
        id: "5.2",
        title: "Identifying Simple Melodies",
        milestone: "Identifies simple melodies (Level 4 | Age 2.5–3 Years)",
        targetAge: "2.5–3 Years",
        text: "Can the child recognize or respond to a familiar simple melody?",
        activities: [
          "Happy Birthday Tune – Sing a familiar tune and ask the child if they recognize it.",
          "Up/Down Pitch Game – Sing sounds at different pitches and encourage the child to identify the change.",
          "Hum a Song – Hum a familiar song and ask the child to identify or continue it."
        ]
      },
      {
        id: "5.3",
        title: "Imaginative Play",
        milestone: "Uses imagination in play (Level 4 | Age 2.5–3 Years)",
        targetAge: "2.5–3 Years",
        text: "Can the child use objects or pretend situations to create imaginative play?",
        activities: [
          "Tea Party – Encourage the child to pretend to serve tea to dolls.",
          "Dress-Up Box – Provide simple dress-up materials for pretend play.",
          "Pretend Picnic – Encourage the child to pretend to prepare and share food during a picnic."
        ]
      },
      {
        id: "5.4",
        title: "Sorting by Colour and Shape",
        milestone: "Sorts by colour/shape (Level 4 | Age 2.5–3 Years)",
        targetAge: "2.5–3 Years",
        text: "Can the child sort objects according to colour or shape?",
        activities: [
          "Red Toys in the Red Bin – Ask the child to put red objects into the red container.",
          "Shape Puzzles – Ask the child to group or match objects according to shape.",
          "Colour Match Cards – Give coloured cards and objects and ask the child to match them."
        ]
      },
      {
        id: "5.5",
        title: "Creating Simple Sounds",
        milestone: "Creates simple sounds (Level 4 | Age 2.5–3 Years)",
        targetAge: "2.5–3 Years",
        text: "Can the child intentionally create different sounds using simple objects or instruments?",
        activities: [
          "Tap a Drum – Give the child a small drum and encourage them to create sounds.",
          "Shaker Toys – Encourage the child to shake an instrument and listen to the sound.",
          "Rice-Filled Maracas – Let the child shake a safe homemade instrument and explore different sounds."
        ]
      },
      {
        id: "5.6",
        title: "Exploring Symmetry",
        milestone: "Explores symmetry (Level 4 | Age 2.5–3 Years)",
        targetAge: "2.5–3 Years",
        text: "Can the child notice or create a simple symmetrical design?",
        activities: [
          "Folded Paper Art – Fold paper and create a simple symmetrical design.",
          "Mirror Painting – Make marks on one side of paper and fold it to create a mirrored pattern.",
          "Match the Halves Puzzle – Ask the child to match two halves of a simple picture."
        ]
      },
      {
        id: "5.7",
        title: "Creating Simple Patterns",
        milestone: "Creates simple ABAB patterns (Level 4 | Age 2.5–3 Years)",
        targetAge: "2.5–3 Years",
        text: "Can the child create or continue a simple repeating pattern?",
        activities: [
          "Colour Blocks – Ask the child to make a red-blue-red-blue pattern.",
          "Nature Pattern – Use leaves and flowers to create a simple repeating pattern.",
          "Shape Sequence – Give two different shapes and ask the child to repeat the pattern."
        ]
      },
      {
        id: "5.8",
        title: "Showing Preference for Colour",
        milestone: "Shows preference for a colour (Level 4 | Age 2.5–3 Years)",
        targetAge: "2.5–3 Years",
        text: "Can the child identify and express a preference for a familiar colour?",
        activities: [
          "Favourite Crayon – Offer several crayons and ask the child which colour they like.",
          "Favourite Shirt – Show clothing in different colours and ask which one the child prefers.",
          "Favourite Colour Sorting – Give objects of different colours and ask the child to choose their preferred colour."
        ]
      }
    ]
  }
];

export const SECTIONS_3_4_YEARS = [
  {
    id: "physical",
    number: "1",
    title: "Domain 1: Physical Development",
    items: [
      {
        id: "1.1",
        title: "Walking with Confidence",
        milestone: "Walks forward and backward with confidence (Level 7, Age 3-3.5)",
        targetAge: "3–3.5 Years",
        text: "Does the child demonstrate the ability to walk forward and backward with balance and confidence?",
        activities: [
          "Forward Walk on a Line – Place a straight line of tape or chalk on the floor. Encourage walking forward along the line with balance.",
          "Backward Step Challenge – Stand behind the child and gently guide 3-4 steps backward while looking over shoulder.",
          "Obstacle Walk – Create a simple path with cushions/cones and ask the child to walk forward and backward navigating obstacles."
        ]
      },
      {
        id: "1.2",
        title: "Kicking with Direction",
        milestone: "Kicks a stationary ball with direction (Level 7, Age 3-3.5)",
        targetAge: "3–3.5 Years",
        text: "Does the child demonstrate the ability to kick a ball with accuracy and direction?",
        activities: [
          "Target Kick Practice – Place a soft ball on the ground and encourage kicking towards a target 3-4 feet away.",
          "Kick to a Partner – Stand 3-4 feet away and encourage kicking the ball back and forth with direction.",
          "Obstacle Kicking – Set up simple obstacles and encourage kicking the ball around or between them."
        ]
      },
      {
        id: "1.3",
        title: "Catching Skills",
        milestone: "Catches a rolled ball with both hands (Level 7, Age 3-3.5)",
        targetAge: "3–3.5 Years",
        text: "Does the child demonstrate the ability to catch a ball rolled towards them?",
        activities: [
          "Roll and Catch – Roll a soft ball towards the child from 3-4 feet away and encourage catching with both hands.",
          "Ball Tracking Practice – Roll the ball slowly from different directions and observe visual tracking and positioning.",
          "Catch from Different Distances – Gradually increase rolling distance and observe catching adaptability."
        ]
      },
      {
        id: "1.4",
        title: "Manipulating Playdough",
        milestone: "Manipulates playdough with rolling and cutting (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate fine motor control by rolling, cutting, and shaping playdough?",
        activities: [
          "Rolling Playdough Snakes – Model rolling playdough into long snake shapes using both hands.",
          "Cutting Playdough – Provide child-safe cutters and encourage cutting playdough into small pieces.",
          "Playdough Shape Making – Demonstrate making simple balls, circles, and discs."
        ]
      },
      {
        id: "1.5",
        title: "Using a Hammer Toy",
        milestone: "Uses a hammer toy with control (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate control and coordination when using a hammer toy?",
        activities: [
          "Peg Hammering – Provide a peg hammer toy and encourage tapping pegs one by one with controlled force.",
          "Hammering to a Target – Place target drawings on a soft surface and encourage tapping accurately.",
          "Rhythmic Hammering – Establish a simple tap-tap-pause rhythm and encourage copying the pattern."
        ]
      },
      {
        id: "1.6",
        title: "Hopping on One Foot",
        milestone: "Hops on one foot (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate the ability to hop on one foot with balance?",
        activities: [
          "One-Foot Hop Challenge – Demonstrate hopping on one foot for 2-3 hops and encourage trying with balance.",
          "Hop to the Target – Place a target short distance away and encourage hopping on one foot towards it.",
          "Copy the Animal – Pretend to be hopping animals like a kangaroo or frog."
        ]
      },
      {
        id: "1.7",
        title: "Walking Up and Down Steps",
        milestone: "Walks up and down steps alternating feet (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate the ability to walk up and down steps using alternating feet?",
        activities: [
          "Stair Climbing Practice – Practice walking up stairs placing one foot on each step without pausing.",
          "Coming Down Safely – Practice walking down steps alternating feet with supervision and handrail support.",
          "Step Counting Game – Count steps aloud while climbing to combine motor and counting rhythm."
        ]
      },
      {
        id: "1.8",
        title: "Following Safety Rules During Physical Activities",
        milestone: "Follows simple safety rules (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate understanding and compliance with basic safety rules during physical activities?",
        activities: [
          "Safety Rule Discussion – Discuss simple safety rules ('We walk inside, run outside') and observe compliance.",
          "Role-Play Safety Scenarios – Create scenarios ('Wet floor – what do we do?') and encourage safe choices.",
          "Safe Movement Practice – Gently remind safe walking while carrying toys and observe self-correction."
        ]
      }
    ]
  },
  {
    id: "cognitive",
    number: "2",
    title: "Domain 2: Cognitive Development",
    items: [
      {
        id: "2.1",
        title: "Drawing Simple Shapes",
        milestone: "Draws simple shapes (circle, square) (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate the ability to draw or trace simple shapes?",
        activities: [
          "Circle Drawing Practice – Demonstrate drawing a continuous circle and encourage independent practice.",
          "Square Tracing – Provide dotted lines for a square and encourage tracing corners.",
          "Shape Drawing from Memory – Show circle and square, hide them, and ask the child to draw from memory."
        ]
      },
      {
        id: "2.2",
        title: "Completing Picture Puzzles",
        milestone: "Completes 4-6 piece puzzles (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate the ability to complete simple puzzles with increasing independence?",
        activities: [
          "4-Piece Puzzle Challenge – Provide a 4-piece picture puzzle and encourage independent completion.",
          "Puzzle with Picture Guide – Provide a reference picture underneath to assist matching.",
          "Collaborative Puzzle Time – Work together on a 6-piece puzzle, discussing where pieces belong."
        ]
      },
      {
        id: "2.3",
        title: "Sorting by Multiple Attributes",
        milestone: "Sorts objects by 2 attributes (color and size) (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate the ability to sort objects by more than one attribute?",
        activities: [
          "Color and Size Sorting – Provide blocks of different colors and sizes and ask to sort into 'big red' groups.",
          "Multi-Attribute Classification – Create 4 categories (big red, small red, big blue, small blue) for sorting.",
          "Sorting Game with Examples – Start sorting by color, then add size as a second attribute."
        ]
      },
      {
        id: "2.4",
        title: "Following Multi-Step Instructions",
        milestone: "Follows 3-step directions (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate the ability to follow multi-step instructions?",
        activities: [
          "Three-Step Action Game – Give instructions: 'Clap hands, turn around, touch nose' in sequence.",
          "Sequential Task Completion – Ask: 'Pick up block, put in box, close lid' and observe execution.",
          "Following Recipe Steps – Use simple craft steps: 'Take paper, fold in half, draw circle.'"
        ]
      },
      {
        id: "2.5",
        title: "Number Recognition and Counting",
        milestone: "Recognizes numerals 1-5 (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate understanding of numbers by recognizing numerals and counting objects?",
        activities: [
          "Number Recognition Cards – Show numeral cards 1-5 in random order and ask to identify.",
          "Counting Objects – Provide 5 small objects and encourage counting with one-to-one correspondence.",
          "Number Matching Game – Match sets of 1-5 objects to their corresponding numeral cards."
        ]
      },
      {
        id: "2.6",
        title: "Cause and Effect Understanding",
        milestone: "Understands simple cause and effect (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate understanding of cause-and-effect relationships?",
        activities: [
          "Cause and Effect Play – Provide pop-up or action toys and observe intentional repetition.",
          "Predicting Outcomes – Ask: 'What happens when we push the car down this ramp?'",
          "Story Predictions – Pause during story time and ask: 'What do you think happens next?'"
        ]
      },
      {
        id: "2.7",
        title: "Recognizing and Completing Patterns",
        milestone: "Recognizes and extends ABAB patterns (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate the ability to recognize and extend simple patterns?",
        activities: [
          "Pattern Copying – Create a red-blue-red-blue (ABAB) block pattern and ask the child to copy.",
          "Pattern Extension – Start a pattern (blue-yellow-blue-yellow) and ask what comes next.",
          "Pattern Creation – Provide objects of two colors and encourage creating an original pattern."
        ]
      },
      {
        id: "2.8",
        title: "Understanding Time Concepts",
        milestone: "Understands concepts of today/tomorrow/yesterday (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate emerging understanding of time concepts?",
        activities: [
          "Daily Routine Discussion – Talk about what we do 'today' and reference specific events from 'yesterday.'",
          "Planning for Tomorrow – Discuss exciting planned activities for 'tomorrow.'",
          "Time Concept Games – Differentiate past, present, and future events in daily stories."
        ]
      }
    ]
  },
  {
    id: "social",
    number: "3",
    title: "Domain 3: Social-Emotional Development",
    items: [
      {
        id: "3.1",
        title: "Cooperative Play",
        milestone: "Engages in cooperative play (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate the ability to play cooperatively with other children?",
        activities: [
          "Group Building Activity – Provide blocks and encourage building a structure together with peers.",
          "Cooperative Game Play – Play a board game or team game requiring shared goals and turn-taking.",
          "Role-Play Collaboration – Encourage collaborative pretend play (house, shop, restaurant)."
        ]
      },
      {
        id: "3.2",
        title: "Taking Turns",
        milestone: "Takes turns in games (Level 7, Age 3-3.5)",
        targetAge: "3–3.5 Years",
        text: "Does the child demonstrate the ability to wait for and take turns during activities?",
        activities: [
          "Turn-Taking with Toys – Encourage sharing a favorite toy: 'Now your turn, next her turn.'",
          "Board Game Participation – Play a simple game requiring turn order and patient waiting.",
          "Turn-Taking Signal – Use a visual 'my turn/your turn' card to guide turn taking."
        ]
      },
      {
        id: "3.3",
        title: "Sharing with Peers",
        milestone: "Shares toys with peers (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate willingness to share toys and materials with others?",
        activities: [
          "Shared Materials Activity – Provide limited art supplies and observe spontaneous sharing.",
          "Sharing Encouragement – Verbally praise sharing behaviors when they occur naturally.",
          "Social Story About Sharing – Read books on sharing and discuss how characters feel."
        ]
      },
      {
        id: "3.4",
        title: "Managing Separation",
        milestone: "Manages separation from caregiver (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate the ability to separate from caregivers with minimal distress?",
        activities: [
          "Gradual Separation Practice – Practice brief separations ('I'll be right outside') and increase time.",
          "Drop-off Routine – Observe calm goodbye rituals during arrival at school/center.",
          "Reunion Activities – Encourage sharing accomplishments with caregiver upon return."
        ]
      },
      {
        id: "3.5",
        title: "Resolving Conflicts with Words",
        milestone: "Resolves conflicts with words (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate the ability to use words to resolve disagreements?",
        activities: [
          "Conflict Resolution Practice – Guide children to express feelings verbally during disagreements.",
          "Role-Play Scenarios – Practice puppet situations where two characters talk out a conflict.",
          "Problem-Solving Discussion – Discuss appropriate verbal strategies when someone takes a toy."
        ]
      },
      {
        id: "3.6",
        title: "Expressing Needs and Wants",
        milestone: "Expresses needs verbally (Level 7, Age 3-3.5)",
        targetAge: "3–3.5 Years",
        text: "Does the child demonstrate the ability to express needs and wants using words?",
        activities: [
          "Need Expression Practice – Create opportunities where the child asks verbally for help or items.",
          "Want Communication – Offer choices and encourage verbalizing preferences ('apples or bananas?').",
          "Emotion Expression – Encourage naming feelings aloud during daily interactions."
        ]
      },
      {
        id: "3.7",
        title: "Showing Pride in Achievements",
        milestone: "Shows pride in achievements (Level 7, Age 3-3.5)",
        targetAge: "3–3.5 Years",
        text: "Does the child demonstrate pride and satisfaction in their accomplishments?",
        activities: [
          "Celebrating Accomplishments – Observe smile or 'I did it!' expression after completing a task.",
          "Sharing Success – Encourage showing completed work or creations to peers and teachers.",
          "Positive Reinforcement Response – Observe positive emotional response when receiving praise."
        ]
      },
      {
        id: "3.8",
        title: "Participating in Group Activities",
        milestone: "Actively participates in group activities (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate active participation in group activities and routines?",
        activities: [
          "Circle Time Participation – Observe engagement during singing, storytelling, and group chats.",
          "Group Activity Engagement – Observe enthusiastic participation in group games and physical play.",
          "Routine Following – Observe smooth compliance during group cleanup and transition routines."
        ]
      }
    ]
  },
  {
    id: "language",
    number: "4",
    title: "Domain 4: Language & Communication",
    items: [
      {
        id: "4.1",
        title: "Using Complete Sentences",
        milestone: "Uses complete 4-5 word sentences (Level 7, Age 3-3.5)",
        targetAge: "3–3.5 Years",
        text: "Does the child demonstrate the ability to use complete sentences to communicate?",
        activities: [
          "Sentence Completion Practice – Start prompts like 'I want...' and encourage 4-5 word sentences.",
          "Story Retelling – Ask the child to describe a park visit using full sentences.",
          "Daily Communication – Observe natural usage of multi-word sentences during everyday chats."
        ]
      },
      {
        id: "4.2",
        title: "Asking Questions",
        milestone: "Asks 'what' and 'why' questions (Level 7, Age 3-3.5)",
        targetAge: "3–3.5 Years",
        text: "Does the child demonstrate the ability to ask questions to gather information?",
        activities: [
          "Curiosity Encouragement – Encourage questions during book reading ('What do you wonder?').",
          "Question of the Day – Model asking 'Why does this happen?' and invite child's questions.",
          "Exploration Activities – Observe spontaneous 'what' and 'why' questions during sensory play."
        ]
      },
      {
        id: "4.3",
        title: "Describing Events",
        milestone: "Describes recent events in sequence (Level 7, Age 3-3.5)",
        targetAge: "3–3.5 Years",
        text: "Does the child demonstrate the ability to describe events in the correct sequence?",
        activities: [
          "Event Description Activity – Ask 'What did we do first? Next? Last?' after an outing.",
          "Sequence Cards – Arrange 3 picture cards showing a routine and describe in order.",
          "Daily Routine Discussion – Discuss daily steps in sequence ('Wake up, eat, go to school')."
        ]
      },
      {
        id: "4.4",
        title: "Following Multi-Step Directions",
        milestone: "Follows 2-3 step directions (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate the ability to follow multi-step verbal directions?",
        activities: [
          "Direction Following Game – Give 2-3 step tasks ('Stand up, touch wall, sit down').",
          "Treasure Hunt – Guide with instructions ('Go to table, get red block, bring here').",
          "Task Completion – Observe routine instructions like 'Take off shoes, put in box, wash hands.'"
        ]
      },
      {
        id: "4.5",
        title: "Vocabulary Expansion",
        milestone: "Uses 500+ words (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate an expanding vocabulary across different categories?",
        activities: [
          "Vocabulary Basket – Place varied objects in a basket and encourage naming and describing.",
          "Category Sorting – Name and sort objects into animals, food, vehicles, and clothes.",
          "Word Collection Game – Introduce a new word daily and practice using it in context."
        ]
      },
      {
        id: "4.6",
        title: "Story Comprehension",
        milestone: "Answers simple questions about a story (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate comprehension of simple stories by answering questions?",
        activities: [
          "Story Reading with Questions – Ask comprehension questions like 'What color was the dog?'.",
          "Picture Discussion – Use book illustrations to discuss what characters are doing.",
          "Story Retelling – Encourage retelling the main events of a story in their own words."
        ]
      },
      {
        id: "4.7",
        title: "Using Descriptive Language",
        milestone: "Uses descriptive language (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate the ability to use descriptive words in communication?",
        activities: [
          "Object Description Game – Ask the child to describe color, size, and texture of a toy.",
          "Sensory Exploration – Encourage describing touch, smell, and sound experiences.",
          "Descriptive Storytelling – Encourage adding descriptive details to story characters."
        ]
      },
      {
        id: "4.8",
        title: "Listening Comprehension",
        milestone: "Listens attentively to stories (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate the ability to listen attentively during story time?",
        activities: [
          "Story Attention Observation – Observe focused listening during 5-10 minute reading sessions.",
          "Listen and Follow – Ask specific recall questions after story reading to check focus.",
          "Predictive Listening – Pause during reading to ask 'What do you think happens next?'."
        ]
      }
    ]
  },
  {
    id: "adaptive",
    number: "5",
    title: "Domain 5: Adaptive (Self-Help) Skills",
    items: [
      {
        id: "5.1",
        title: "Independent Dressing",
        milestone: "Dresses with minimal assistance (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate the ability to put on clothes with minimal help?",
        activities: [
          "Dressing Practice – Practice putting on t-shirts identifying front/back and sleeves.",
          "Pants Practice – Practice pulling up pants independently after toileting.",
          "Shoe Practice – Practice putting shoes on the correct feet with minimal assistance."
        ]
      },
      {
        id: "5.2",
        title: "Independent Toileting",
        milestone: "Uses toilet independently (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate the ability to manage toileting needs with minimal assistance?",
        activities: [
          "Toileting Routine – Communicate toileting needs and use bathroom independently.",
          "Clothing Management – Pull pants up and down without adult help.",
          "Hygiene Practice – Wash and dry hands thoroughly after using the toilet."
        ]
      },
      {
        id: "5.3",
        title: "Personal Hygiene Awareness",
        milestone: "Shows awareness of personal hygiene needs (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate basic understanding of personal hygiene practices?",
        activities: [
          "Handwashing Practice – Wash hands with soap and water independently for proper duration.",
          "Cough/Sneeze Etiquette – Cover mouth with elbow or tissue when coughing/sneezing.",
          "Cleanliness Awareness – Practice wiping mouth/hands after meals."
        ]
      },
      {
        id: "5.4",
        title: "Feeding Independence",
        milestone: "Eats with utensils independently (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate the ability to eat independently using utensils?",
        activities: [
          "Mealtime Observation – Use spoon and fork correctly with minimal food dropping.",
          "Snack Preparation – Practice self-serving snacks using serving spoons.",
          "Mealtime Routines – Complete meals independently within reasonable time."
        ]
      },
      {
        id: "5.5",
        title: "Personal Belongings Care",
        milestone: "Takes care of personal belongings (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate responsibility for personal belongings?",
        activities: [
          "Bag Organization – Pack and unpack personal backpack items independently.",
          "Toy Care Routine – Put toys away into designated bins after playing.",
          "Belongings Discussion – Understand responsibility for keeping track of shoes and coat."
        ]
      },
      {
        id: "5.6",
        title: "Simple Household Participation",
        milestone: "Participates in simple household tasks (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate willingness to participate in simple daily routines?",
        activities: [
          "Clean-Up Participation – Help wipe tables or put away activity mats.",
          "Table Setting – Place napkins or cups on the table for snack time.",
          "Routine Participation – Follow simple helper jobs in the classroom or home."
        ]
      },
      {
        id: "5.7",
        title: "Self-Advocacy Skills",
        milestone: "Expresses needs independently (Level 7, Age 3-3.5)",
        targetAge: "3–3.5 Years",
        text: "Does the child demonstrate the ability to express personal needs independently?",
        activities: [
          "Need Expression Practice – Verbalize requests for water, bathroom, or assistance.",
          "Choice Making – Express personal preferences clearly when offered options.",
          "Independent Requests – Seek help spontaneously when encountering difficulties."
        ]
      },
      {
        id: "5.8",
        title: "Table Manners Awareness",
        milestone: "Shows understanding of basic table manners (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate emerging understanding of table manners?",
        activities: [
          "Mealtime Manners Discussion – Practice saying 'please' and 'thank you' during snack time.",
          "Practice Thank You – Show politeness when receiving food or assistance.",
          "Eating Etiquette Observation – Sit calmly while eating and chew with mouth closed."
        ]
      }
    ]
  },
  {
    id: "sensory",
    number: "6",
    title: "Domain 6: Sensory & Aesthetic Development",
    items: [
      {
        id: "6.1",
        title: "Exploring Textures",
        milestone: "Explores and describes textures (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate curiosity and ability to explore different textures?",
        activities: [
          "Texture Basket Exploration – Feel sandpaper, cotton, stones, and fabric, describing feelings.",
          "Texture Description Activity – Use words like 'soft', 'rough', 'smooth', and 'bumpy'.",
          "Texture Sorting Game – Categorize materials into soft vs rough bins."
        ]
      },
      {
        id: "6.2",
        title: "Responding to Music",
        milestone: "Responds to music through movement (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate engagement with music through movement and expression?",
        activities: [
          "Music and Movement – Move, sway, and dance in rhythm to different musical tempos.",
          "Instrument Exploration – Play shakers, drums, and bells in simple rhythms.",
          "Music Mood Discussion – Discuss if music feels happy, energetic, or calm."
        ]
      },
      {
        id: "6.3",
        title: "Exploring Color Mixing",
        milestone: "Explores color mixing (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate curiosity about mixing colors and creating new ones?",
        activities: [
          "Color Mixing Experiment – Mix red and yellow paint to discover orange.",
          "Color Discovery – Observe and name new secondary colors created during play.",
          "Color Exploration Discussion – Describe what happens when primary colors mix."
        ]
      },
      {
        id: "6.4",
        title: "Identifying Emotions in Self",
        milestone: "Identifies emotions in self (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate the ability to identify and name their own emotions?",
        activities: [
          "Emotion Mirror Activity – Make happy/sad/surprised faces in a mirror and identify them.",
          "Emotion Vocabulary Practice – Practice emotion words during daily check-ins.",
          "Daily Check-In – Verbally answer 'How are you feeling today?' with feeling names."
        ]
      },
      {
        id: "6.5",
        title: "Using Calming Strategies",
        milestone: "Uses simple calming strategies when upset (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate the ability to use calming strategies with support?",
        activities: [
          "Deep Breathing Practice – Model deep breathing ('Breathe in, breathe out') together.",
          "Calm Corner – Use a cozy quiet space with soft cushions when feeling overwhelmed.",
          "Calming Strategy Discussion – Identify personal comfort actions that help calm down."
        ]
      },
      {
        id: "6.6",
        title: "Expressing Emotions Verbally",
        milestone: "Expresses emotions verbally (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate the ability to express emotions using words?",
        activities: [
          "Emotion Expression Practice – Verbalize feelings directly ('I am frustrated') instead of acting out.",
          "Feeling Chart Use – Point to feeling icons and explain why that emotion is felt.",
          "Story Feelings Discussion – Discuss how book characters express emotions verbally."
        ]
      },
      {
        id: "6.7",
        title: "Recognizing Emotions in Others",
        milestone: "Recognizes emotions in others (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate the ability to recognize emotions in others?",
        activities: [
          "Emotion Cards Activity – Identify happy, sad, or angry expressions on picture cards.",
          "Observing Others – Notice when a classmate is sad and discuss how they feel.",
          "Story Character Feelings – Identify emotional states of storybook characters."
        ]
      },
      {
        id: "6.8",
        title: "Appreciating Creative Works",
        milestone: "Shows appreciation for creative works (Level 8, Age 3.5-4)",
        targetAge: "3.5–4 Years",
        text: "Does the child demonstrate the ability to express appreciation for art and creative works?",
        activities: [
          "Art Appreciation Activity – Express opinions on artwork ('I like the bright colors').",
          "Music Appreciation – Discuss how listening to a song makes them feel.",
          "Creative Expression – Show pride when sharing original drawings and crafts."
        ]
      }
    ]
  }
];


export const SECTIONS_4_5_YEARS = [
  {
    id: "physical",
    number: "1",
    title: "Domain 1: Physical Development",
    items: [
      {
        id: "1.1",
        title: "Hopping on One Foot",
        milestone: "Hops on one foot 5+ times",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to hop on one foot multiple times while maintaining balance?",
        activities: [
          "Hopscotch Challenge – Create a simple hopscotch path and encourage hopping on one foot through numbered spaces.",
          "One-Foot Animal Hop Game – Pretend to be a hopping bird or rabbit while balancing on one foot.",
          "Hoop-to-Hoop Hopping – Place hoops on the ground and invite the child to hop from hoop to hoop."
        ]
      },
      {
        id: "1.2",
        title: "Skipping with Alternating Feet",
        milestone: "Skips with alternating feet",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to skip using alternating feet with coordination and rhythm?",
        activities: [
          "Skip and Follow Path – Skip along a cone pathway using alternating feet with rhythm.",
          "Music Skipping Parade – Skip around the room following the beat of music.",
          "Partner Skip Race – Skip side by side with a partner to a finish line."
        ]
      },
      {
        id: "1.3",
        title: "Climbing Ladder",
        milestone: "Climbs ladder independently",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to climb a ladder safely and independently?",
        activities: [
          "Playground Ladder Practice – Climb a safe playground ladder independently.",
          "Indoor Climbing Course – Navigate a simple foam or rungs climbing structure.",
          "Reach the Treasure Game – Climb independently to retrieve a toy placed on a platform."
        ]
      },
      {
        id: "1.4",
        title: "Throwing with Aim and Force",
        milestone: "Throws ball with aim and force",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to throw a ball with accuracy and appropriate force?",
        activities: [
          "Target Throw Game – Throw a ball into buckets placed at varying distances.",
          "Knock the Pins Activity – Throw a ball to knock down plastic bottle pins.",
          "Partner Ball Throw – Throw a ball back and forth aiming towards partner's hands."
        ]
      },
      {
        id: "1.5",
        title: "Balancing on One Foot",
        milestone: "Balances on one foot for 5-8 seconds",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to maintain balance on one foot for several seconds?",
        activities: [
          "Flamingo Balance Game – Stand like a flamingo on one foot counting 5-8 seconds.",
          "Balance and Reach – Stand on one foot while reaching for objects at different heights.",
          "Freeze Balance Challenge – Freeze and balance on one foot when music stops."
        ]
      },
      {
        id: "1.6",
        title: "Riding Tricycle",
        milestone: "Rides tricycle with speed and control",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to ride a tricycle with control and coordination?",
        activities: [
          "Cone Riding Path – Ride around cones maintaining speed and steering control.",
          "Traffic Signal Ride – Respond appropriately to red/green stop-and-go cards.",
          "Tricycle Obstacle Course – Navigate turns and checkpoints on a trike course."
        ]
      },
      {
        id: "1.7",
        title: "Catching with Hands",
        milestone: "Catches a bounced ball with hands",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to catch a ball after it bounces?",
        activities: [
          "Bounce and Catch – Bounce a ball gently and catch with both hands.",
          "Partner Bounce Pass – Catch a ball bounced by a partner.",
          "Target Bounce Challenge – Track and catch balls bounced to different spots."
        ]
      },
      {
        id: "1.8",
        title: "Walking on a Balance Beam",
        milestone: "Walks on a balance beam with control",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to walk on a balance beam or line with balance and control?",
        activities: [
          "Floor Line Walk – Walk along a narrow floor line without stepping off.",
          "Balance Beam Practice – Walk along a low balance beam using arms for balance.",
          "Obstacle Balance Walk – Walk a curved balance beam path maintaining body control."
        ]
      }
    ]
  },
  {
    id: "cognitive",
    number: "2",
    title: "Domain 2: Cognitive Development",
    items: [
      {
        id: "2.1",
        title: "Counting to 20",
        milestone: "Counts to 20 correctly",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to count from 1 to 20 in the correct sequence?",
        activities: [
          "Number Counting Circle – Count aloud from 1 to 20 together in a circle.",
          "Count and Collect Game – Collect and count exactly 20 items into a container.",
          "Number Hunt Activity – Find hidden 1-20 number cards around the room in sequence."
        ]
      },
      {
        id: "2.2",
        title: "Sorting by Multiple Attributes",
        milestone: "Sorts by multiple attributes (color, size, shape)",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to sort objects using more than one characteristic?",
        activities: [
          "Sorting Tray Challenge – Group items simultaneously by color, size, and shape.",
          "Button Sorting Activity – Create sub-groups of buttons using multiple features.",
          "Mystery Sorting Game – Deduce sorting criteria using two attributes simultaneously."
        ]
      },
      {
        id: "2.3",
        title: "Completing Puzzles",
        milestone: "Completes 12-15 piece puzzles",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to complete puzzles of increasing complexity?",
        activities: [
          "Puzzle Time Challenge – Complete a 12-15 piece puzzle independently.",
          "Picture Matching Puzzle – Identify corner/edge pieces and picture match sections.",
          "Partner Puzzle Activity – Work collaboratively with a peer to complete a 15-piece puzzle."
        ]
      },
      {
        id: "2.4",
        title: "Understanding Sequencing",
        milestone: "Understands 'first, next, last' sequencing",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate understanding of sequential order using first, next, and last?",
        activities: [
          "Story Sequence Cards – Arrange picture cards in correct sequential order.",
          "Daily Routine Ordering – Sequence pictures of daily routine steps accurately.",
          "Cooking Steps Activity – Discuss a simple recipe identifying first, next, and last steps."
        ]
      },
      {
        id: "2.5",
        title: "Understanding More/Less/Equal",
        milestone: "Understands more/less/equal",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate understanding of comparative quantities?",
        activities: [
          "Comparing Objects Game – Compare two sets of items and identify which has more, less, or equal.",
          "Snack Comparison Activity – Compare snack portions using comparative vocabulary.",
          "Build and Compare Towers – Build block towers and compare amounts and heights."
        ]
      },
      {
        id: "2.6",
        title: "Counting and Matching to Numerals",
        milestone: "Counts objects to 15 and matches to numerals",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to count objects and match them to the correct numeral?",
        activities: [
          "Count and Match Cards – Count sets of up to 15 items and match to numeral cards.",
          "Number Basket Activity – Place matching counts of items into labeled numeral baskets.",
          "Peg and Number Match – Attach correct count of clothespins to numeral cards."
        ]
      },
      {
        id: "2.7",
        title: "Recognizing Patterns",
        milestone: "Recognizes and extends patterns",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to recognize and continue simple patterns?",
        activities: [
          "Pattern Copying – Replicate complex visual patterns accurately.",
          "Pattern Extension – Predict and extend repeating color/shape sequences.",
          "Pattern Creation – Invent original multi-element patterns."
        ]
      },
      {
        id: "2.8",
        title: "Understanding Time Concepts",
        milestone: "Understands today/tomorrow/yesterday concepts",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate emerging understanding of time concepts?",
        activities: [
          "Daily Routine Discussion – Connect activities accurately to 'today' and 'yesterday'.",
          "Planning for Tomorrow – Discuss upcoming events scheduled for 'tomorrow'.",
          "Time Concept Games – Classify past, present, and future events."
        ]
      }
    ]
  },
  {
    id: "social",
    number: "3",
    title: "Domain 3: Socio-Emotional Development",
    items: [
      {
        id: "3.1",
        title: "Initiating Play with Peers",
        milestone: "Initiates play with peers",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to initiate play with other children?",
        activities: [
          "Build Together Activity – Invite a peer to build a block structure collaboratively.",
          "Pretend Play Invitation – Set up a play scenario and invite another child to join.",
          "Playground Partner Game – Choose a partner and initiate participating in a game together."
        ]
      },
      {
        id: "3.2",
        title: "Taking Turns Without Reminders",
        milestone: "Takes turns without reminders in most situations",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to take turns without needing reminders?",
        activities: [
          "Board Game Turn Taking – Play board games taking turns independently.",
          "Pass the Ball Activity – Pass a ball waiting patiently for turns without prompting.",
          "Sharing Art Materials – Share limited art supplies naturally."
        ]
      },
      {
        id: "3.3",
        title: "Understanding Others' Feelings",
        milestone: "Begins to understand others' feelings",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate emerging empathy and understanding of others' emotions?",
        activities: [
          "Emotion Picture Discussion – Identify how people in photographs might be feeling.",
          "Storybook Feelings Talk – Discuss character emotions and perspectives during story reading.",
          "Feelings Role Play – Act out social situations identifying emotional responses."
        ]
      },
      {
        id: "3.4",
        title: "Showing Pride in Completed Work",
        milestone: "Shows pride in completed work",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate pride and satisfaction in their accomplishments?",
        activities: [
          "Art Gallery Walk – Display artwork and explain personal creative choices.",
          "My Best Work Sharing – Select completed projects and express pride in efforts.",
          "Achievement Display Board – Contribute projects to class displays."
        ]
      },
      {
        id: "3.5",
        title: "Cooperating in Small Groups",
        milestone: "Cooperates in small group activities",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to cooperate and work with others in small groups?",
        activities: [
          "Group Puzzle Activity – Collaborate with 3-4 peers to solve a large floor puzzle.",
          "Group Art Project – Create a joint mural sharing responsibilities.",
          "Building Team Challenge – Work in a small team to construct a building structure."
        ]
      },
      {
        id: "3.6",
        title: "Expressing Disagreement with Words",
        milestone: "Expresses disagreement with words",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to express disagreement using words rather than actions?",
        activities: [
          "Use Your Words Role Play – Practice polite verbal expressions during disagreements.",
          "Choice Discussion Activity – Explain personal preferences respectfully when opinions differ.",
          "Problem-Solving Circle Time – Discuss constructive words to use during conflicts."
        ]
      },
      {
        id: "3.7",
        title: "Sharing with Peers",
        milestone: "Shares willingly with peers",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate willingness to share toys and materials with others?",
        activities: [
          "Shared Materials Activity – Share limited resources willingly without conflict.",
          "Group Play Observation – Spontaneously offer toys to peers during free play.",
          "Sharing Discussion – Explain why sharing is important and demonstrate in action."
        ]
      },
      {
        id: "3.8",
        title: "Resolving Conflicts Peacefully",
        milestone: "Resolves conflicts peacefully",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to resolve conflicts using peaceful strategies?",
        activities: [
          "Conflict Resolution Practice – Use peaceful problem-solving steps during disagreements.",
          "Peace Table Activity – Sit at a designated peace table to talk out issues.",
          "Role-Play Scenarios – Practice peaceful resolution techniques through pretend play."
        ]
      }
    ]
  },
  {
    id: "language",
    number: "4",
    title: "Domain 4: Language Development",
    items: [
      {
        id: "1.1",
        title: "Using Sentences of 5-7 Words",
        milestone: "Uses sentences of 5-7 words confidently",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to use complete sentences of 5-7 words?",
        activities: [
          "Picture Description Activity – Describe detailed picture scenes in 5-7 word sentences.",
          "Show and Tell – Present a favorite object using clear, extended sentences.",
          "Daily Conversation Circle – Contribute to discussions with complex sentence structures."
        ]
      },
      {
        id: "1.2",
        title: "Answering 'When' and 'Why' Questions",
        milestone: "Answers 'when' and 'why' questions",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to answer when and why questions appropriately?",
        activities: [
          "Story Question Time – Answer 'when' and 'why' questions about story plots.",
          "Daily Routine Discussion – Explain why routines happen at specific times.",
          "Picture Prompt Questions – Respond accurately to cause-and-effect prompts."
        ]
      },
      {
        id: "1.3",
        title: "Telling Simple Stories",
        milestone: "Tells simple stories with beginning and end",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to tell simple stories with a clear beginning and end?",
        activities: [
          "Picture Story Sequence – Narrate a story with clear start, middle, and ending.",
          "My Day Story – Relate a personal experience with sequential structure.",
          "Story Basket Activity – Invent a fictional narrative using basket props."
        ]
      },
      {
        id: "1.4",
        title: "Following 3-Step Instructions",
        milestone: "Follows 3-step instructions",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to follow multi-step instructions?",
        activities: [
          "Classroom Helper Task – Complete 3 sequential tasks independently.",
          "Action Sequence Game – Perform 3 physical actions in correct sequence.",
          "Treasure Hunt Challenge – Follow a 3-step clue sequence to find an item."
        ]
      },
      {
        id: "1.5",
        title: "Using 'Because' and 'If'",
        milestone: "Uses 'because' and 'if' in sentences",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to use because and if in sentences?",
        activities: [
          "Complete the Sentence Activity – Finish sentence stems using 'because' or 'if'.",
          "Cause and Effect Discussion – Explain reasoning using conditional words.",
          "Story Prediction Game – Formulate conditional hypotheses ('If it rains...')."
        ]
      },
      {
        id: "1.6",
        title: "Retelling Stories",
        milestone: "Retells story with 3+ events in order",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to retell stories with multiple events in sequence?",
        activities: [
          "Story Recall Activity – Retell 3 or more key story events in accurate order.",
          "Picture Event Sequencing – Order story picture cards and narrate the plot.",
          "Puppet Story Retelling – Use puppets to act out story events in sequence."
        ]
      },
      {
        id: "1.7",
        title: "Understanding Complex Vocabulary",
        milestone: "Understands more complex vocabulary",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate understanding of more complex words and concepts?",
        activities: [
          "Vocabulary Enrichment Activity – Learn and use advanced thematic words.",
          "Context Clues Game – Infer word meanings from story context.",
          "Thematic Vocabulary – Demonstrate understanding of domain-specific terms."
        ]
      },
      {
        id: "1.8",
        title: "Engaging in Conversations",
        milestone: "Engages in extended conversations",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to engage in extended conversations?",
        activities: [
          "Conversation Practice – Maintain multi-turn conversational exchanges.",
          "Topic Discussion – Stay on topic while discussing complex themes.",
          "Question/Response Practice – Ask and answer connected follow-up questions."
        ]
      }
    ]
  },
  {
    id: "adaptive",
    number: "5",
    title: "Domain 5: Adaptive (Self-Help) Skills",
    items: [
      {
        id: "1.1",
        title: "Independent Shoe-Wearing",
        milestone: "Puts on and removes shoes independently",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to put on and remove shoes independently?",
        activities: [
          "Shoe Practice Station – Put on and take off shoes (velcro/slip-on) independently.",
          "Ready for Outdoor Play – Manage shoes without assistance before/after outdoor play.",
          "Shoe Matching and Wearing Game – Match correct shoes to left/right feet and put on."
        ]
      },
      {
        id: "1.2",
        title: "Button Fastening",
        milestone: "Fastens large buttons",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to fasten and unfasten large buttons?",
        activities: [
          "Button Board Practice – Push large buttons through buttonholes independently.",
          "Dress-Up Button Activity – Fasten buttons on dress-up coats and shirts.",
          "Button Race Challenge – Button up a shirt independently."
        ]
      },
      {
        id: "1.3",
        title: "Independent Toileting",
        milestone: "Manages toilet routine independently",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to manage the entire toilet routine independently?",
        activities: [
          "Bathroom Routine Practice – Complete unassisted toileting, wiping, flushing, and handwashing.",
          "Routine Picture Sequence – Follow complete bathroom routine checklist.",
          "Independence Check Activity – Manage clothing and hygiene without adult intervention."
        ]
      },
      {
        id: "1.4",
        title: "Pouring Drinks",
        milestone: "Pours drink with minimal spilling",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to pour liquids with minimal spilling?",
        activities: [
          "Water Pouring Practice – Pour water from small pitcher into cups carefully.",
          "Snack Time Pouring – Pour own drink during meal times.",
          "Fill the Cup Activity – Pour liquid accurately up to a target line."
        ]
      },
      {
        id: "1.5",
        title: "Food Preparation Assistance",
        milestone: "Pours cereal and milk with help",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to prepare simple foods with assistance?",
        activities: [
          "Breakfast Preparation Activity – Measure cereal and pour milk into a bowl with guidance.",
          "Follow the Steps Routine – Prepare simple snacks following visual steps.",
          "Pretend Kitchen Practice – Practice safe food prep techniques in play kitchen."
        ]
      },
      {
        id: "1.6",
        title: "Proper Utensil Use",
        milestone: "Uses fork and spoon correctly",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to use fork and spoon correctly?",
        activities: [
          "Mealtime Practice – Hold and manipulate spoon and fork properly during meals.",
          "Sorting Food Activity – Spear or scoop specific foods using appropriate utensil.",
          "Transfer Game – Move small items between plates using fork/spoon."
        ]
      },
      {
        id: "1.7",
        title: "Dressing Independence",
        milestone: "Dresses with minimal assistance",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to dress with minimal help?",
        activities: [
          "Dressing Practice – Put on shirts, pants, and socks independently.",
          "Morning Routine – Complete dressing routine with minimal supervision.",
          "Dress-Up Play – Practice managing various clothing fasteners during play."
        ]
      },
      {
        id: "1.8",
        title: "Personal Belongings Care",
        milestone: "Takes care of personal belongings",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate responsibility for personal belongings?",
        activities: [
          "Bag Organization – Hang up backpack, place coat on hook, and put away lunchbox.",
          "Toy Care Routine – Return materials to proper storage locations after use.",
          "Belongings Discussion – Keep track of personal water bottles and sweaters."
        ]
      }
    ]
  },
  {
    id: "sensory",
    number: "6",
    title: "Domain 6: Sensory & Emotional Regulation",
    items: [
      {
        id: "1.1",
        title: "Tolerating Different Textures",
        milestone: "Tolerates different textures during play",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate comfort and tolerance when exploring different textures?",
        activities: [
          "Sensory Bin Exploration – Touch and explore sand, rice, slime, and foam without distress.",
          "Texture Discovery Walk – Touch varied surfaces and describe tactile feedback.",
          "Creative Texture Art – Create collages using diverse textured materials."
        ]
      },
      {
        id: "1.2",
        title: "Participating in Sensory Activities",
        milestone: "Participates in sensory activities without distress",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to participate in sensory activities without distress?",
        activities: [
          "Water Play Exploration – Engage in water pouring and measuring activities comfortably.",
          "Sand Tray Investigation – Dig, scoop, and build in sand trays enthusiastically.",
          "Play Dough Creations – Sculpt and manipulate play dough using various tools."
        ]
      },
      {
        id: "1.3",
        title: "Using Calming Strategies with Support",
        milestone: "Uses calming strategies with support",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to use calming strategies with adult guidance?",
        activities: [
          "Deep Breathing Practice – Use deep breathing exercises ('smell flower, blow candle') when upset.",
          "Calm Down Corner – Rest in a quiet area with weighted blanket or plush toy to regulate.",
          "Stretch and Relax Activity – Perform simple yoga stretches to relieve tension."
        ]
      },
      {
        id: "1.4",
        title: "Recovering from Disappointment",
        milestone: "Recovers from disappointment within a short time",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to recover from disappointment relatively quickly?",
        activities: [
          "Try Again Challenge – Persist calmly when a tower falls or puzzle piece doesn't fit.",
          "Feelings Discussion Circle – Talk about strategies for handling losing a game.",
          "Turn-Taking Game – Accept turn endings or losing without prolonged emotional outbursts."
        ]
      },
      {
        id: "1.5",
        title: "Accepting Changes in Routine",
        milestone: "Accepts changes in routine with support",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to accept routine changes with support?",
        activities: [
          "Schedule Change Practice – Adapt smoothly when indoor play replaces outdoor time.",
          "Mystery Activity Time – Transition flexibly to unexpected activity changes.",
          "Visual Schedule Adjustment – Refer to updated visual schedules to anticipate changes."
        ]
      },
      {
        id: "1.6",
        title: "Expressing Feelings Using Words",
        milestone: "Expresses feelings using words",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to express feelings using words?",
        activities: [
          "Emotion Sharing Circle – Verbalize emotions ('I feel angry because...') clearly.",
          "Feelings Picture Cards – Label complex emotions on visual emotion cards.",
          "My Feelings Journal – Draw and describe daily emotional experiences."
        ]
      },
      {
        id: "1.7",
        title: "Identifying Emotions in Self",
        milestone: "Identifies emotions in self",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to identify their own emotions?",
        activities: [
          "Emotion Mirror Activity – Observe facial expressions and recognize internal emotional state.",
          "Emotion Vocabulary Practice – Name feelings accurately during emotional moments.",
          "Daily Check-In – Check in on personal emotional state during morning meeting."
        ]
      },
      {
        id: "1.8",
        title: "Recognizing Emotions in Others",
        milestone: "Recognizes emotions in others",
        targetAge: "4–5 Years",
        text: "Does the child demonstrate the ability to recognize emotions in others?",
        activities: [
          "Emotion Cards Activity – Identify facial and body language emotional cues in photos.",
          "Observing Others – Notice when peers need help or comfort.",
          "Story Character Feelings – Infer how characters feel based on story plot events."
        ]
      }
    ]
  },
];

export const SECTIONS_5_6_YEARS = [
  {
    "id": "physical",
    "number": "1",
    "title": "Domain 1: Physical Development",
    "items": [
      {
        "id": "1.1",
        "title": "Walks Up and Down Stairs Using Alternating Feet",
        "milestone": "Walks up and down stairs using alternating feet (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to walk up and down stairs using alternating feet with confidence?",
        "activities": [
          "Guided Practice \u2013 Practice walks up and down stairs using alternating feet with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of walks up and down stairs using alternating feet.",
          "Independent Application \u2013 Provide opportunities for independent mastery of walks up and down stairs using alternating feet."
        ]
      },
      {
        "id": "1.2",
        "title": "Walks on a Line or Balance Beam",
        "milestone": "Walks on a line or balance beam (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to maintain balance while walking on a narrow surface?",
        "activities": [
          "Guided Practice \u2013 Practice walks on a line or balance beam with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of walks on a line or balance beam.",
          "Independent Application \u2013 Provide opportunities for independent mastery of walks on a line or balance beam."
        ]
      },
      {
        "id": "1.3",
        "title": "Jumps Forward with Both Feet Leaving the Ground",
        "milestone": "Jumps forward with both feet leaving the ground (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to jump forward using both feet together?",
        "activities": [
          "Guided Practice \u2013 Practice jumps forward with both feet leaving the ground with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of jumps forward with both feet leaving the ground.",
          "Independent Application \u2013 Provide opportunities for independent mastery of jumps forward with both feet leaving the ground."
        ]
      },
      {
        "id": "1.4",
        "title": "Runs with More Coordination and Less Falling",
        "milestone": "Runs with more coordination and less falling (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to run with coordination and control?",
        "activities": [
          "Guided Practice \u2013 Practice runs with more coordination and less falling with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of runs with more coordination and less falling.",
          "Independent Application \u2013 Provide opportunities for independent mastery of runs with more coordination and less falling."
        ]
      },
      {
        "id": "1.5",
        "title": "Pedals a Tricycle",
        "milestone": "Pedals a tricycle (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to pedal a tricycle with coordination?",
        "activities": [
          "Guided Practice \u2013 Practice pedals a tricycle with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of pedals a tricycle.",
          "Independent Application \u2013 Provide opportunities for independent mastery of pedals a tricycle."
        ]
      },
      {
        "id": "1.6",
        "title": "Demonstrates Coordination in Ball Play",
        "milestone": "Demonstrates coordination in ball play (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate coordination when playing with balls?",
        "activities": [
          "Guided Practice \u2013 Practice demonstrates coordination in ball play with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of demonstrates coordination in ball play.",
          "Independent Application \u2013 Provide opportunities for independent mastery of demonstrates coordination in ball play."
        ]
      },
      {
        "id": "1.7",
        "title": "Demonstrates Rhythmic Movement to Music",
        "milestone": "Demonstrates rhythmic movement to music (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to move rhythmically in response to music?",
        "activities": [
          "Guided Practice \u2013 Practice demonstrates rhythmic movement to music with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of demonstrates rhythmic movement to music.",
          "Independent Application \u2013 Provide opportunities for independent mastery of demonstrates rhythmic movement to music."
        ]
      },
      {
        "id": "1.8",
        "title": "Follows Simple Safety Rules During Physical Activities",
        "milestone": "Follows simple safety rules (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate understanding and compliance with basic safety rules during physical activities?",
        "activities": [
          "Guided Practice \u2013 Practice follows simple safety rules during physical activities with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of follows simple safety rules during physical activities.",
          "Independent Application \u2013 Provide opportunities for independent mastery of follows simple safety rules during physical activities."
        ]
      }
    ]
  },
  {
    "id": "cognitive",
    "number": "2",
    "title": "Domain 2: Cognitive Development",
    "items": [
      {
        "id": "2.1",
        "title": "Counts Objects Up to 10",
        "milestone": "Counts objects up to 10 (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to count objects up to 10 accurately?",
        "activities": [
          "Guided Practice \u2013 Practice counts objects up to 10 with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of counts objects up to 10.",
          "Independent Application \u2013 Provide opportunities for independent mastery of counts objects up to 10."
        ]
      },
      {
        "id": "2.2",
        "title": "Recognizes and Names Numerals 1-5",
        "milestone": "Recognizes and names numerals 1-5 (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to recognize and name numerals 1-5?",
        "activities": [
          "Guided Practice \u2013 Practice recognizes and names numerals 1-5 with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of recognizes and names numerals 1-5.",
          "Independent Application \u2013 Provide opportunities for independent mastery of recognizes and names numerals 1-5."
        ]
      },
      {
        "id": "2.3",
        "title": "Understands the Concept of \"More\" and \"Less\"",
        "milestone": "Understands the concept of \"more\" and \"less\" (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate understanding of \"more\" and \"less\" concepts?",
        "activities": [
          "Guided Practice \u2013 Practice understands the concept of \"more\" and \"less\" with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of understands the concept of \"more\" and \"less\".",
          "Independent Application \u2013 Provide opportunities for independent mastery of understands the concept of \"more\" and \"less\"."
        ]
      },
      {
        "id": "2.4",
        "title": "Sorts Objects by One Attribute (Color, Shape, Size)",
        "milestone": "Sorts objects by one attribute (color, shape, size) (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to sort objects by a single attribute?",
        "activities": [
          "Guided Practice \u2013 Practice sorts objects by one attribute (color, shape, size) with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of sorts objects by one attribute (color, shape, size).",
          "Independent Application \u2013 Provide opportunities for independent mastery of sorts objects by one attribute (color, shape, size)."
        ]
      },
      {
        "id": "2.5",
        "title": "Recognizes and Creates Simple AB Patterns",
        "milestone": "Recognizes and creates simple AB patterns (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to recognize and create simple AB patterns?",
        "activities": [
          "Guided Practice \u2013 Practice recognizes and creates simple ab patterns with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of recognizes and creates simple ab patterns.",
          "Independent Application \u2013 Provide opportunities for independent mastery of recognizes and creates simple ab patterns."
        ]
      },
      {
        "id": "2.6",
        "title": "Identifies Basic Shapes (Circle, Square, Triangle)",
        "milestone": "Identifies basic shapes (circle, square, triangle) (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to identify and name basic shapes?",
        "activities": [
          "Guided Practice \u2013 Practice identifies basic shapes (circle, square, triangle) with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of identifies basic shapes (circle, square, triangle).",
          "Independent Application \u2013 Provide opportunities for independent mastery of identifies basic shapes (circle, square, triangle)."
        ]
      },
      {
        "id": "2.7",
        "title": "Understands and Uses Positional Words (On, In, Under)",
        "milestone": "Understands and uses positional words (on, in, under) (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate understanding and use of positional words?",
        "activities": [
          "Guided Practice \u2013 Practice understands and uses positional words (on, in, under) with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of understands and uses positional words (on, in, under).",
          "Independent Application \u2013 Provide opportunities for independent mastery of understands and uses positional words (on, in, under)."
        ]
      },
      {
        "id": "2.8",
        "title": "Sequences 2-3 Pictures to Tell a Simple Story",
        "milestone": "Sequences 2-3 pictures to tell a simple story (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to sequence pictures and tell a simple story?",
        "activities": [
          "Guided Practice \u2013 Practice sequences 2-3 pictures to tell a simple story with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of sequences 2-3 pictures to tell a simple story.",
          "Independent Application \u2013 Provide opportunities for independent mastery of sequences 2-3 pictures to tell a simple story."
        ]
      }
    ]
  },
  {
    "id": "social",
    "number": "3",
    "title": "Domain 3: Social-Emotional Development",
    "items": [
      {
        "id": "3.1",
        "title": "Understands and Follows Classroom Rules Independently",
        "milestone": "Follows simple classroom rules and routines (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to understand and follow classroom rules without reminders?",
        "activities": [
          "Guided Practice \u2013 Practice understands and follows classroom rules independently with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of understands and follows classroom rules independently.",
          "Independent Application \u2013 Provide opportunities for independent mastery of understands and follows classroom rules independently."
        ]
      },
      {
        "id": "3.2",
        "title": "Resolves Peer Conflicts with Words and Compromise",
        "milestone": "Resolves conflicts with words (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to resolve conflicts using words and finding a compromise?",
        "activities": [
          "Guided Practice \u2013 Practice resolves peer conflicts with words and compromise with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of resolves peer conflicts with words and compromise.",
          "Independent Application \u2013 Provide opportunities for independent mastery of resolves peer conflicts with words and compromise."
        ]
      },
      {
        "id": "3.3",
        "title": "Plans and Executes Group Play with Rules",
        "milestone": "Plans and executes group play with rules (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to plan and participate in group play with agreed-upon rules?",
        "activities": [
          "Guided Practice \u2013 Practice plans and executes group play with rules with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of plans and executes group play with rules.",
          "Independent Application \u2013 Provide opportunities for independent mastery of plans and executes group play with rules."
        ]
      },
      {
        "id": "3.4",
        "title": "Demonstrates Consistent Peer Empathy",
        "milestone": "Shows concern for a peer who is upset (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child consistently demonstrate empathy and concern for peers?",
        "activities": [
          "Guided Practice \u2013 Practice demonstrates consistent peer empathy with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of demonstrates consistent peer empathy.",
          "Independent Application \u2013 Provide opportunities for independent mastery of demonstrates consistent peer empathy."
        ]
      },
      {
        "id": "3.5",
        "title": "Demonstrates Consistent Self-Regulation in Varied Settings",
        "milestone": "Demonstrates self-regulation in varied settings (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to regulate emotions and behavior across different situations?",
        "activities": [
          "Guided Practice \u2013 Practice demonstrates consistent self-regulation in varied settings with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of demonstrates consistent self-regulation in varied settings.",
          "Independent Application \u2013 Provide opportunities for independent mastery of demonstrates consistent self-regulation in varied settings."
        ]
      },
      {
        "id": "3.6",
        "title": "Demonstrates Strong Community and Classroom Citizenship",
        "milestone": "Demonstrates strong community and classroom citizenship (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate strong community and classroom citizenship through responsible behavior?",
        "activities": [
          "Guided Practice \u2013 Practice demonstrates strong community and classroom citizenship with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of demonstrates strong community and classroom citizenship.",
          "Independent Application \u2013 Provide opportunities for independent mastery of demonstrates strong community and classroom citizenship."
        ]
      },
      {
        "id": "3.7",
        "title": "Shows Confidence in Attempting New Tasks",
        "milestone": "Shows confidence in attempting new tasks (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate confidence when faced with new or challenging tasks?",
        "activities": [
          "Guided Practice \u2013 Practice shows confidence in attempting new tasks with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of shows confidence in attempting new tasks.",
          "Independent Application \u2013 Provide opportunities for independent mastery of shows confidence in attempting new tasks."
        ]
      },
      {
        "id": "3.8",
        "title": "Makes Simple Choices Independently",
        "milestone": "Makes simple choices independently (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to make choices independently?",
        "activities": [
          "Guided Practice \u2013 Practice makes simple choices independently with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of makes simple choices independently.",
          "Independent Application \u2013 Provide opportunities for independent mastery of makes simple choices independently."
        ]
      }
    ]
  },
  {
    "id": "language",
    "number": "4",
    "title": "Domain 4: Language Development",
    "items": [
      {
        "id": "4.1",
        "title": "Speaks in 7-9 Word Sentences",
        "milestone": "Uses complete sentences (Age-appropriate for 5-6 years)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to speak in complex sentences of 7-9 words?",
        "activities": [
          "Guided Practice \u2013 Practice speaks in 7-9 word sentences with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of speaks in 7-9 word sentences.",
          "Independent Application \u2013 Provide opportunities for independent mastery of speaks in 7-9 word sentences."
        ]
      },
      {
        "id": "4.2",
        "title": "Describes Stories with Character Feelings and Motivations",
        "milestone": "Describes stories with character feelings (Age-appropriate for 5-6 years)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to describe character feelings and motivations in stories?",
        "activities": [
          "Guided Practice \u2013 Practice describes stories with character feelings and motivations with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of describes stories with character feelings and motivations.",
          "Independent Application \u2013 Provide opportunities for independent mastery of describes stories with character feelings and motivations."
        ]
      },
      {
        "id": "4.3",
        "title": "Writes Simple Words and CVC Words",
        "milestone": "Writes simple CVC words (Age-appropriate for 5-6 years)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to write simple CVC words independently?",
        "activities": [
          "Guided Practice \u2013 Practice writes simple words and cvc words with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of writes simple words and cvc words.",
          "Independent Application \u2013 Provide opportunities for independent mastery of writes simple words and cvc words."
        ]
      },
      {
        "id": "4.4",
        "title": "Writes Simple Sentences with Beginning Punctuation",
        "milestone": "Writes simple sentences (Age-appropriate for 5-6 years)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to write simple sentences with capital letters and punctuation?",
        "activities": [
          "Guided Practice \u2013 Practice writes simple sentences with beginning punctuation with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of writes simple sentences with beginning punctuation.",
          "Independent Application \u2013 Provide opportunities for independent mastery of writes simple sentences with beginning punctuation."
        ]
      },
      {
        "id": "4.5",
        "title": "Writes Short Paragraphs with Support",
        "milestone": "Writes short paragraphs (Age-appropriate for 5-6 years)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to write short paragraphs with some support?",
        "activities": [
          "Guided Practice \u2013 Practice writes short paragraphs with support with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of writes short paragraphs with support.",
          "Independent Application \u2013 Provide opportunities for independent mastery of writes short paragraphs with support."
        ]
      },
      {
        "id": "4.6",
        "title": "Writes Complete Stories with Detail and Structure",
        "milestone": "Writes complete stories (Age-appropriate for 5-6 years)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to write complete stories with detail and structure?",
        "activities": [
          "Guided Practice \u2013 Practice writes complete stories with detail and structure with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of writes complete stories with detail and structure.",
          "Independent Application \u2013 Provide opportunities for independent mastery of writes complete stories with detail and structure."
        ]
      },
      {
        "id": "4.7",
        "title": "Listens Attentively to Stories",
        "milestone": "Listens attentively to stories (Age-appropriate for 5-6 years)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to listen attentively during story time?",
        "activities": [
          "Guided Practice \u2013 Practice listens attentively to stories with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of listens attentively to stories.",
          "Independent Application \u2013 Provide opportunities for independent mastery of listens attentively to stories."
        ]
      },
      {
        "id": "4.8",
        "title": "Uses Descriptive Language",
        "milestone": "Uses descriptive language (Age-appropriate for 5-6 years)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to use descriptive words in communication?",
        "activities": [
          "Guided Practice \u2013 Practice uses descriptive language with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of uses descriptive language.",
          "Independent Application \u2013 Provide opportunities for independent mastery of uses descriptive language."
        ]
      }
    ]
  },
  {
    "id": "adaptive",
    "number": "5",
    "title": "Domain 5: Adaptive (Self-Help) Skills",
    "items": [
      {
        "id": "5.1",
        "title": "Independently Manages All Dressing Including Laces and Buckles",
        "milestone": "Independently manages dressing (Age-appropriate for 5-6 years)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to dress independently including managing fasteners?",
        "activities": [
          "Guided Practice \u2013 Practice independently manages all dressing including laces and buckles with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of independently manages all dressing including laces and buckles.",
          "Independent Application \u2013 Provide opportunities for independent mastery of independently manages all dressing including laces and buckles."
        ]
      },
      {
        "id": "5.2",
        "title": "Follows Multi-Step Hygiene Routine Independently",
        "milestone": "Follows multi-step hygiene routine (Age-appropriate for 5-6 years)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to follow a multi-step hygiene routine independently?",
        "activities": [
          "Guided Practice \u2013 Practice follows multi-step hygiene routine independently with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of follows multi-step hygiene routine independently.",
          "Independent Application \u2013 Provide opportunities for independent mastery of follows multi-step hygiene routine independently."
        ]
      },
      {
        "id": "5.3",
        "title": "Manages Full School-Day Routine Independently",
        "milestone": "Manages full school-day routine (Age-appropriate for 5-6 years)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to manage a full school-day routine independently?",
        "activities": [
          "Guided Practice \u2013 Practice manages full school-day routine independently with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of manages full school-day routine independently.",
          "Independent Application \u2013 Provide opportunities for independent mastery of manages full school-day routine independently."
        ]
      },
      {
        "id": "5.4",
        "title": "Handles All Personal Care Fully Independently",
        "milestone": "Handles all personal care (Age-appropriate for 5-6 years)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to handle all personal care needs independently?",
        "activities": [
          "Guided Practice \u2013 Practice handles all personal care fully independently with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of handles all personal care fully independently.",
          "Independent Application \u2013 Provide opportunities for independent mastery of handles all personal care fully independently."
        ]
      },
      {
        "id": "5.5",
        "title": "Plans Own Morning Routine with a Checklist",
        "milestone": "Plans own morning routine (Age-appropriate for 5-6 years)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to plan and follow a morning routine using a checklist?",
        "activities": [
          "Guided Practice \u2013 Practice plans own morning routine with a checklist with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of plans own morning routine with a checklist.",
          "Independent Application \u2013 Provide opportunities for independent mastery of plans own morning routine with a checklist."
        ]
      },
      {
        "id": "5.6",
        "title": "Manages All Daily Routines Fully Independently",
        "milestone": "Manages all daily routines (Age-appropriate for 5-6 years)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to manage all daily routines independently?",
        "activities": [
          "Guided Practice \u2013 Practice manages all daily routines fully independently with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of manages all daily routines fully independently.",
          "Independent Application \u2013 Provide opportunities for independent mastery of manages all daily routines fully independently."
        ]
      },
      {
        "id": "5.7",
        "title": "Demonstrates Awareness of Personal Safety",
        "milestone": "Demonstrates awareness of personal safety (Age-appropriate for 5-6 years)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate awareness of personal safety rules and practices?",
        "activities": [
          "Guided Practice \u2013 Practice demonstrates awareness of personal safety with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of demonstrates awareness of personal safety.",
          "Independent Application \u2013 Provide opportunities for independent mastery of demonstrates awareness of personal safety."
        ]
      },
      {
        "id": "5.8",
        "title": "Shows Understanding of Basic Table Manners",
        "milestone": "Shows understanding of basic table manners (Age-appropriate for 5-6 years)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate emerging understanding of table manners?",
        "activities": [
          "Guided Practice \u2013 Practice shows understanding of basic table manners with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of shows understanding of basic table manners.",
          "Independent Application \u2013 Provide opportunities for independent mastery of shows understanding of basic table manners."
        ]
      }
    ]
  },
  {
    "id": "sensory",
    "number": "6",
    "title": "Domain 6: Sensory & Emotional Regulation",
    "items": [
      {
        "id": "6.1",
        "title": "Demonstrates Self-Regulation in Group Activities",
        "milestone": "Demonstrates self-regulation in group activities (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to self-regulate during group activities?",
        "activities": [
          "Guided Practice \u2013 Practice demonstrates self-regulation in group activities with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of demonstrates self-regulation in group activities.",
          "Independent Application \u2013 Provide opportunities for independent mastery of demonstrates self-regulation in group activities."
        ]
      },
      {
        "id": "6.2",
        "title": "Demonstrates Improved Impulse Control",
        "milestone": "Demonstrates improved impulse control (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to control impulses and wait for instructions?",
        "activities": [
          "Guided Practice \u2013 Practice demonstrates improved impulse control with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of demonstrates improved impulse control.",
          "Independent Application \u2013 Provide opportunities for independent mastery of demonstrates improved impulse control."
        ]
      },
      {
        "id": "6.3",
        "title": "Uses Preferred Calming Strategy Independently",
        "milestone": "Uses preferred calming strategy (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to use calming strategies independently when needed?",
        "activities": [
          "Guided Practice \u2013 Practice uses preferred calming strategy independently with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of uses preferred calming strategy independently.",
          "Independent Application \u2013 Provide opportunities for independent mastery of uses preferred calming strategy independently."
        ]
      },
      {
        "id": "6.4",
        "title": "Practices Mindfulness with Teacher Guidance",
        "milestone": "Practices mindfulness (Age-appropriate for 5-6 years)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to participate in mindfulness activities with guidance?",
        "activities": [
          "Guided Practice \u2013 Practice practices mindfulness with teacher guidance with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of practices mindfulness with teacher guidance.",
          "Independent Application \u2013 Provide opportunities for independent mastery of practices mindfulness with teacher guidance."
        ]
      },
      {
        "id": "6.5",
        "title": "Demonstrates Proactive Coping Skills",
        "milestone": "Demonstrates proactive coping skills (Age-appropriate for 5-6 years)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to use proactive coping skills before becoming upset?",
        "activities": [
          "Guided Practice \u2013 Practice demonstrates proactive coping skills with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of demonstrates proactive coping skills.",
          "Independent Application \u2013 Provide opportunities for independent mastery of demonstrates proactive coping skills."
        ]
      },
      {
        "id": "6.6",
        "title": "Uses a Range of Self-Regulation Strategies Flexibly",
        "milestone": "Uses a range of self-regulation strategies (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to use a range of self-regulation strategies flexibly?",
        "activities": [
          "Guided Practice \u2013 Practice uses a range of self-regulation strategies flexibly with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of uses a range of self-regulation strategies flexibly.",
          "Independent Application \u2013 Provide opportunities for independent mastery of uses a range of self-regulation strategies flexibly."
        ]
      },
      {
        "id": "6.7",
        "title": "Identifies and Labels Basic Emotions",
        "milestone": "Identifies and labels basic emotions (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to identify and label basic emotions in self and others?",
        "activities": [
          "Guided Practice \u2013 Practice identifies and labels basic emotions with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of identifies and labels basic emotions.",
          "Independent Application \u2013 Provide opportunities for independent mastery of identifies and labels basic emotions."
        ]
      },
      {
        "id": "6.8",
        "title": "Expresses Feelings and Needs Using Words",
        "milestone": "Expresses feelings and needs using words (Level 8, Age 3.5-4)",
        "targetAge": "5\u20136 Years",
        "text": "Does the child demonstrate the ability to express feelings and needs using words?",
        "activities": [
          "Guided Practice \u2013 Practice expresses feelings and needs using words with initial teacher demonstration.",
          "Peer Practice \u2013 Pair with a peer to encourage shared practice of expresses feelings and needs using words.",
          "Independent Application \u2013 Provide opportunities for independent mastery of expresses feelings and needs using words."
        ]
      }
    ]
  }
];

export const AGE_GROUPS = {
  "1–2 Years": SECTIONS_1_2_YEARS,
  "2–3 Years": SECTIONS_2_3_YEARS,
  "3–4 Years": SECTIONS_3_4_YEARS,
  "4–5 Years": SECTIONS_4_5_YEARS,
};

// Default SECTIONS export defaults to Age 2-3 Years for backwards compatibility
export const SECTIONS = SECTIONS_2_3_YEARS;

export function scoreOf(rating) {
  if (!rating) return null;
  const str = String(rating).trim();
  if (str === "Can't do" || str.startsWith("1") || str === "Not yet") return 1;
  if (str === "Emerging" || str.startsWith("2")) return 2;
  if (str === "Does Independently" || str.startsWith("3") || str === "Achieved") return 3;
  if (str.startsWith("4")) return 4;
  return null;
}

export function computeSectionScores(answers, sectionsInput = SECTIONS) {
  const activeSections = sectionsInput || SECTIONS;
  return activeSections.map((section) => {
    let score = 0;
    let max = 0;
    section.items.forEach((item) => {
      const scale = item.ratingScale || RATING_SCALE_3;
      const itemMax = scale.length >= 5 ? 4 : 3;
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
  if (date.getMonth() >= (ACADEMIC_YEAR_START_MONTH - 1)) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
}

export function normalizeAgeGroup(strVal) {
  if (strVal === undefined || strVal === null || strVal === "") return null;
  const s = String(strVal).trim().toLowerCase();

  if (s.includes("1-2") || s.includes("1–2") || s.includes("toddler")) return "1–2 Years";
  if (s.includes("2-3") || s.includes("2–3") || s.includes("playgroup")) return "2–3 Years";
  if (s.includes("3-4") || s.includes("3–4") || s.includes("nursery")) return "3–4 Years";
  if (s.includes("4-5") || s.includes("4–5") || s.includes("5-6") || s.includes("5–6") || s.includes("jr") || s.includes("sr") || s.includes("junior") || s.includes("senior")) return "4–5 Years";

  const num = Number(s);
  if (!isNaN(num)) {
    if (num < 2.0) return "1–2 Years";
    if (num < 3.0) return "2–3 Years";
    if (num < 4.0) return "3–4 Years";
    return "4–5 Years";
  }

  return null;
}

export function getAgeGroupFromChild(child) {
  if (!child) return "2–3 Years";

  // 1. Explicit ageGroup property
  if (child.ageGroup) {
    const norm = normalizeAgeGroup(child.ageGroup);
    if (norm) return norm;
  }
  if (child.class?.ageGroup) {
    const norm = normalizeAgeGroup(child.class.ageGroup);
    if (norm) return norm;
  }

  // 2. DOB calculation (1.0-1.9 -> 1-2, 2.0-2.9 -> 2-3, 3.0-3.9 -> 3-4, 4.0+ -> 4-5)
  const dobVal = child.dateOfBirth || child.dob;
  if (dobVal) {
    const dob = new Date(dobVal);
    if (!isNaN(dob.getTime())) {
      const ageInYears = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (ageInYears < 2.0) return "1–2 Years";
      if (ageInYears < 3.0) return "2–3 Years";
      if (ageInYears < 4.0) return "3–4 Years";
      return "4–5 Years";
    }
  }

  // 3. Numeric/string age property (e.g. 1, 2, 3, 4, 5, "3-4", "4-5")
  if (child.age !== undefined && child.age !== null) {
    const normAge = normalizeAgeGroup(child.age);
    if (normAge) return normAge;
  }

  // 4. Class Name / Label Fallback (e.g. "jr (4-5)", "nursery (3-4)")
  const classNameStr = child.className || child.class?.name || child.class;
  if (classNameStr) {
    const normClass = normalizeAgeGroup(classNameStr);
    if (normClass) return normClass;
  }

  return "2–3 Years";
}

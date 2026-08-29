// Default Question Bank helper for initializing clean age group templates in MongoDB
export function getDefaultSectionsForAgeGroup(ageGroup) {
  const ag = String(ageGroup || "2–3 Years").trim();

  return [
    {
      id: "physical_motor",
      number: 1,
      title: "Domain 1: Physical & Motor Development",
      items: [
        {
          id: "pm_1",
          title: "Gross Motor Skills",
          milestone: "Physical Balance & Coordination",
          targetAge: ag,
          text: "Does the child demonstrate age-appropriate gross motor balance and coordination?",
          ratingScale: ["Not yet", "Emerging", "Achieved"]
        },
        {
          id: "pm_2",
          title: "Fine Motor Control",
          milestone: "Hand & Finger Control",
          targetAge: ag,
          text: "Does the child show control when manipulating small objects or tools?",
          ratingScale: ["Not yet", "Emerging", "Achieved"]
        }
      ]
    },
    {
      id: "cognitive",
      number: 2,
      title: "Domain 2: Cognitive & Problem Solving",
      items: [
        {
          id: "cog_1",
          title: "Pattern & Shape Recognition",
          milestone: "Spatial & Pattern Reasoning",
          targetAge: ag,
          text: "Can the child recognize, match, or extend basic colors, shapes, or patterns?",
          ratingScale: ["Not yet", "Emerging", "Achieved"]
        },
        {
          id: "cog_2",
          title: "Counting & Numeracy",
          milestone: "Early Math Concepts",
          targetAge: ag,
          text: "Does the child demonstrate basic counting or quantity understanding?",
          ratingScale: ["Not yet", "Emerging", "Achieved"]
        }
      ]
    },
    {
      id: "language",
      number: 3,
      title: "Domain 3: Language & Communication",
      items: [
        {
          id: "lang_1",
          title: "Verbal Expression",
          milestone: "Communication & Vocabulary",
          targetAge: ag,
          text: "Does the child use words or complete sentences to express thoughts and needs?",
          ratingScale: ["Not yet", "Emerging", "Achieved"]
        },
        {
          id: "lang_2",
          title: "Listening & Comprehension",
          milestone: "Following Directions",
          targetAge: ag,
          text: "Does the child listen attentively and follow multi-step instructions?",
          ratingScale: ["Not yet", "Emerging", "Achieved"]
        }
      ]
    },
    {
      id: "social_emotional",
      number: 4,
      title: "Domain 4: Social-Emotional Skills",
      items: [
        {
          id: "se_1",
          title: "Peer Interaction & Sharing",
          milestone: "Cooperative Play",
          targetAge: ag,
          text: "Does the child interact cooperatively and share materials with peers?",
          ratingScale: ["Not yet", "Emerging", "Achieved"]
        },
        {
          id: "se_2",
          title: "Emotional Regulation",
          milestone: "Self-Regulation & Needs Expression",
          targetAge: ag,
          text: "Does the child express feelings using words and manage transitions calmly?",
          ratingScale: ["Not yet", "Emerging", "Achieved"]
        }
      ]
    }
  ];
}

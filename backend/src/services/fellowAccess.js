import { User } from "../models/User.js";

// Shared by pdcaGenerate.js and curriculum.js — confirms a fellow is
// actually assigned to this mentor before any PDCA/curriculum action reads
// or generates anything on their behalf.
export async function ensureFellowBelongsToMentor(mentorId, fellowId) {
  const mentor = await User.findById(mentorId);
  const assignedTeachers = mentor?.mentorProfile?.assignedTeachers || [];
  return User.findOne({
    _id: fellowId,
    $or: [{ assignedMentor: mentorId }, { _id: { $in: assignedTeachers } }],
  });
}
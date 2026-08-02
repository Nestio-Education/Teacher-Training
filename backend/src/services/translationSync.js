import { Course } from "../models/Course.js";
import { LessonPlan } from "../models/LessonPlan.js";
import { ParentModule } from "../models/ParentModule.js";
import { translateObjectFields, SUPPORTED_LANGS } from "./translationService.js";

// Fire-and-forget background syncs
export async function syncCourseTranslations(courseId) {
  try {
    const course = await Course.findById(courseId);
    if (!course) return;

    // Translate top-level fields
    course.translations = await translateObjectFields(
      course,
      ["title", "description", "objectives"],
      course.translations || {}
    );

    // Translate modules
    if (course.modules) {
      for (let i = 0; i < course.modules.length; i++) {
        course.modules[i].translations = await translateObjectFields(
          course.modules[i],
          ["title", "description"],
          course.modules[i].translations || {}
        );
        
        // Translate content within modules
        if (course.modules[i].contents) {
          for (let j = 0; j < course.modules[i].contents.length; j++) {
            course.modules[i].contents[j].translations = await translateObjectFields(
              course.modules[i].contents[j],
              ["title", "description"],
              course.modules[i].contents[j].translations || {}
            );
          }
        }
      }
    }

    // Mark modified for mixed types
    course.markModified("translations");
    course.markModified("modules");
    await course.save();
    console.log(`Synced translations for course ${courseId}`);
  } catch (err) {
    console.error(`Error syncing course ${courseId}:`, err);
  }
}

export async function syncLessonPlanTranslations(lessonPlanId) {
  try {
    const lp = await LessonPlan.findById(lessonPlanId);
    if (!lp) return;

    lp.translations = await translateObjectFields(
      lp,
      ["title", "objectives", "instructions", "activities", "resources"],
      lp.translations || {}
    );

    lp.markModified("translations");
    await lp.save();
    console.log(`Synced translations for lesson plan ${lessonPlanId}`);
  } catch (err) {
    console.error(`Error syncing lesson plan ${lessonPlanId}:`, err);
  }
}

export async function syncParentModuleTranslations(moduleId) {
  try {
    const pm = await ParentModule.findById(moduleId);
    if (!pm) return;

    pm.translations = await translateObjectFields(
      pm,
      ["title", "objective"],
      pm.translations || {}
    );

    if (pm.sessions) {
      for (let i = 0; i < pm.sessions.length; i++) {
        pm.sessions[i].translations = await translateObjectFields(
          pm.sessions[i],
          ["title", "objective", "homePractice"],
          pm.sessions[i].translations || {}
        );

        if (pm.sessions[i].activities) {
          for (let j = 0; j < pm.sessions[i].activities.length; j++) {
            pm.sessions[i].activities[j].translations = await translateObjectFields(
              pm.sessions[i].activities[j],
              ["activity", "keyFocus"],
              pm.sessions[i].activities[j].translations || {}
            );
          }
        }
      }
    }

    pm.markModified("translations");
    pm.markModified("sessions");
    await pm.save();
    console.log(`Synced translations for parent module ${moduleId}`);
  } catch (err) {
    console.error(`Error syncing parent module ${moduleId}:`, err);
  }
}

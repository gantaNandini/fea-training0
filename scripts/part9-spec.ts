/** Content of the new course. Edit text here; the seed script only reads this file. */
export const PART9 = {
  courseSlug: "api-579-1-asme-ffs-1-part-9",
  courseTitle: "API 579-1 / ASME FFS-1 – Part 9",
  sectionTitle: "Flaw Characterization, Interaction and Re-Categorization",
  sectionSubtitle: "Crack Geometry, Branched Cracks, Multiple Flaws, Alignment and Combination Criteria.",
  topics: [
    "Crack classification and idealized geometry",
    "Characterization of flaw length and depth",
    "Equivalent Mode I crack dimensions",
    "Flaw orientation and stress biaxiality",
    "Branched crack characterization",
    "Multiple flaw alignment and combination criteria",
    "Flaw re-categorization",
  ],
  // Order = playing order. VIDEO lessons are gated (watch -> quiz >= 80% -> next). DOCUMENT never blocks.
  // durationSeconds = real length measured with ffprobe (0 for documents). `file` is the original name in the Drive folder (for uploading); it is NOT stored on the lesson.
  lessons: [
    { title: "Crack-Like Flaws – Part 1", type: "VIDEO", durationSeconds: 1226, file: "1-Part9-Crack-Like-Flaws_Part1.mp4" },
    { title: "Crack-Like Flaws – Part 2", type: "VIDEO", durationSeconds: 1097, file: "2-Part9-Crack-Like-Flaws_Part2.mp4" },
    { title: "Flaw Characterization – Part 1", type: "VIDEO", durationSeconds: 1653, file: "3-Flaw-Characterization_Part1.mp4" },
    { title: "Flaw Characterization – Part 2", type: "VIDEO", durationSeconds: 1517, file: "4-Flaw-Characterization_Part2.mp4" },
    { title: "Lecture slides 1 – Flaw Characterization", type: "DOCUMENT", durationSeconds: 0, file: "1-API579_Flaw_Characterization_Training_Updated.pptx" },
    { title: "Flaw Depth Characterization", type: "VIDEO", durationSeconds: 1413, file: "5-Flaw-Depth-Characterization.mp4" },
    { title: "Lecture slides 2 – Flaw Depth (9.3.6.3)", type: "DOCUMENT", durationSeconds: 0, file: "2-API579_9.3.6.3_Flaw_Depth_characterization.pptx" },
    { title: "Branched & Multiple Flaws – Part 1", type: "VIDEO", durationSeconds: 1719, file: "6-Branched-Multiple-Flaws_Part1.mp4" },
    { title: "Branched & Multiple Flaws – Part 2", type: "VIDEO", durationSeconds: 887, file: "7-Branched-Multiple-Flaws_Part2.mp4" },
    { title: "Lecture slides 3 – Branched Cracks, Multiple Flaws & Re-categorization", type: "DOCUMENT", durationSeconds: 0, file: "3-API 579 Part 9 – Branched Cracks, Multiple Flaws & Recategorization.pptx" },
  ],
} as const;

/** section description shown on the course page */
export function sectionDescription(): string {
  return `${PART9.sectionSubtitle}\n\nThis class covers:\n${PART9.topics.map((t) => `• ${t}`).join("\n")}`;
}

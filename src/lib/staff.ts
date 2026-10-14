/** Team management areas in page order, with the heading each one gets on the Team management page. */
export const STAFF_AREAS = [
  ["LEADERSHIP", "Club leadership"],
  ["MANAGEMENT", "Operations & team management"],
  ["COACHING", "Coaching staff"],
  ["SUPPORT", "Medical & support"],
  ["MEDIA", "Media & content"],
] as const;

export type StaffArea = (typeof STAFF_AREAS)[number][0];
export const STAFF_AREA_KEYS = STAFF_AREAS.map(([key]) => key) as [StaffArea, ...StaffArea[]];

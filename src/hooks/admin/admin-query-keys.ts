export const adminCommitteeKeys = {
  all: ["admin", "committee"] as const,
  admins: () => [...adminCommitteeKeys.all, "admins"] as const,
};

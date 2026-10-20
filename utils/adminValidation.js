export const ADMIN_MODEL_FIELDS = {
  users: ["id", "name", "email", "image"],
  workspaces: [
    "id",
    "name",
    "slug",
    "description",
    "settings",
    "ownerId",
    "image_url",
  ],
  workspaceMembers: ["userId", "workspaceId", "message", "role"],
  projects: [
    "name",
    "description",
    "priority",
    "status",
    "start_date",
    "end_date",
    "team_lead",
    "workspaceId",
    "progress",
  ],
  projectMembers: ["userId", "projectId"],
  tasks: [
    "projectId",
    "title",
    "description",
    "status",
    "type",
    "priority",
    "assigneeId",
    "due_date",
  ],
  comments: ["content", "userId", "taskId"],
};

export const pickAllowedFields = (model, body) => {
  const allowedFields = ADMIN_MODEL_FIELDS[model];

  if (
    !allowedFields ||
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return null;
  }

  return Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.includes(key)),
  );
};

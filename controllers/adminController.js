import prisma from "../configs/prisma.js";
import {
  ADMIN_MODEL_FIELDS,
  pickAllowedFields,
} from "../utils/adminValidation.js";

const MODELS = {
  users: prisma.user,
  workspaces: prisma.workspace,
  workspaceMembers: prisma.workspaceMember,
  projects: prisma.project,
  projectMembers: prisma.projectMember,
  tasks: prisma.task,
  comments: prisma.comment,
};

const REQUIRED_ON_CREATE = {
  users: ["id", "name", "email"],
  workspaces: ["id", "name", "slug", "ownerId"],
  workspaceMembers: ["userId", "workspaceId"],
  projects: ["name", "team_lead", "workspaceId"],
  projectMembers: ["userId", "projectId"],
  tasks: ["projectId", "title", "assigneeId", "due_date"],
  comments: ["content", "userId", "taskId"],
};

const ENUMS = {
  "workspaceMembers.role": ["ADMIN", "MEMBER"],
  "projects.priority": ["LOW", "MEDIUM", "HIGH"],
  "projects.status": [
    "ACTIVE",
    "PLANNING",
    "COMPLETED",
    "ON_HOLD",
    "CANCELLED",
  ],
  "tasks.status": ["TODO", "IN_PROGRESS", "DONE"],
  "tasks.type": ["TASK", "BUG", "FEATURE", "IMPROVEMENT", "OTHER"],
  "tasks.priority": ["LOW", "MEDIUM", "HIGH"],
};

const DATE_FIELDS = new Set([
  "projects.start_date",
  "projects.end_date",
  "tasks.due_date",
]);

const IMMUTABLE_FIELDS = {
  users: ["id"],
  workspaces: ["id"],
  workspaceMembers: ["id"],
  projects: ["id"],
  projectMembers: ["id"],
  tasks: ["id"],
  comments: ["id"],
};

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const validateAndNormalize = (model, input, { creating = false } = {}) => {
  if (!isPlainObject(input)) {
    return { error: "Request body must be a JSON object" };
  }

  const allowedFields = ADMIN_MODEL_FIELDS[model];
  const unknown = Object.keys(input).filter(
    (key) => !allowedFields.includes(key),
  );

  if (unknown.length) {
    return { error: `Unsupported fields: ${unknown.join(", ")}` };
  }

  const data = pickAllowedFields(model, input);

  if (!data || Object.keys(data).length === 0) {
    return { error: "Provide at least one permitted field" };
  }

  if (!creating) {
    const immutable = IMMUTABLE_FIELDS[model] || [];
    const attempted = Object.keys(data).filter((key) =>
      immutable.includes(key),
    );

    if (attempted.length) {
      return {
        error: `Cannot update immutable fields: ${attempted.join(", ")}`,
      };
    }
  }

  if (creating) {
    const missing = REQUIRED_ON_CREATE[model].filter(
      (key) =>
        data[key] === undefined || data[key] === null || data[key] === "",
    );

    if (missing.length) {
      return { error: `Missing required fields: ${missing.join(", ")}` };
    }
  }

  for (const [field, value] of Object.entries(data)) {
    if (value === undefined) {
      delete data[field];
      continue;
    }

    if (typeof value === "string" && !value.trim()) {
      const nullable = [
        "description",
        "image",
        "image_url",
        "start_date",
        "end_date",
      ];

      if (nullable.includes(field)) {
        data[field] = null;
        continue;
      }

      return { error: `${field} cannot be empty` };
    }

    const enumValues = ENUMS[`${model}.${field}`];

    if (enumValues && !enumValues.includes(value)) {
      return {
        error: `Invalid ${field}. Allowed values: ${enumValues.join(", ")}`,
      };
    }

    if (DATE_FIELDS.has(`${model}.${field}`)) {
      if (
        value === null &&
        model === "projects" &&
        ["start_date", "end_date"].includes(field)
      ) {
        continue;
      }

      const date = new Date(value);

      if (
        typeof value !== "string" ||
        !value.trim() ||
        Number.isNaN(date.getTime())
      ) {
        return { error: `${field} must be a valid date string` };
      }

      data[field] = date;
    }

    if (field === "progress" && model === "projects") {
      if (!Number.isInteger(value) || value < 0 || value > 100) {
        return { error: "progress must be an integer between 0 and 100" };
      }
    }

    if (field === "settings" && model === "workspaces") {
      if (!isPlainObject(value)) {
        return { error: "settings must be a JSON object" };
      }
    }

    if (field === "email" && model === "users") {
      if (
        typeof value !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        return { error: "A valid email address is required" };
      }
    }

    if (typeof value === "string" && !DATE_FIELDS.has(`${model}.${field}`)) {
      data[field] = value.trim();
    }
  }

  if (
    model === "projects" &&
    data.start_date &&
    data.end_date &&
    data.start_date > data.end_date
  ) {
    return { error: "end_date must not be before start_date" };
  }

  return { data };
};

const handleDatabaseError = (res, error) => {
  console.error("Admin database operation failed:", error);

  if (error.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "A record with this unique value already exists",
    });
  }

  if (error.code === "P2003") {
    return res.status(409).json({
      success: false,
      message: "Operation conflicts with related database records",
    });
  }

  if (error.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Record not found",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Database operation failed",
  });
};

// Dashboard statistics

export const getAdminOverview = async (req, res) => {
  try {
    const [
      users,
      workspaces,
      workspaceMembers,
      projects,
      projectMembers,
      tasks,
      comments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.workspace.count(),
      prisma.workspaceMember.count(),
      prisma.project.count(),
      prisma.projectMember.count(),
      prisma.task.count(),
      prisma.comment.count(),
    ]);

    const tables = [
      { name: "User", count: users },
      { name: "Workspace", count: workspaces },
      { name: "WorkspaceMember", count: workspaceMembers },
      { name: "Project", count: projects },
      { name: "ProjectMember", count: projectMembers },
      { name: "Task", count: tasks },
      { name: "Comment", count: comments },
    ];

    return res.json({
      success: true,
      data: {
        metrics: {
          totalUsers: users,
          totalWorkspaces: workspaces,
          totalProjects: projects,
          totalTasks: tasks,
          totalComments: comments,
          totalRecords: tables.reduce((sum, table) => sum + table.count, 0),
        },
        tables,
        health: {
          database: "connected",
          api: "responding",
          uptimeSeconds: Math.floor(process.uptime()),
          checkedAt: new Date().toISOString(),
          environment: process.env.NODE_ENV || "development",
        },
      },
    });
  } catch (error) {
    console.error("[admin:overview] Failed to load overview:", error.message);

    return res.status(503).json({
      success: false,
      message: "Unable to load admin overview",
      data: {
        health: {
          database: "unavailable",
          api: "responding",
          checkedAt: new Date().toISOString(),
          environment: process.env.NODE_ENV || "development",
        },
      },
    });
  }
};

// List records with pagination
export const getAdminRecords = async (req, res) => {
  try {
    const { model } = req.params;
    const delegate = MODELS[model];

    if (!delegate) {
      return res.status(404).json({
        success: false,
        message: "Unsupported database model",
      });
    }

    const page = Math.max(1, Math.floor(Number(req.query.page) || 1));
    const limit = Math.min(
      100,
      Math.max(1, Math.floor(Number(req.query.limit) || 20)),
    );

    const [records, total] = await Promise.all([
      delegate.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: "asc" },
      }),
      delegate.count(),
    ]);

    return res.json({
      success: true,
      model,
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
};

// Read a single record
export const getAdminRecord = async (req, res) => {
  try {
    const delegate = MODELS[req.params.model];

    if (!delegate) {
      return res.status(404).json({
        success: false,
        message: "Unsupported database model",
      });
    }

    const record = await delegate.findUnique({
      where: { id: req.params.id },
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    return res.json({
      success: true,
      model: req.params.model,
      record,
    });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
};

// Create a record
export const createAdminRecord = async (req, res) => {
  try {
    const { model } = req.params;
    const delegate = MODELS[model];

    if (!delegate) {
      return res.status(404).json({
        success: false,
        message: "Unsupported database model",
      });
    }

    const validation = validateAndNormalize(model, req.body, {
      creating: true,
    });

    if (validation.error) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const record = await delegate.create({
      data: validation.data,
    });

    return res.status(201).json({
      success: true,
      message: "Record created successfully",
      record,
    });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
};

// Update a record
export const updateAdminRecord = async (req, res) => {
  try {
    const { model, id } = req.params;
    const delegate = MODELS[model];

    if (!delegate) {
      return res.status(404).json({
        success: false,
        message: "Unsupported database model",
      });
    }

    const validation = validateAndNormalize(model, req.body);

    if (validation.error) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const record = await delegate.update({
      where: { id },
      data: validation.data,
    });

    return res.json({
      success: true,
      message: "Record updated successfully",
      record,
    });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
};

// Delete a record
export const deleteAdminRecord = async (req, res) => {
  try {
    const { model, id } = req.params;
    const delegate = MODELS[model];

    if (!delegate) {
      return res.status(404).json({
        success: false,
        message: "Unsupported database model",
      });
    }

    if (req.body?.confirm !== true) {
      return res.status(400).json({
        success: false,
        message: 'Set "confirm": true to delete this record',
      });
    }

    // These models may cascade into substantial amounts of related data.
    if (
      ["users", "workspaces"].includes(model) &&
      req.body?.confirmCascade !== true
    ) {
      return res.status(400).json({
        success: false,
        message:
          'This deletion may remove related data. Set "confirmCascade": true after reviewing the impact.',
      });
    }

    const record = await delegate.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "Record deleted successfully",
      record,
    });
  } catch (error) {
    return handleDatabaseError(res, error);
  }
};

export const verifyAdminAccess = (req, res) => {
  return res.status(200).json({
    success: true,
    authorized: true,
    message: "Admin access verified",
  });
};

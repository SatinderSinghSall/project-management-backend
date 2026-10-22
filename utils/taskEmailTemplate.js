const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatDate = (date) => {
  if (!date) return "Not specified";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Not specified";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const taskEmailTemplate = ({
  name,
  title,
  description,
  dueDate,
  projectName,
  taskUrl,
  reminder = false,
}) => {
  const safeName = escapeHtml(name || "there");
  const safeTitle = escapeHtml(title || "Untitled task");
  const safeDescription = escapeHtml(description || "No description provided.");
  const safeProject = escapeHtml(projectName || "your project");
  const safeDueDate = escapeHtml(formatDate(dueDate));

  const heading = reminder
    ? "Task due date reminder"
    : "You've been assigned a new task";

  const intro = reminder
    ? `This is a friendly reminder that you have a task due in ${safeProject}.`
    : `You've been assigned a new task in ${safeProject}. Here are the details:`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <title>${heading}</title>
    </head>

    <body style="margin:0;padding:0;background-color:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f6fb;">
        <tr>
        <td align="center" style="padding:32px 12px;">

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid #e5e9f2;border-radius:12px;overflow:hidden;">

            <!-- Brand header -->
            <tr>
                <td style="padding:24px 28px;background:#ffffff;border-bottom:1px solid #edf0f5;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                    <td>
                        <span style="display:inline-block;background:#4f46e5;color:#ffffff;font-size:16px;font-weight:bold;padding:9px 11px;border-radius:8px;">PM</span>
                        <span style="margin-left:9px;font-size:17px;font-weight:700;color:#172033;vertical-align:middle;">Project Management</span>
                    </td>
                    </tr>
                </table>
                </td>
            </tr>

            <!-- Email content -->
            <tr>
                <td style="padding:30px 28px 12px;">
                <p style="margin:0 0 10px;font-size:14px;line-height:22px;color:#64748b;">
                    Hi ${safeName},
                </p>

                <h1 style="margin:0 0 14px;font-size:25px;line-height:33px;font-weight:700;letter-spacing:-0.5px;color:#172033;">
                    ${heading}
                </h1>

                <p style="margin:0;font-size:15px;line-height:25px;color:#526078;">
                    ${intro}
                </p>
                </td>
            </tr>

            <!-- Task details -->
            <tr>
                <td style="padding:18px 28px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e5e9f2;border-radius:10px;">
                    <tr>
                    <td style="padding:20px;">
                        <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#64748b;">
                        Assigned task
                        </p>

                        <h2 style="margin:0 0 18px;font-size:20px;line-height:28px;font-weight:700;color:#2563eb;overflow-wrap:anywhere;">
                        ${safeTitle}
                        </h2>

                        <p style="margin:0 0 7px;font-size:12px;font-weight:700;color:#64748b;">
                        DESCRIPTION
                        </p>

                        <p style="margin:0 0 20px;font-size:14px;line-height:23px;color:#334155;white-space:pre-line;overflow-wrap:anywhere;">
                        ${safeDescription}
                        </p>

                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc;border-radius:8px;">
                        <tr>
                            <td style="padding:12px;">
                            <p style="margin:0 0 4px;font-size:11px;color:#64748b;">PROJECT</p>
                            <p style="margin:0;font-size:13px;font-weight:600;color:#334155;overflow-wrap:anywhere;">${safeProject}</p>
                            </td>
                            <td style="padding:12px;">
                            <p style="margin:0 0 4px;font-size:11px;color:#64748b;">DUE DATE</p>
                            <p style="margin:0;font-size:13px;font-weight:600;color:#334155;">${safeDueDate}</p>
                            </td>
                        </tr>
                        </table>
                    </td>
                    </tr>
                </table>
                </td>
            </tr>

            <!-- Primary action -->
            <tr>
                <td align="center" style="padding:0 28px 28px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                    <td align="center" bgcolor="#4f46e5" style="border-radius:8px;">
                        <a href="${escapeHtml(taskUrl)}" target="_blank" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;line-height:20px;color:#ffffff;text-decoration:none;border-radius:8px;">
                        View task &nbsp; &rarr;
                        </a>
                    </td>
                    </tr>
                </table>

                <p style="margin:16px 0 0;font-size:12px;line-height:20px;color:#64748b;text-align:center;">
                    ${
                      reminder
                        ? "Please review your task and update its status when completed."
                        : "Please review the task details and plan your work before the due date."
                    }
                </p>
                </td>
            </tr>

            <!-- Founder signature -->
            <tr>
                <td style="padding:22px 28px;background:#f8fafc;border-top:1px solid #e5e9f2;">
                <p style="margin:0 0 14px;font-size:14px;line-height:23px;color:#334155;">
                    Thanks for using <strong>Project Management</strong> 💙
                </p>

                <p style="margin:0;font-size:14px;font-weight:700;color:#172033;">
                    Satinder Singh Sall
                </p>

                <p style="margin:4px 0;font-size:12px;line-height:20px;color:#64748b;">
                    Founder &amp; Developer<br />
                    Project Management System
                </p>

                <p style="margin:18px 0 8px;font-size:12px;font-weight:700;color:#334155;">
                    Also visit
                </p>

                <p style="margin:0 0 7px;font-size:12px;line-height:20px;">
                    <span style="color:#64748b;">Portfolio Website:</span>
                    <a href="https://satinder-portfolio.vercel.app" style="color:#4f46e5;text-decoration:none;">satinder-portfolio.vercel.app</a>
                </p>

                <p style="margin:0;font-size:12px;line-height:20px;">
                    <span style="color:#64748b;">Satinder Poetry:</span>
                    <a href="https://satinderpoetry.com" style="color:#4f46e5;text-decoration:none;">satinderpoetry.com</a>
                </p>
                </td>
            </tr>

            </table>

            <p style="margin:18px 0 0;font-size:11px;line-height:18px;color:#94a3b8;text-align:center;">
            This is an automated notification from Project Management.
            </p>

        </td>
        </tr>
    </table>

    </body>
    </html>
`;
};

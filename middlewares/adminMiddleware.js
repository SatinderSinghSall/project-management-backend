export const requireAdmin = async (req, res, next) => {
  try {
    // Verify the authenticated Clerk user
    const { userId } = await req.auth();

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Read the allowlist from server environment variables
    const adminUserIds = (process.env.ADMIN_USER_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    // Check global administrator access
    if (!adminUserIds.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "Admin access denied",
      });
    }

    // Authorized administrator
    return next();
  } catch (error) {
    console.error("Admin authorization error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

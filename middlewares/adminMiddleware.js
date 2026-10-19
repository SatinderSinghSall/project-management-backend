import prisma from "../configs/prisma.js";

export const requireAdmin = async (req, res, next) => {
  try {
    const { userId } = await req.auth();

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { clerkUserId: userId },
    });

    if (!admin || !admin.isActive) {
      return res.status(403).json({
        message: "Administrator access denied",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Admin authorization error:", error);

    return res.status(500).json({
      message: "Unable to verify administrator access",
    });
  }
};

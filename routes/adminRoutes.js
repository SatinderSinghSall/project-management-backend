import express from "express";
import {
  getAdminOverview,
  getAdminRecords,
  getAdminRecord,
  createAdminRecord,
  updateAdminRecord,
  deleteAdminRecord,
} from "../controllers/adminController.js";
import { requireAdmin } from "../middlewares/adminMiddleware.js";

const adminRouter = express.Router();

adminRouter.use(requireAdmin);

adminRouter.get("/overview", getAdminOverview);
adminRouter.get("/:model", getAdminRecords);
adminRouter.get("/:model/:id", getAdminRecord);
adminRouter.post("/:model", createAdminRecord);
adminRouter.patch("/:model/:id", updateAdminRecord);
adminRouter.delete("/:model/:id", deleteAdminRecord);

export default adminRouter;

import { Router, type IRouter } from "express";
import healthRouter from "./health";
import flavorsRouter from "./flavors";
import caughtRouter from "./caught";
import locationsRouter from "./locations";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(flavorsRouter);
router.use(caughtRouter);
router.use(locationsRouter);
router.use(statsRouter);

export default router;

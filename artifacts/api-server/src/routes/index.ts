import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import techniciansRouter from "./technicians";
import companiesRouter from "./companies";
import serviceOrdersRouter from "./service-orders";
import applicationsRouter from "./applications";
import ratingsRouter from "./ratings";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(techniciansRouter);
router.use(companiesRouter);
router.use(serviceOrdersRouter);
router.use(applicationsRouter);
router.use(ratingsRouter);
router.use(dashboardRouter);

export default router;

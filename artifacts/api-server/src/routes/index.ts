import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import ordersRouter from "./orders";
import storeRouter from "./store";
import colorsRouter from "./colors";

const router: IRouter = Router();

router.use(healthRouter);
router.use(colorsRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(storeRouter);

export default router;

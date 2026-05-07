import { Router } from 'express';
import * as goldController from '../controllers/goldController.js';

const router = Router();

router.get('/prices', goldController.getPrices);
router.get('/prices/history', goldController.getPriceHistory);
router.get('/cities', goldController.getCities);
router.get('/banks', goldController.getBanks);
router.get('/status', goldController.getStatus);
router.post('/refresh', goldController.triggerRefresh);
router.post('/telegram/test', goldController.sendTelegramTest);

export default router;

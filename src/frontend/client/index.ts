import TiamaPong from './game/entities/TiamaPong.js'
import SpaRouter from './SpaRouter.js';

const gameContext: TiamaPong = new TiamaPong();
const router: SpaRouter = new SpaRouter(gameContext);

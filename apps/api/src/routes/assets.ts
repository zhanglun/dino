import { Hono } from 'hono';
import { BlockchainService } from '../services/blockchain';
import { CacheService } from '../services/cache';
import { Asset } from '../models/asset';

const router = new Hono();
const blockchainService = new BlockchainService();
const cacheService = new CacheService();

router.get('/:address', async (c) => {
  const address = c.req.param('address');
  
  try {
    // 尝试从缓存获取数据
    const cachedData = await cacheService.getCachedAssets(address);
    if (cachedData) {
      return c.json(cachedData);
    }
    
    // 获取链上数据
    const assets = await blockchainService.getAddressAssets(address);
    
    // 保存到数据库
    const assetRecord = new Asset({
      address,
      assets,
      totalValue: assets.reduce((sum, asset) => sum + asset.value, 0),
      timestamp: new Date()
    });
    await assetRecord.save();
    
    // 缓存数据
    await cacheService.cacheAssets(address, assets);
    
    return c.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    return c.json({ error: 'Failed to fetch assets' }, 500);
  }
});

export { router as assetsRouter };

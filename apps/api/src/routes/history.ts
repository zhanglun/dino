import { Hono } from 'hono';
import { Asset } from '../models/asset';

const router = new Hono();

router.get('/:address', async (c) => {
  const address = c.req.param('address');
  const days = parseInt(c.req.query('days') || '7');
  
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const history = await Asset.find({
      address,
      timestamp: { $gte: startDate }
    })
    .sort({ timestamp: 1 })
    .select('timestamp totalValue assets');
    
    // 按日期聚合数据
    const dailyData = history.reduce((acc, record) => {
      const date = record.timestamp.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          totalValue: record.totalValue,
          assets: record.assets
        };
      }
      return acc;
    }, {});
    
    return c.json(Object.values(dailyData));
  } catch (error) {
    console.error('Error fetching history:', error);
    return c.json({ error: 'Failed to fetch history' }, 500);
  }
});

export { router as historyRouter };

import { Hono } from 'hono';
import { Wallet } from '../models/wallet';

const router = new Hono();

// 创建钱包
router.post('/', async (c) => {
  try {
    const { address, name, color, emoji } = await c.req.json();
    
    const wallet = new Wallet({
      address,
      name,
      color,
      emoji
    });
    
    await wallet.save();
    return c.json(wallet, 201);
  } catch (error) {
    console.error('Error creating wallet:', error);
    return c.json({ error: 'Failed to create wallet' }, 500);
  }
});

// 获取所有钱包
router.get('/', async (c) => {
  try {
    const wallets = await Wallet.find().sort({ createdAt: -1 });
    return c.json(wallets);
  } catch (error) {
    console.error('Error fetching wallets:', error);
    return c.json({ error: 'Failed to fetch wallets' }, 500);
  }
});

// 更新钱包
router.put('/:address', async (c) => {
  try {
    const address = c.req.param('address');
    const updates = await c.req.json();
    
    const wallet = await Wallet.findOneAndUpdate(
      { address: address.toLowerCase() },
      { $set: updates },
      { new: true }
    );
    
    if (!wallet) {
      return c.json({ error: 'Wallet not found' }, 404);
    }
    
    return c.json(wallet);
  } catch (error) {
    console.error('Error updating wallet:', error);
    return c.json({ error: 'Failed to update wallet' }, 500);
  }
});

// 删除钱包
router.delete('/:address', async (c) => {
  try {
    const address = c.req.param('address');
    const wallet = await Wallet.findOneAndDelete({ address: address.toLowerCase() });
    
    if (!wallet) {
      return c.json({ error: 'Wallet not found' }, 404);
    }
    
    return c.json({ message: 'Wallet deleted successfully' });
  } catch (error) {
    console.error('Error deleting wallet:', error);
    return c.json({ error: 'Failed to delete wallet' }, 500);
  }
});

export { router as walletsRouter };

import { writable } from 'svelte/store';

export interface Wallet {
  address: string;
  name: string;
  color: string;
  emoji: string;
}

export interface Asset {
  token: string;
  symbol: string;
  amount: string;
  value: number;
  chainId: number;
}

interface WalletState {
  wallets: Wallet[];
  currentWallet: Wallet | null;
  assets: Asset[];
}

export const walletStore = writable<WalletState>({
  wallets: [],
  currentWallet: null,
  assets: []
});

// API 调用函数
export async function fetchWallets() {
  try {
    const response = await fetch('/api/wallets');
    const wallets = await response.json();
    walletStore.update(state => ({ ...state, wallets }));
    return wallets;
  } catch (error) {
    console.error('Error fetching wallets:', error);
    throw error;
  }
}

export async function addWallet(wallet: Omit<Wallet, 'id'>) {
  try {
    const response = await fetch('/api/wallets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(wallet)
    });
    const newWallet = await response.json();
    walletStore.update(state => ({
      ...state,
      wallets: [...state.wallets, newWallet]
    }));
    return newWallet;
  } catch (error) {
    console.error('Error adding wallet:', error);
    throw error;
  }
}

export async function updateWallet(address: string, updates: Partial<Wallet>) {
  try {
    const response = await fetch(`/api/wallets/${address}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    const updatedWallet = await response.json();
    walletStore.update(state => ({
      ...state,
      wallets: state.wallets.map(w => 
        w.address === address ? updatedWallet : w
      ),
      currentWallet: state.currentWallet?.address === address 
        ? updatedWallet 
        : state.currentWallet
    }));
    return updatedWallet;
  } catch (error) {
    console.error('Error updating wallet:', error);
    throw error;
  }
}

export async function deleteWallet(address: string) {
  try {
    await fetch(`/api/wallets/${address}`, {
      method: 'DELETE'
    });
    walletStore.update(state => ({
      ...state,
      wallets: state.wallets.filter(w => w.address !== address),
      currentWallet: state.currentWallet?.address === address 
        ? null 
        : state.currentWallet
    }));
  } catch (error) {
    console.error('Error deleting wallet:', error);
    throw error;
  }
}

export async function setCurrentWallet(wallet: Wallet) {
  walletStore.update(state => ({ ...state, currentWallet: wallet }));
  // 加载当前钱包的资产
  try {
    const response = await fetch(`/api/assets/${wallet.address}`);
    const assets = await response.json();
    walletStore.update(state => ({ ...state, assets }));
  } catch (error) {
    console.error('Error fetching assets:', error);
    throw error;
  }
}

import { useState, useEffect } from 'react';
import { useContract, useContractRead, useAddress } from '@thirdweb-dev/react';

const AVAX_DECIMALS = 18;
const MIN_AVAX_REQUIRED = 0.1;

export function useAvaxBalance() {
  const address = useAddress();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkBalance = async () => {
      if (!address) {
        setBalance(null);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://api.avax.network/ext/bc/C/rpc`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_getBalance',
              params: [address, 'latest'],
            }),
          }
        );

        const data = await response.json();
        if (data.result) {
          const balanceInWei = BigInt(data.result);
          const balanceInAvax = Number(balanceInWei) / Math.pow(10, AVAX_DECIMALS);
          setBalance(balanceInAvax);
        }
      } catch (err) {
        setError('Failed to check balance. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    checkBalance();
  }, [address]);

  const hasAccess = balance !== null && balance >= MIN_AVAX_REQUIRED;

  return {
    balance,
    loading,
    error,
    hasAccess,
    minRequired: MIN_AVAX_REQUIRED,
    isConnected: !!address,
  };
}

"use client";

import { useCallback } from "react";
import { useWalletStore } from "@/lib/store/wallet-store";
import { connectWallet, disconnectWallet, openWalletModal, signXdr } from "@/lib/wallet/kit";
import { toGigVaultError } from "@/types/wallet";
import { useToast } from "@/hooks/use-toast";

export function useWallet() {
  const { address, walletId, isConnecting, lastError, setConnecting, setConnected, setError, disconnect } =
    useWalletStore();
  const { toast } = useToast();

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      await openWalletModal(async (selectedWalletId) => {
        try {
          const addr = await connectWallet(selectedWalletId);
          setConnected(addr, selectedWalletId);
          toast({
            title: "Wallet connected",
            description: `${addr.slice(0, 6)}…${addr.slice(-4)} is ready to sign.`,
          });
        } catch (err) {
          const gErr = toGigVaultError(err);
          setError(gErr.message);
          toast({ title: "Couldn't connect wallet", description: gErr.message, variant: "destructive" });
        }
      });
    } catch (err) {
      const gErr = toGigVaultError(err);
      setError(gErr.message);
      toast({ title: "Couldn't connect wallet", description: gErr.message, variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  }, [setConnecting, setConnected, setError, toast]);

  const disconnectAll = useCallback(() => {
    disconnectWallet();
    disconnect();
    toast({ title: "Wallet disconnected" });
  }, [disconnect, toast]);

  // signTransaction is passed down into contract write calls.
  const signTransaction = useCallback(
    async (xdrTx: string) => {
      if (!address) {
        throw toGigVaultError(new Error("No wallet connected"));
      }
      return signXdr(xdrTx, address, walletId);
    },
    [address, walletId]
  );

  return {
    address,
    walletId,
    isConnected: Boolean(address),
    isConnecting,
    lastError,
    connect,
    disconnect: disconnectAll,
    signTransaction,
  };
}

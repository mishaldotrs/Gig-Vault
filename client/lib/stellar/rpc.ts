import {
  Account,
  Address,
  Contract,
  Operation,
  TransactionBuilder,
  BASE_FEE,
  scValToNative,
  xdr,
  rpc,
} from "@stellar/stellar-sdk";
import { NETWORK_PASSPHRASE, RPC_URL } from "./network";
import { GigVaultError, toGigVaultError } from "@/types/wallet";

export const server = new rpc.Server(RPC_URL, { allowHttp: false });

export interface SignFn {
  (xdrTx: string): Promise<{ signedTxXdr: string; signerAddress?: string }>;
}

/**
 * Runs a read-only ("view") contract call by simulating a transaction and
 * decoding the return value. No signature or fee is required.
 */
export async function callView<T = unknown>(
  contractId: string,
  method: string,
  args: xdr.ScVal[] = [],
  sourceAddress?: string
): Promise<T> {
  try {
    // Simulation-only reads don't need a real funded account, so skip the
    // getAccount round-trip entirely when no wallet is connected.
    const source = sourceAddress
      ? await server.getAccount(sourceAddress)
      : new Account(DUMMY_ACCOUNT_ID, "0");

    const contract = new Contract(contractId);
    const tx = new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);

    if (rpc.Api.isSimulationError(sim)) {
      // Route through toGigVaultError so contract error codes get translated.
      throw toGigVaultError(new Error(sim.error));
    }
    if (!sim.result) {
      throw new GigVaultError("SIMULATION_FAILED", "Simulation returned no result");
    }
    return scValToNative(sim.result.retval) as T;
  } catch (err) {
    throw toGigVaultError(err);
  }
}

/**
 * Builds, simulates, signs (via the connected wallet), submits, and polls a
 * state-changing contract call through to completion.
 */
export async function callWrite(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  sourceAddress: string,
  signTransaction: SignFn,
  onStatus?: (status: "building" | "simulating" | "signing" | "submitting" | "pending") => void
): Promise<{ hash: string; returnValue: unknown }> {
  try {
    onStatus?.("building");
    const source = await server.getAccount(sourceAddress);
    const contract = new Contract(contractId);

    let tx = new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(60)
      .build();

    onStatus?.("simulating");
    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) {
      // Route through toGigVaultError so contract error codes get translated.
      throw toGigVaultError(new Error(sim.error));
    }

    const prepared = rpc.assembleTransaction(tx, sim).build();

    onStatus?.("signing");
    const { signedTxXdr } = await signTransaction(prepared.toXDR());
    const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);

    onStatus?.("submitting");
    const sendResult = await server.sendTransaction(signedTx);

    if (sendResult.status === "ERROR") {
      throw new GigVaultError(
        "SIMULATION_FAILED",
        `Transaction rejected by network: ${JSON.stringify(sendResult.errorResult)}`
      );
    }

    onStatus?.("pending");
    const hash = sendResult.hash;
    const result = await pollTransaction(hash);

    let returnValue: unknown = undefined;
    if (result.status === "SUCCESS" && result.resultMetaXdr) {
      returnValue = extractReturnValue(result);
    }
    if (result.status !== "SUCCESS") {
      throw new GigVaultError("UNKNOWN", `Transaction failed on-chain (status: ${result.status})`);
    }

    return { hash, returnValue };
  } catch (err) {
    throw toGigVaultError(err);
  }
}

async function pollTransaction(
  hash: string,
  attempts = 20,
  delayMs = 1500
): Promise<rpc.Api.GetTransactionResponse> {
  for (let i = 0; i < attempts; i++) {
    const res = await server.getTransaction(hash);
    if (res.status !== "NOT_FOUND") return res;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new GigVaultError("UNKNOWN", "Timed out waiting for transaction confirmation");
}

function extractReturnValue(result: rpc.Api.GetSuccessfulTransactionResponse): unknown {
  try {
    // The SDK pre-parses the Soroban return value across meta versions
    // (TransactionMeta v3 pre-Protocol 23, v4 after).
    if (result.returnValue) {
      return scValToNative(result.returnValue);
    }
    const meta = result.resultMetaXdr;
    switch (meta.switch()) {
      case 3: {
        const retval = meta.v3().sorobanMeta()?.returnValue();
        return retval ? scValToNative(retval) : undefined;
      }
      case 4: {
        const retval = meta.v4().sorobanMeta()?.returnValue();
        return retval ? scValToNative(retval) : undefined;
      }
      default:
        return undefined;
    }
  } catch {
    return undefined;
  }
}

export function addressToScVal(address: string): xdr.ScVal {
  return new Address(address).toScVal();
}

// Used only for simulate-as-anonymous-reader calls when no wallet is
// connected yet; Soroban simulation doesn't require the account to be real
// for read paths that don't touch account-specific state. This is the
// StrKey-encoded all-zeros ed25519 key (a valid address that no one owns).
const DUMMY_ACCOUNT_ID = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

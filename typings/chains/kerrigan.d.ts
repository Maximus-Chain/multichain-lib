import { ChainLib, ChainConfig } from '../chain';
import { Transaction } from '../transaction/Transaction';

/**
 * The Kerrigan built-in configuration.
 */
export interface KerriganConfig extends ChainConfig {
  name: 'kerrigan';
  /**
   * `true`. Kerrigan Core still serializes the Evo ("BroodNode")
   * platform fields in `CProRegTx` and rejects an Evo ProRegTx without
   * a `platformNodeID`, so `ProRegTxPayload` (de)serializes
   * `platformNodeID` / `platformP2PPort` / `platformHTTPPort` for
   * `type === 1`.
   */
  proRegTxPlatformFields: true;
}

export type KerriganChainLib = ChainLib<KerriganConfig>;

/**
 * Public re-export of the UTXO shape accepted by
 * `Transaction#from()`. Mirrors the `Transaction.fromObjectParams`
 * namespace type so consumers can import it as a flat alias
 * instead of having to reach into the `Transaction` namespace via
 * `Parameters<InstanceType<typeof Transaction>["from"]>[0]`.
 *
 * @example
 * ```ts
 * import { create } from '@maximus-chain/multichain-lib';
 * import type { TransactionUtxo } from '@maximus-chain/multichain-lib/chains/kerrigan';
 *
 * const { Transaction } = create('kerrigan');
 * const utxos: TransactionUtxo[] = [
 *   { txid: '00…', vout: 0, amount: 0.1, scriptPubKey: '76a914…88ac' },
 * ];
 * new Transaction().from(utxos);
 * ```
 */
export type TransactionUtxo = Transaction.fromObjectParams;

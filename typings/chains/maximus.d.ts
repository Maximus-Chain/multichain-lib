import { ChainLib, ChainConfig } from '../chain';
import { Transaction } from '../transaction/Transaction';

/**
 * The MaximusChain built-in configuration. Importable as a value
 * (for `registerChain('maximus', maximusConfig)`) and as a type (for
 * narrowing `create('maximus')` returns to `MaximusChainLib`).
 */
export interface MaximusConfig extends ChainConfig {
  name: 'maximus';
}

export type MaximusChainLib = ChainLib<MaximusConfig>;

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
 * import type { TransactionUtxo } from '@maximus-chain/multichain-lib/chains/maximus';
 *
 * const { Transaction } = create('maximus');
 * const utxos: TransactionUtxo[] = [
 *   { txid: '00…', vout: 0, amount: 0.1, scriptPubKey: '76a914…88ac' },
 * ];
 * new Transaction().from(utxos);
 * ```
 */
export type TransactionUtxo = Transaction.fromObjectParams;
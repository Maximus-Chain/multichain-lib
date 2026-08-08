import { ChainLib, ChainConfig } from '../chain';
import { Transaction } from '../transaction/Transaction';

/**
 * The Fewbit built-in configuration.
 */
export interface FewbitConfig extends ChainConfig {
  name: 'fewbit';
  /**
   * FewBit's `CProRegTx::CURRENT_VERSION` is `1` (see
   * fewbit-network/Core-Wallet `src/evo/providertx.h`), so the lib
   * defaults `ProRegTxPayload#version` to `1` instead of Dash's `2`.
   */
  payloadVersions: {
    proRegTx: 1;
  };
  /**
   * `true`. FewBit Core rejects any `ProRegTxPayload` whose `type`
   * is not `0` (`MASTERNODE_TYPE_BASIC`). `validate()` mirrors that
   * constraint on the client side.
   */
  enforceMasternodeTypeBasic: true;
}

export type FewbitChainLib = ChainLib<FewbitConfig>;

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
 * import type { TransactionUtxo } from '@maximus-chain/multichain-lib/chains/fewbit';
 *
 * const { Transaction } = create('fewbit');
 * const utxos: TransactionUtxo[] = [
 *   { txid: '00…', vout: 0, amount: 0.1, scriptPubKey: '76a914…88ac' },
 * ];
 * new Transaction().from(utxos);
 * ```
 */
export type TransactionUtxo = Transaction.fromObjectParams;

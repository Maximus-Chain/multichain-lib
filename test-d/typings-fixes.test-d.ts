// tsd tests for the typing fixes in Part 2 of docs/pending/changes.md.
//
// Each block documents an issue (#1..#7) and asserts the type-level
// behaviour the fix is supposed to enable. None of these assertions
// need to run at runtime — tsd only checks that the types compile.

import { expectAssignable } from 'tsd';
import { Buffer } from 'buffer';
import { create } from '..';
import type { AbstractPayload } from '../typings/transaction/payload/AbstractPayload';
import type { Script } from '../typings/script/Script';
import type { Transaction } from '../typings/transaction/Transaction';

const lib = create('maximus');
const ScriptCtor = lib.Script;
const TransactionCtor = lib.Transaction;
const ProRegTxPayloadCtor = lib.ProRegTxPayload;
const PrivateKeyCtor = lib.PrivateKey;
const AddressCtor = lib.Address;

const pk = new PrivateKeyCtor('livenet');
const pub = pk.toPublicKey();
const someAddr = new AddressCtor('mwkF5t6NTHgv4ZkcKsT3Y5T1cv7MxeRTvG', 'livenet');

// --- Issue #1: Script.toBuffer() and Script.toHex() are now typed ---

const multisig = ScriptCtor.buildMultisigOut([pub], 1);
const _scriptBuf: Buffer = multisig.toBuffer();
const _scriptHex: string = multisig.toHex();

// --- Issue #2: ProRegTxPayload extends AbstractPayload ---

const payload = new ProRegTxPayloadCtor();
expectAssignable<AbstractPayload>(payload);

// Inherited methods are callable via the base type.
const _payloadHash: Buffer = (payload as AbstractPayload).getHash({
  skipSignature: false,
});
const _payloadSig: AbstractPayload = (payload as AbstractPayload).sign(
  '00'.repeat(32)
);

// --- Issue #3: Script.fromAddress accepts Address | string ---

const _fromAddr: Script = ScriptCtor.fromAddress(someAddr);
const _fromStr: Script = ScriptCtor.fromAddress(
  'mwkF5t6NTHgv4ZkcKsT3Y5T1cv7MxeRTvG'
);

// --- Issue #4: Transaction.fromObjectParams accepts txid/vout aliases ---

const tx = new TransactionCtor(undefined);

// bitcoind listunspent format
expectAssignable<Transaction.fromObjectParams>({
  txid: '00'.repeat(32),
  vout: 0,
  amount: 0.1,
  scriptPubKey: '76a914' + '00'.repeat(20) + '88ac',
});

// library canonical format
expectAssignable<Transaction.fromObjectParams>({
  txId: '00'.repeat(32),
  outputIndex: 0,
  satoshis: 1000,
  script: '76a914' + '00'.repeat(20) + '88ac',
});

// legacy prevTxId format
expectAssignable<Transaction.fromObjectParams>({
  prevTxId: '00'.repeat(32),
  outputIndex: 0,
  satoshis: 1000,
  script: '76a914' + '00'.repeat(20) + '88ac',
});

// from() accepts each format without casts.
tx.from({
  txid: '00'.repeat(32),
  vout: 0,
  amount: 0.1,
  scriptPubKey: '76a914' + '00'.repeat(20) + '88ac',
});
tx.from({
  txId: '00'.repeat(32),
  outputIndex: 0,
  satoshis: 1000,
  script: '76a914' + '00'.repeat(20) + '88ac',
});

// --- Issue #5: Address.isValid accepts an optional type parameter ---

const _ok: boolean = AddressCtor.isValid(
  'mwkF5t6NTHgv4ZkcKsT3Y5T1cv7MxeRTvG',
  'livenet'
);

// Optional 3rd arg still works.
const _okWithType: boolean = AddressCtor.isValid(
  'mwkF5t6NTHgv4ZkcKsT3Y5T1cv7MxeRTvG',
  'livenet',
  AddressCtor.PayToPublicKeyHash
);

// --- Issue #7: TransactionUtxo is re-exported from each chain subpath ---

import type { TransactionUtxo as MaximusUtxo } from '../typings/chains/maximus';
import type { TransactionUtxo as OsmiumUtxo } from '../typings/chains/osmium';

// Same shape as `Transaction.fromObjectParams`.
expectAssignable<Transaction.fromObjectParams>(
  {} as MaximusUtxo
);
expectAssignable<Transaction.fromObjectParams>(
  {} as OsmiumUtxo
);

// Usable as the array element of `Transaction#from()`.
const _utxos: MaximusUtxo[] = [];
new TransactionCtor(undefined).from(_utxos);
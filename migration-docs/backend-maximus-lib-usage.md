# maximus-lib Usage Inventory

> Generated: 2026-06-17
> Source: `src/` directory

## Summary

| Export | Type | Files | Usage Count |
|--------|------|-------|-------------|
| `Unit` | Class | 11 | 30+ |
| `Transaction` | Class | 3 | 15+ |
| `HDPublicKey` | Class | 2 | 3 |
| `Address` | Class | 3 | 4 |
| `Script` | Class | 2 | 5 |
| `Message` | Class | 1 | 2 |
| `PublicKey` | Class | 1 | 2 |
| `ProRegTxPayload` | Class | 1 | 20+ |

**Total: 17 files using maximus-lib**

---

## Detailed Usage by File

### 1. `lib/rpc/writeWalletService.ts`

**Imports:** `Transaction`, `Unit`

| Usage | Description |
|-------|-------------|
| `Unit.fromBTC(tx.amount).toSatoshis()` | Convert RPC amounts (BTC) to satoshis |
| `Unit.fromSatoshis(amount).toBTC()` | Convert satoshis back to BTC for display |
| `new Transaction(undefined)` | Create empty transaction |
| `tx.from(utxos)` | Add UTXOs as inputs |
| `tx.to(address, satoshis)` | Add output destination |
| `tx.change(address)` | Set change address |
| `tx.feePerKb(MIN_FEE_SATOSHIS)` | Set fee rate |
| `tx.serialize({ disableIsFullySigned: true })` | Serialize to hex |
| `tx.toObject()` | Convert to plain object |
| `tx.getFee()` | Get calculated fee |
| `tx.inputAmount` | Access input amount |

---

### 2. `lib/rpc/proRegTxBuilder.ts`

**Imports:** `Transaction`, `Address`, `Script`, `ProRegTxPayload`

| Usage | Description |
|-------|-------------|
| `new Transaction(undefined)` | Create transaction for ProRegTx |
| `tx.from(utxos, publicKeys, threshold)` | Add multisig inputs |
| `tx.to(address, satoshis)` | Add collateral output |
| `tx.change(address)` | Set change address |
| `tx.feePerKb(MIN_FEE_SATOSHIS)` | Set fee |
| `tx.version = 3` | Set transaction version |
| `tx.type = 1` | Set transaction type |
| `tx.setExtraPayload(payload)` | Attach ProRegTx payload |
| `tx.serialize({ disableIsFullySigned: true })` | Serialize |
| `tx.toObject()` | Convert to object for DB storage |
| `new Address(address, network)` | Parse address |
| `addr.hashBuffer.toString("hex")` | Extract key ID |
| `Script.fromAddress(addr)` | Get script from address |
| `script.toBuffer().toString("hex")` | Serialize script |
| `new ProRegTxPayload()` | Create ProRegTx payload |
| `payload.version`, `payload.type`, `payload.mode` | Set payload fields |
| `payload.collateralHash`, `payload.collateralIndex` | Collateral info |
| `payload.service` | Service address (ip:port) |
| `payload.keyIDOwner`, `payload.keyIDVoting` | Key IDs |
| `payload.pubKeyOperator` | BLS operator key |
| `payload.operatorReward` | Operator reward % |
| `payload.scriptPayout` | Payout script hex |
| `payload.inputsHash` | Inputs hash |
| `payload.toBuffer({ skipSignature: true })` | Serialize payload |

---

### 3. `lib/rpc/readWalletService.ts`

**Imports:** `Unit`

| Usage | Description |
|-------|-------------|
| `Unit.fromBTC(tx.amount).toSatoshis()` | Convert RPC amounts to satoshis |

---

### 4. `lib/crypto/multisigGenerator.ts`

**Imports:** `HDPublicKey`, `Address`, `Script`, `PublicKey`

| Usage | Description |
|-------|-------------|
| `new HDPublicKey(xpub)` | Parse extended public key |
| `hdPublicKey.deriveChild(path, false)` | Derive child key (non-hardened) |
| `derivedPublicKey.publicKey` | Get PublicKey from derived key |
| `Script.buildMultisigOut(publicKeys, threshold)` | Build 2-of-3 redeem script |
| `new Script(Buffer)` | Create Script from hex |
| `script.toScriptHashOut()` | Get P2SH scriptPubKey |
| `Address.payingTo(script, network)` | Generate address from script |

---

### 5. `lib/crypto/xpubValidator.ts`

**Imports:** `HDPublicKey`

| Usage | Description |
|-------|-------------|
| `new HDPublicKey(xpub)` | Validate xpub structure |
| `hdPublicKey.deriveChild(testPath, false)` | Test derivation path |

---

### 6. `lib/crypto/addressValidator.ts`

**Imports:** `Address`

| Usage | Description |
|-------|-------------|
| `Address.isValid(addr, "livenet")` | Validate MAXI addresses |
| `Address.isValid(addr, "testnet")` | Validate TMAXI addresses |

---

### 7. `lib/crypto/messageSigner.ts`

**Imports:** `Message`

| Usage | Description |
|-------|-------------|
| `Message.fromString(message)` | Parse message string |
| `msg.verify(address, signature)` | Verify message signature |

---

### 8. `core/events/rpc.handler.ts`

**Imports:** `Transaction`

| Usage | Description |
|-------|-------------|
| `new Transaction(partiallySignedJson)` | Deserialize transaction |
| `tx.serialize()` | Serialize for broadcast |

---

### 9. `services/notificationService.ts`

**Imports:** `Unit`

| Usage | Description |
|-------|-------------|
| `Unit.fromSatoshis(satoshis).toBTC()` | Format amounts for notifications |

---

### 10. `services/sharedNodes/vaultService.ts`

**Imports:** `Unit`

| Usage | Description |
|-------|-------------|
| `Unit.fromBTC(balance).toSatoshis()` | Convert vault balances |

---

### 11. `tasks/refillWithdrawAddress.ts`

**Imports:** `Unit`

| Usage | Description |
|-------|-------------|
| `Unit.fromBTC(amount).toSatoshis()` | Convert withdrawal amounts |
| `Unit.fromSatoshis(satoshis).toBTC()` | Format for logging |
| Multiple conversion operations for balance calculations |

---

### 12. `tasks/processWithdrawals.ts`

**Imports:** `Unit`

| Usage | Description |
|-------|-------------|
| `Unit.fromBTC(amount).toSatoshis()` | Convert amounts for processing |
| `Unit.fromSatoshis(total).toBTC()` | Format for logging |

---

### 13. `tasks/sweepDeposits.ts`

**Imports:** `Unit`

| Usage | Description |
|-------|-------------|
| `Unit.fromBTC(amount).toSatoshis()` | Convert sweep amounts |
| `Unit.fromSatoshis(amount).toBTC()` | Calculate splits |

---

### 14. `tasks/distributeRewards.ts`

**Imports:** `Unit`

| Usage | Description |
|-------|-------------|
| `Unit.fromBTC(balance).toSatoshis()` | Convert cold/hot balances |
| `Unit.fromSatoshis(satoshis).toBTC()` | Format for DB storage |

---

### 15. `tasks/createAndSubmitProTx.ts`

**Imports:** `Unit`

| Usage | Description |
|-------|-------------|
| `Unit.fromBTC(collateral_required).toSatoshis()` | Convert collateral amount |

---

### 16. `tasks/checkBalanceAndDeployNode.ts`

**Imports:** `Unit`

| Usage | Description |
|-------|-------------|
| `Unit.fromBTC(collateral_required).toSatoshis()` | Convert required collateral |

---

### 17. `lib/queries/createWithdrawalRequest.ts`

**Imports:** `Unit`

| Usage | Description |
|-------|-------------|
| `Unit.fromBTC(amount).toSatoshis()` | Convert withdrawal amount |
| `Unit.fromBTC(fee).toSatoshis()` | Convert fee amount |
| `Unit.fromSatoshis(satoshis).toBTC()` | Convert back for DB |

---

## API Reference

### Unit

```typescript
// Conversions
Unit.fromBTC(number) → Unit
Unit.fromSatoshis(number) → Unit
unit.toBTC() → number
unit.toSatoshis() → number
```

### Transaction

```typescript
// Creation
new Transaction(undefined)
new Transaction(object)  // from serialized

// Building
tx.from(utxos)
tx.from(utxos, publicKeys?, threshold?)  // multisig
tx.to(address, satoshis)
tx.change(address)
tx.feePerKb(satoshis)
tx.version = number
tx.type = number

// Serialization
tx.serialize({ disableIsFullySigned: boolean })
tx.toObject()
tx.getFee()
tx.inputAmount

// Special transactions
tx.setExtraPayload(ProRegTxPayload)
```

### HDPublicKey

```typescript
new HDPublicKey(xpubString)
hdPublicKey.deriveChild(path, isHardened)
hdPublicKey.publicKey → PublicKey
```

### Address

```typescript
new Address(addressString, network?)
Address.isValid(address, network) → boolean
Address.payingTo(script, network) → Address
addr.hashBuffer → Buffer
```

### Script

```typescript
Script.buildMultisigOut(publicKeys[], threshold) → Buffer
Script.fromAddress(address) → Script
script.toScriptHashOut() → Buffer
script.toBuffer() → Buffer
```

### Message

```typescript
Message.fromString(message) → Message
msg.verify(address, signature) → boolean
```

### PublicKey

```typescript
publicKey.toBuffer() → Buffer
```

### ProRegTxPayload

```typescript
new ProRegTxPayload()
payload.version = number
payload.type = number
payload.mode = number
payload.collateralHash = string
payload.collateralIndex = number
payload.service = string  // "ip:port"
payload.keyIDOwner = string  // 20 bytes hex
payload.pubKeyOperator = string  // 48 bytes hex
payload.keyIDVoting = string  // 20 bytes hex
payload.operatorReward = number  // 0-10000
payload.scriptPayout = string  // hex
payload.inputsHash = string
payload.toBuffer({ skipSignature?: boolean }) → Buffer
payload.toJSON({ skipSignature?: boolean }) → object
```

---

## Type Declarations

File: `types/maximus-lib-payload.d.ts`

Custom module declaration for `maximus-lib/lib/transaction/payload` since the library doesn't export it from the main index.

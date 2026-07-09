# maximus-lib Usage Report

**Library:** `@maximus-chain/maximus-lib`
**Generated:** 2026-06-17
**Path:** `/home/midefos/repos/website/src/`

---

## 1. Componentes de la Librería

| Componente | Tipo | Descripción | Archivos | Usos Totales |
|------------|------|-------------|----------|--------------|
| `HDPrivateKey` | Clase | HD key derivation from seed or xprv | chainConfig.ts, multisigSigner.ts, crypto.ts, wallet.ts | ~8 |
| `Mnemonic` | Clase | Mnemonic validation and seed generation | chainConfig.ts, crypto.ts, wallet.ts | ~6 |
| `Transaction` | Clase | Transaction creation and signing | multisigSigner.ts | ~2 |
| `PrivateKey` | Clase | Private key handling for signing | multisigSigner.ts | ~2 |
| `Script` | Clase | Convert script hex to address | transactionDeserializer.ts | ~2 |
| `Unit` | Clase | Format satoshis to BTC string | transactionDeserializer.ts | ~2 |
| `Networks` | Objeto/Enum | Network configuration (livenet/testnet) | maximusLib.ts, chainConfig.ts | ~3 |
| `setNetwork` | Función | Set active network | maximusLib.ts, chainConfig.ts | ~2 |
| `Network` | Tipo | Network type ('mainnet' \| 'testnet') | maximusLib.ts, bip44.ts, wallet.ts | ~6 |
| `defaultNetwork` | Variable | Default network reference | maximusLib.ts | ~1 |

---

## 2. Archivos que Usan maximus-lib

### 2.1 `src/utils/maximusLib.ts`
**Propósito:** Wrapper central con caching para acceder a la librería

| Export | Tipo | Descripción |
|--------|------|-------------|
| `Network` | Tipo | `'testnet' \| 'mainnet'` |
| `getMaximusLib(network?: Network)` | Función | Carga y cachea la librería dinámicamente |
| `isLibCached(network?: Network)` | Función | Verifica si la librería está en cache |
| `clearCache()` | Función | Limpia el cache de la librería |

**Internals:**
- Dynamic import de `@maximus-chain/maximus-lib`
- Accede a: `HDPrivateKey`, `Networks`, `setNetwork`, `defaultNetwork`

---

### 2.2 `src/utils/chainConfig.ts`
**Propósito:** Sistema de configuración multi-chain

**Dynamic Import:**
```typescript
const maxlib = await import('@maximus-chain/maximus-lib')
```

**Componentes usados:**
| Componente | Línea | Uso |
|------------|-------|-----|
| `HDPrivateKey` | 70-82 | Verifica `maxlib.default?.HDPrivateKey` |
| `Networks.livenet` | 73 | Acceso a red livenet |
| `setNetwork('livenet')` | 78 | Establece red activa |
| `Mnemonic` | - | Configuración MAXI chain |

**Interfaces:**
```typescript
interface HDPrivateKey { ... }
interface Networks { livenet: unknown, testnet: unknown }
```

---

### 2.3 `src/utils/transactionDeserializer.ts`
**Propósito:** Parsea transaction JSON y extrae datos

**Import:**
```typescript
import { getMaximusLib } from './maximusLib'
```

**Usos:**
| Componente | Líneas | Código |
|------------|--------|--------|
| `Unit` | 64-69 | `new Unit(satoshis).toBTC()` - Convierte satoshis a BTC |
| `Script` | 101-107 | `new Script(script).toAddress(networkName)` - Convierte hex a address |

---

### 2.4 `src/utils/multisigSigner.ts`
**Propósito:** Firma transacciones multisig

**Import:**
```typescript
import { getMaximusLib, type Network } from './maximusLib'
```

**Usos:**
| Componente | Líneas | Propósito |
|------------|--------|-----------|
| `Transaction` | 37-39, 81 | Crear y firmar transacciones |
| `PrivateKey` | 40-47 | Manejo de claves privadas para firma |
| `HDPrivateKey` | 48-59, 80 | Derivation de claves HD desde xprv |

**Patrón de uso:**
```typescript
const HDPrivateKey = (lib as Record<string, unknown>).HDPrivateKey
const hdWallet = new HDPrivateKey(xprv)
const tx = new Transaction(baseJson)
tx.sign(derivedKey.privateKey)
```

---

### 2.5 `src/utils/crypto.ts`
**Propósito:** Utilidades criptográficas para encriptación/desencriptación de wallet

**Import:**
```typescript
import type { Network } from './maximusLib'
```

**Usos:**
| Función | Componentes | Propósito |
|---------|-------------|-----------|
| `deriveXprivFromMnemonic()` | `Mnemonic`, `HDPrivateKey.fromSeed()` | Derivar xpriv desde mnemonic |
| `deriveAddress()` | `HDPrivateKey` | Derivar direcciones desde xprv o mnemonic |
| `getXpub()` | `HDPrivateKey` | Obtener extended public keys |

---

### 2.6 `src/utils/bip44.ts`
**Propósito:** Utilidades para paths de derivación BIP44

**Import:**
```typescript
import type { Network } from './maximusLib'
```

**Funciones que usan `Network`:**
- `getBip44CoinType(chainSymbol: string, network: Network)`
- `getBip44Path(network: Network, index: number, chainSymbol: string)`
- `getXpubPath(network: Network, chainSymbol: string)`
- `getFullAddressPath(network: Network, addressIndex: number, chainSymbol: string, change: number)`

---

### 2.7 `src/boot/maximusLib.ts`
**Propósito:** Pre-cargar maximus-lib al iniciar la app

**Import:**
```typescript
import { getMaximusLib } from 'src/utils/maximusLib'
```

**Uso:**
```typescript
const lib = await getMaximusLib()
// Log available classes for debugging
```

---

### 2.8 `src/stores/wallet.ts`
**Propósito:** Estado de wallet multi-chain

**Import:**
```typescript
import type { Network } from '../utils/maximusLib'
```

**Funciones usando componentes de maximus-lib:**
| Función | Líneas | Componentes |
|---------|--------|-------------|
| `deriveKeysFromSeed()` | 103-129 | `Mnemonic`, `HDPrivateKey.fromSeed()` |
| `getCurrentXpriv()` | 328-354 | `Mnemonic`, `HDPrivateKey` |
| `getChainXpriv()` | 385-411 | `Mnemonic`, `HDPrivateKey` |

---

## 3. Detalle de Tipos Definidos Localmente

### `src/utils/maximusLib.ts`
```typescript
type Network = 'testnet' | 'mainnet'

interface MaximusLib {
  HDPrivateKey: new (xprv: string) => HDKeyInstance
  Mnemonic: new (phrase?: string) => MnemonicInstance
  Networks: { livenet: unknown, testnet: unknown }
  Transaction: new (obj?: unknown) => TransactionInstance
  PrivateKey: new (key?: unknown) => PrivateKeyInstance
  Unit: new (satoshis: number) => { toBTC(): string }
  Script: new (script: unknown) => { toAddress(network: string): string }
  setNetwork: (network: string) => void
  defaultNetwork: string
}
```

---

## 4. Arquitectura de Dependencias

```
maximus-lib (@maximus-chain/maximus-lib)
         │
         ▼
┌─────────────────────┐
│   maximusLib.ts     │ ◄── Wrapper central con caching
└─────────────────────┘
         │
    ┬────┴────┬──────────────┬──────────────┐
    ▼         ▼              ▼              ▼
chainConfig  transaction   multisigSigner   crypto
              deserializer     │              │
                              │              │
                         boot/           stores/
                       maximusLib.ts    wallet.ts
                                            │
                                       bip44.ts (Network type)
```

---

## 5. Resumen Estadístico

| Métrica | Valor |
|---------|-------|
| Total archivos usando maximus-lib | 8 |
| Total componentes de librería usados | 10 |
| Total tipos/typedefs definidos | 1 |
| Dynamic imports | 1 |
| Imports desde wrapper | 2 |

---

## 6. Imports Identificados

### Dynamic Import
```typescript
// src/utils/chainConfig.ts:69
const maxlib = await import('@maximus-chain/maximus-lib')
```

### Imports desde Wrapper
```typescript
// src/utils/maximusLib.ts ( exports )
export { Network, getMaximusLib, isLibCached, clearCache }

// src/utils/transactionDeserializer.ts:6
import { getMaximusLib } from './maximusLib'

// src/utils/multisigSigner.ts:1
import { getMaximusLib, type Network } from './maximusLib'

// src/utils/crypto.ts:7
import type { Network } from './maximusLib'

// src/utils/bip44.ts:11
import type { Network } from './maximusLib'

// src/boot/maximusLib.ts:7
import { getMaximusLib } from 'src/utils/maximusLib'

// src/stores/wallet.ts:13
import type { Network } from '../utils/maximusLib'
```

---

## 7. Métodos de Componentes Usados

### HDPrivateKey
- `new HDPrivateKey(xprv)` - Constructor desde xprv
- `HDPrivateKey.fromSeed(seed, network?)` - Crear desde seed
- `.deriveChild(path, hardened)` - Derivar hijo
- `.privateKey` - Acceder a clave privada derivada

### Mnemonic
- `new Mnemonic(phrase?)` - Constructor
- `.toSeed()` - Generar seed

### Transaction
- `new Transaction(obj)` - Constructor
- `.sign(key)` - Firmar transacción

### PrivateKey
- `new PrivateKey(key?)` - Constructor

### Script
- `new Script(script)` - Constructor
- `.toAddress(network)` - Convertir a address

### Unit
- `new Unit(satoshis)` - Constructor
- `.toBTC()` - Convertir a BTC string

### Networks
- `Networks.livenet` - Red principal
- `Networks.testnet` - Red de pruebas

### setNetwork
- `setNetwork('livenet' | 'testnet')` - Establecer red activa

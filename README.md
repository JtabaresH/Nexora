# Nexora Wallet — World Mini App

Nexora es una **Mini App mobile-first para el ecosistema World App**, diseñada como una **wallet Web3 moderna, minimalista y centrada en la experiencia de usuario** para visualizar, enviar y recibir tokens fungibles (ERC-20) y coleccionables digitales (NFTs ERC-721 y ERC-1155).

Inspirada en las mejores interfaces de banca digital y galerías NFT, Nexora abstrae conceptos técnicos como gas, ABIs y llamadas RPC para ofrecer una interacción fluida y segura dentro de World App.

---

## 🚀 Características Principales

### 1. Autenticación e Integración Oficial con World App
* **SDK Oficial**: Utiliza `@worldcoin/minikit-js` (MiniKit v2).
* **Sign-In with Ethereum (SIWE)**: Autenticación mediante `MiniKit.walletAuth()` con validación de nonces y verificación de identidad humana de World ID.
* **Transacciones Patrocinadas**: Envío directo a través del puente nativo `MiniKit.sendTransaction()` en World Chain, aprovechando el gas patrocinado para usuarios verificados.
* **Detección Automática de Entorno**: Detecta si se ejecuta dentro del webview de World App o en un navegador estándar.

### 2. Gestión de Tokens (Fungibles / ERC-20)
* Soporte nativo para **WLD (Worldcoin)**, **USDC**, **ETH** y tokens ERC-20 compatibles.
* Visualización de balances en tiempo real con precisión decimal completa.
* Precios y valoración en USD estimada (`$1,248.32`).
* Manejo explícito del estado **"Price unavailable"** cuando no hay cotización disponible.
* Botón de acceso directo para transferir cada token.

### 3. Galería de NFTs Agrupados por Colección (Consideración #2)
* **Agrupación Automática por Colección**: Los coleccionables se agrupan ordenadamente bajo su colección (ej. *Cyber World*, *Orb Artifacts*, *Nexora Ecosystem*) con contador de piezas.
* **Filtros por Colección**: Barra de pestañas horizontal para filtrar por colección con un toque.
* **Soporte ERC-721**: Imágenes de alta resolución, nombre, token ID, propietario, contrato y atributos.
* **Soporte ERC-1155**: Manejo de multi-edición con badges de cantidad disponible (`Quantity: 4`) y selector de cantidad a transferir.
* **Modal de Detalle Completo**: Atributos, red, contrato, propietario y botón directo "Send NFT".

### 4. Flujo de Envío ("Send Transaction" - Consideración #1)
* **Paso 1 - Selección de Tipo**: Selector visual entre Tokens o NFTs.
* **Paso 2 - Formulario Validado**:
  * Validación estricta con **Zod** y **Viem** para direcciones (`isAddress`), cantidades mayores a cero y balance suficiente.
  * Botón **MAX** para tokens.
  * Selector de cantidad para ERC-1155 hasta el balance disponible.
  * Botón para pegar direcciones desde el portapapeles.
* **Paso 3 - Pantalla de Confirmación**:
  * Resumen claro del activo, cantidad, destinatario y red.
  * Información de comisión (*"Sponsored by World App"* en World Chain).
* **Paso 4 - Máquina de Estados en Vivo**:
  * **Pending**: Anillo pulsante y feedback de espera.
  * **Success**: Animación de confeti, confirmación y enlace directo al explorador de bloques.
  * **Error**: Mensajes humanizados para transacciones rechazadas o fondos insuficientes.

### 5. Pantalla de Recepción (Receive)
* Código QR de alto contraste generado con SVG.
* Dirección abreviada y completa con copiado en 1 clic.
* Integración con la **Web Share API** para compartir fácilmente.
* Aviso de seguridad para activos compatibles con World Chain.

### 6. Historial de Actividad (Activity)
* Registro detallado de transferencias y recepciones con badges de estado:
  * `CONFIRMED` (Verde)
  * `PENDING` (Ámbar con animación en vivo)
  * `FAILED` (Rojo con motivo de reversión)
* Filtros rápidos: **All**, **Tokens**, **NFTs**, **Sent**, **Received**.
* Modal de detalle con hash de transacción, bloque, fecha y enlace a **Worldscan**.

### 7. Demo Mode Interactivo
* **Switch en Tiempo Real**: Accesible desde el banner superior y en la pestaña Settings.
* Permite explorar y probar toda la interfaz, enviar tokens y transferir NFTs con datos simulados y confirmación realista sin costo ni riesgo.
* Código de mock completamente desacoplado de la capa blockchain real.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router) + React 19 |
| **Lenguaje** | TypeScript 5 (Type-Safe con target ES2022) |
| **Estilos** | Tailwind CSS v4 + Vanilla CSS Design Tokens (Dark Obsidian UI) |
| **World App SDK** | `@worldcoin/minikit-js` (v2) |
| **Web3 / Blockchain** | `viem` |
| **Data Fetching / Cache** | `@tanstack/react-query` |
| **Validación** | `zod` |
| **Iconografía** | `lucide-react` |
| **QR Code** | `qrcode.react` |
| **Testing** | `vitest` |

---

## 📁 Arquitectura del Proyecto

```text
src/
├── app/
│   ├── globals.css              # Sistema de diseño, temas y animaciones
│   ├── layout.tsx               # Providers globales y contenedor mobile-first
│   └── page.tsx                 # Vista principal y control de navegación
├── components/
│   ├── activity/                # Componentes de historial de transacciones
│   │   ├── TransactionDetailModal.tsx
│   │   ├── TransactionItem.tsx
│   │   └── TransactionList.tsx
│   ├── common/                  # Componentes reutilizables
│   │   ├── AddressDisplay.tsx   # Truncado y copiado de direcciones
│   │   ├── EmptyState.tsx       # Estados vacíos ilustrados
│   │   ├── ErrorState.tsx       # Estados de error con reintento
│   │   ├── LoadingState.tsx     # Skeletons para tokens, NFTs y transacciones
│   │   ├── Modal.tsx            # Bottom sheet responsive
│   │   ├── NetworkBadge.tsx     # Selector e indicador de red
│   │   └── QRCodeDisplay.tsx    # Generador QR
│   ├── layout/                  # Estructura visual de la Mini App
│   │   ├── AppHeader.tsx        # Identidad, avatar y selector de red
│   │   ├── BottomNav.tsx        # Navegación inferior con botón Send/Receive
│   │   ├── DemoBanner.tsx       # Banner de control de Demo Mode
│   │   └── MobileContainer.tsx  # Contenedor de 360-430px optimizado para mobile
│   ├── nfts/                    # Galería visual de NFTs
│   │   ├── CollectionGroup.tsx  # Agrupación por colección
│   │   ├── NFTCard.tsx          # Card para ERC-721 y ERC-1155
│   │   ├── NFTDetailModal.tsx   # Vista de detalle con atributos y metadatos
│   │   └── NFTGrid.tsx          # Galería con filtros por colección
│   ├── receive/
│   │   └── ReceiveModal.tsx     # Pantalla de recepción con QR y compartir
│   ├── send/                    # Flujo completo de envío
│   │   ├── ConfirmTransactionModal.tsx
│   │   ├── SendModal.tsx
│   │   ├── SendNFTForm.tsx
│   │   └── SendTokenForm.tsx
│   ├── settings/
│   │   └── SettingsView.tsx     # Diagnósticos MiniKit y selector de red
│   └── wallet/
│       └── PortfolioCard.tsx    # Tarjeta de balance total y accesos rápidos
├── config/
│   ├── contracts.ts             # Direcciones verificadas de contratos en World Chain
│   └── networks.ts              # World Chain Mainnet (480), Sepolia (4801) y OP
├── context/
│   ├── DemoModeContext.tsx      # Gestión de estado Demo vs Live
│   ├── NetworkContext.tsx       # Gestión de red activa
│   ├── QueryProvider.tsx        # TanStack Query client
│   └── WalletContext.tsx        # Integración con MiniKit y sesión Web3
├── contracts/
│   ├── abis/                    # ABIs mínimas para ERC-20, ERC-721 y ERC-1155
│   └── encoder.ts               # Codificador de calldata con Viem
├── hooks/
│   ├── useNFTs.ts               # Fetch y agrupación de NFTs por colección
│   ├── useTokens.ts             # Fetch y balance de tokens fungibles
│   └── useTransactions.ts       # Historial de transacciones con filtros
├── services/
│   ├── assets/                  # Abstracción AssetProvider (Mock / On-chain)
│   ├── blockchain/              # Cliente Viem para lecturas y utilidades
│   ├── metadata/                # Resuelve IPFS, Arweave y fallbacks SVG
│   ├── pricing/                 # Estimación de precios USD y formateo
│   └── world/                   # Integración con World MiniKit (walletAuth / sendTransaction)
├── types/                       # Interfaces TypeScript tipo-seguras
└── utils/
    └── validation.ts            # Esquemas Zod para direcciones y montos
test/                            # Suite completa de pruebas unitarias
```

---

## 🌐 Redes Soportadas

1. **World Chain Mainnet** (Chain ID: `480`)
   * RPC: `https://worldchain-mainnet.g.alchemy.com/public`
   * Explorador: [Worldscan](https://worldscan.org)
   * Moneda Nativa: ETH
2. **World Chain Sepolia Testnet** (Chain ID: `4801`)
   * RPC: `https://worldchain-sepolia.g.alchemy.com/public`
   * Explorador: [Worldscan Sepolia](https://sepolia.worldscan.org)
   * Moneda Nativa: Sepolia ETH
3. **OP Mainnet** (Chain ID: `10`)
   * Explorador: [Optimism Etherscan](https://optimistic.etherscan.io)

---

## 🔒 Consideraciones de Seguridad

* **Sin almacenamiento de llaves privadas**: No se solicitan, manejan ni almacenan seed phrases ni private keys.
* **Firmas Transparentes**: Cada transacción muestra de forma explícita el contrato objetivo, el destinatario y la cantidad antes de delegar la firma a World App.
* **Validación de Entradas**: Verificación criptográfica con Zod y Viem para evitar transacciones a direcciones no válidas o montos negativos.
* **Sanitización de Metadatos**: El servicio `MetadataService` rechaza esquemas peligrosos (`javascript:`, `vbscript:`) y genera imágenes SVG procedurales seguras en caso de URLs rotas.

---

## 🧪 Pruebas Unitarias e Integración

El proyecto incluye pruebas automatizadas con **Vitest**:

```bash
npm test
```

### Cobertura de Pruebas:
* `test/validation.test.ts`: Validación de direcciones EVM (World Chain), formato de montos positivos y enteros para ERC-1155.
* `test/contracts.test.ts`: Codificación precisa de selectores de función para ERC-20 (`0xa9059cbb`), ERC-721 (`0x42842e0e`) y ERC-1155 (`0xf242432a`).
* `test/metadata.test.ts`: Resolución de pasarelas IPFS (`ipfs://`), Arweave (`ar://`), sanitización y fallbacks SVG.
* `test/assets.test.ts`: Agrupación correcta de NFTs por colección y cálculo de valoraciones USD.
* `test/siwe.test.ts`: Generación de nonce criptográfico, formateo de mensaje SIWE con RP ID y firma/verificación criptográfica.

---

## 🔑 Variables de Entorno (World App Credentials)

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# World App MiniKit Configuration
NEXT_PUBLIC_APP_ID=app_58fcaf4e2fdc019a1f6219064ee9c5e4
NEXT_PUBLIC_RP_ID=rp_5b67fb974cb00239
WORLD_RP_ID=rp_5b67fb974cb00239

# Signer Credentials (Dev / World Chain)
DEV_SIGNER_PRIVATE_KEY=0x1bf82ed7611b74c3bff07f72c3191c5cfd94b779517edcf119ba38ffdfeee56d
DEV_SIGNER_ADDRESS=0x3D5995Eb27fb94c9b2E6356A14ba5F3503904707
NEXT_PUBLIC_SIGNER_ADDRESS=0x3D5995Eb27fb94c9b2E6356A14ba5F3503904707

# Modo inicial
NEXT_PUBLIC_DEFAULT_DEMO_MODE=true
```

---

## 🔐 Autenticación SIWE (Sign-In with Ethereum)

Nexora implementa el flujo de autenticación seguro SIWE conforme al estándar de World Mini Apps:

1. **Endpoint `/api/auth/nonce` (`GET`)**:
   * Genera un nonce criptográfico de al menos 8 caracteres mediante `generateSiweNonce()`.
   * Almacena el nonce en una cookie segura `HttpOnly` para evitar ataques de repetición (*replay attacks*).
2. **Frontend `MiniKit.walletAuth()`**:
   * Solicita al usuario la firma del mensaje SIWE en World App con el nonce recibido y el `RP_ID`.
3. **Endpoint `/api/auth/verify` (`POST`)**:
   * Recibe `{ payload: { address, message, signature }, nonce }`.
   * Valida la concordancia del nonce, la validez temporal del mensaje y la firma criptográfica mediante `viem`.
   * Emite una sesión autenticada segura `siwe_session`.

---

## 💻 Ejecución Local

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Ejecutar suite de pruebas:
   ```bash
   npm test
   ```

3. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Abrir [http://localhost:3000](http://localhost:3000) en el navegador o en el emulador de World App MiniKit.

5. Generar build de producción:
   ```bash
   npm run build
   ```

---

## 📲 Despliegue en World App Developer Portal

Para registrar la Mini App en el Portal de Desarrolladores de World:
1. Accede al [World Developer Portal](https://developer.worldcoin.org/).
2. Vincula tu **APP ID**: `app_58fcaf4e2fdc019a1f6219064ee9c5e4` y **RP ID**: `rp_5b67fb974cb00239`.
3. Configura la URL pública de producción (ej. en Vercel o Cloudflare Pages).
4. En la sección **Allowed Contracts / Whitelist**, registra los contratos con los que interactuará tu aplicación para habilitar el patrocinio de gas en World Chain.

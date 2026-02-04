# Smart Swap Documentation

## Dokumentation

| Dokument | Beschreibung |
|----------|--------------|
| [arc42.md](./arc42.md) | Vollständige Architekturdokumentation |
| [deployment-guide.md](./deployment-guide.md) | Schritt-für-Schritt Deployment Anleitung |
| [setup.md](./setup.md) | Entwicklungsumgebung einrichten |
| [architecture.md](./architecture.md) | Code-Architektur Übersicht |
| [mwa.md](./mwa.md) | Mobile Wallet Adapter / Seed Vault |
| [jupiter.md](./jupiter.md) | Jupiter Swap API Integration |
| [RFC-001-production-readiness.md](./RFC-001-production-readiness.md) | Production Readiness Review |

## Diagramme

| Diagramm | Beschreibung |
|----------|--------------|
| [system-context.md](./diagrams/system-context.md) | C4 System Context (Level 1) |
| [component-diagram.md](./diagrams/component-diagram.md) | C4 Container/Component View (Level 2) |
| [sequence-diagrams.md](./diagrams/sequence-diagrams.md) | Laufzeitsicht: Wallet, Quote, Swap Flows |
| [deployment-diagram.md](./diagrams/deployment-diagram.md) | Deployment & Infrastructure |

## Quick Start

```bash
npm install
npx expo prebuild --platform android
npx expo run:android
```

**Emulator Testing:** [Fake Wallet Setup](./setup.md#fake-wallet-installieren)

## Quick Links

### Für Entwickler

1. [Setup & Installation](./setup.md)
2. [Code-Architektur](./architecture.md)
3. [MWA Integration](./mwa.md)
4. [Jupiter API](./jupiter.md)
5. [Architektur verstehen](./arc42.md#5-bausteinsicht)
6. [Technologie-Entscheidungen](./arc42.md#9-architekturentscheidungen)

### Für Deployment

1. [Voraussetzungen](./deployment-guide.md#voraussetzungen)
2. [Build-Prozess](./deployment-guide.md#build-prozess)
3. [dApp Store Publishing](./deployment-guide.md#solana-dapp-store-publishing)
4. [Checklist](./deployment-guide.md#deployment-checklist)

### Diagramm-Rendering

Die Mermaid-Diagramme können gerendert werden mit:
- GitHub (automatisch)
- VS Code mit Mermaid Extension
- [Mermaid Live Editor](https://mermaid.live)

## Struktur

```
docs/
├── README.md                  # Diese Datei
├── setup.md                   # Entwicklungsumgebung
├── architecture.md            # Code-Architektur
├── mwa.md                     # Mobile Wallet Adapter
├── jupiter.md                 # Jupiter API
├── arc42.md                   # Architektur-Dokumentation
├── deployment-guide.md        # Deployment-Anleitung
└── diagrams/
    ├── system-context.md      # Kontext-Diagramm
    ├── component-diagram.md   # Komponenten-Diagramm
    ├── sequence-diagrams.md   # Sequenz-Diagramme
    └── deployment-diagram.md  # Deployment-Diagramm
```

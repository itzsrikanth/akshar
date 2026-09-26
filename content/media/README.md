# Media assets (Git side)

Binary audio/images/PDFs are **not** stored here. This tree holds provider-independent manifests and provenance that join textbook segment IDs to immutable object keys in external storage (see [`infra/cloudflare`](../../infra/cloudflare/README.md) and [`docs/media-delivery.md`](../../docs/media-delivery.md)).

## Layout

```
content/media/
├── README.md                 # this file
└── manifests/                # optional chapter manifests (YAML)
    └── <book-id>/<edition-id>/<chapter-id>.yaml
```

Manifests must validate against [`schema/media-asset-manifest.schema.json`](../../schema/media-asset-manifest.schema.json). Partial coverage is valid. Never invent segment IDs — copy them from the chapter `source.*.yaml`.

## Object key convention

```
audio/<lang>/<voice-id>/<first-two-hex-of-assetId>/<assetId>.m4a
```

Publish approved objects **before** merging a manifest that references them. Upload credentials must never appear in this repository.

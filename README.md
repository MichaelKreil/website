# michael-kreil.de

Static site that renders the project/press/awards grid on [michael-kreil.de](https://michael-kreil.de).

Entries live as TypeScript data in `src/data.ts`; the build resolves each entry against `types`/`topics`, derives a slug, regenerates per-entry images (PNG/JPG/WebP plus a base64 GIF icon), and produces a single `web/index.html` from `src/template/index.template.html`.

## Requirements

- Node.js 24+
- ImageMagick (`magick`), `pngquant`, `optipng` on `PATH` — used by `src/lib/image.ts` to (re)generate entry images.

## Scripts

| Command           | What it does                                            |
| ----------------- | ------------------------------------------------------- |
| `npm run dev`     | Watches the repo, rebuilds on change, serves on `:8080` |
| `npm run build`   | One-shot build to `web/`                                |
| `npm run check`   | `format` + `lint` + `test`                              |
| `npm run test`    | Vitest                                                  |
| `npm run publish` | Build, then `rsync` `web/` to the host via `upload.sh`  |

## Layout

```
src/
  build.ts        # one-shot build entry
  dev.ts          # watch + static server
  data.ts         # source of truth for entries, types, topics
  lib/
    website.ts    # template binding + entry validation/sorting
    image.ts      # per-entry image generation (depends on magick/pngquant/optipng)
    utils.ts      # resolveProject, checkedSpawn
    types.ts      # Entry / Topic / Type interfaces
  template/
    index.template.html
web/
  index.html      # generated
  assets/
    main.js       # client-side grid layout (inlined into index.html at build)
images/           # source images, keyed by slug (`YYYYMMDD-type[-suffix].png`)
icons/            # 16×16 base64 icons cached per slug
```

## Adding an entry

Append to `entries` in `src/data.ts`. The `type` must be a key of `types`; `topic` (if set) must be a key of `topics` — both are typed as literal unions, so typos fail at compile time. If a matching image exists at `images/<slug>.png`, it'll be used; otherwise the type's CSS background applies.

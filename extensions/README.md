# The extension catalog

[`catalog.json`](catalog.json) is the source of truth for the Extension Store. The desktop App Store and `/extensions/` render the same catalog. There is no database or separate administration service.

## Add or update an extension

1. Create a branch in this website repository.
2. Add an entry to `catalog.json`, using an existing entry as the format reference. Use the extension's actual manifest ID and a unique, permanent URL slug.
3. Add a square icon and a landscape preview to `assets/extensions/`. Use SVG, PNG, WebP, or JPG. Keep filenames lowercase with hyphens. Prefer small local assets; label illustrations as design previews and use only artwork you have permission to publish.
4. Run `node scripts/validate-extensions.cjs` and `node --test tests/*.test.cjs` from the repository root.
5. Run `python3 -m http.server 8894 --bind 127.0.0.1`, then check `/extensions/` and your detail URL at desktop and phone sizes. Check the App Store icon on the desktop too.
6. Open a pull request. Include the publisher's public website, release/source link, pricing, compatibility, and preview. Maintainers review the listing before it appears on the live site.

Independent developers can list free or paid extensions. Each publisher handles their own purchases, licenses, downloads, and support. This catalog contains **public product information only**: never add API keys, license codes, customer data, signing keys, or private download tokens.

## Fields

| Field | Purpose |
| --- | --- |
| `id`, `slug`, `name` | Manifest identity, stable URL, display name. IDs and slugs must be unique. |
| `tagline`, `description` | Short card copy and full detail description. Plain text only. |
| `developer` | Verified publisher display name and public HTTPS URL. |
| `categories` | Category names; navigation and filtering derive from these. |
| `price` | Numeric `amount`, ISO currency code, and `billing`: `free`, `one-time`, `monthly`, or `yearly`. Zero must use `free`. |
| `status`, `statusNote` | Release state and a precise explanation of what is available. See below. |
| `version`, `requirements` | Version label and minimum macOS/host requirements. Clearly identify preview-only compatibility. |
| `icon`, `artwork`, `artworkAlt` | Local paths relative to the website root and descriptive alternative text. |
| `previews` | Optional gallery of 1–8 `{ "image": "assets/extensions/…", "alt": "…", "caption": "…" }` objects. Without it, the main artwork is used. Label design illustrations clearly. |
| `featured`, `heroTitle` | At most one featured entry. Its hero title may contain `\n`. |
| `purchaseUrl`, `downloadUrl`, `sourceUrl` | Optional public HTTPS destinations, with no URL credentials. Required destinations depend on status. |
| `supportUrl` | Public publisher support link. Required for every entry. |
| `features` | A list of `{ "title": "…", "description": "…" }` objects. |
| `privacy`, `installSteps` | Access/data-use explanation and an ordered installation guide. |

## Release states

| Status | Store action | Required destination |
| --- | --- | --- |
| `coming-soon` | Disabled “Coming soon” button | None. A future checkout URL can be recorded, but is never offered to buyers. |
| `preview` | “View source” or “Try preview” | `sourceUrl` or `downloadUrl`. The page clearly says developer preview. |
| `available`, free | “Get extension” | `downloadUrl` pointing to a public release/download page. |
| `available`, paid | “Buy for …” | `purchaseUrl` pointing to the publisher's live checkout flow. |

Before setting `available`, verify the compatible host release, signed/notarized package, download delivery, and any paid activation flow. The validator checks structure and URL safety; it cannot prove a purchase, certificate, or external download works. Do not include ratings, install counts, or compatibility claims without evidence.

The Lock Screen listing is one product. Music, Focus, and Glance share its single $1 permanent purchase. Do not split them into separate paid listings.

The starter source and developer guide currently link to a pinned public host preview commit. Update those links to a stable release when extension support ships.

## Local checks and implementation

`js/extension-catalog.js` contains shared validation, filtering, and action selection. `js/extension-store.js` renders plain text through DOM methods; catalog data never becomes executable HTML. The catalog is fetched once per storefront load with a timeout. There are no polling loops, animated previews, third-party fonts, checkout SDKs, or analytics on the standalone store page.

`?extension=<slug>` opens a detail page. `q`, `price`, and `category` preserve browsing filters; browser Back/Forward work normally. `?embedded=1` presents the same page inside the desktop window. Direct links omit the embedded flag.

To inspect empty/error states locally, use an empty `extensions` array or temporarily rename the catalog, refresh, and restore it before committing. The UI provides a clear-filters action and a retry path.

# osiris.cheminfo.org

Draw a molecule and read its predicted toxicity risks and physicochemical
properties, or load a whole set and compare them at once. Everything is computed
in the page: nothing you draw, paste or open is uploaded anywhere.

It replaces the OSIRIS Property Explorer view of the cheminfo visualizer,
[`cheminfo-public/d9498d0a2ea400ea71efec8840a1273b`](https://couch.cheminfo.org/cheminfo-public/d9498d0a2ea400ea71efec8840a1273b/view.json),
which did the same two things behind a hash-routed page nobody could link into.

The predictions come from [OpenChemLib](https://github.com/cheminfo/openchemlib-js),
which carries the models of the original OSIRIS Property Explorer by Thomas
Sander (Actelion Pharmaceuticals Ltd., now Idorsia). A risk alert is not a
toxicity prediction, and no alert is not a clean bill of health: `/method` says
where each number comes from, in its author's own words.

## The addresses it understands

| Address    | What it opens                                                     |
| ---------- | ----------------------------------------------------------------- |
| `/`        | the explorer: one molecule, its risks and its properties          |
| `/compare` | the comparison: a set, in a table and a parallel-coordinates plot |
| `/method`  | how the predictions are made                                      |
| `/about`   | what it predicts, what it borrows, and how to cite it             |

Each page reads its own parameters from the query string:

| Parameter | Page       | Meaning                                                            |
| --------- | ---------- | ------------------------------------------------------------------ |
| `smiles`  | `/`        | the molecule to load — `/?smiles=c1ccccc1`                         |
| `idcode`  | `/`        | the same molecule as an OpenChemLib idCode; it wins over `smiles`  |
| `smiles`  | `/compare` | the set, comma or space separated — `/compare?smiles=CCO,c1ccccc1` |
| `axes`    | `/compare` | which properties the plot draws, comma separated keys              |
| `color`   | `/compare` | the property the lines are coloured by                             |
| `focus`   | `/compare` | the idCode of the row whose properties are shown                   |

Two files are shipped for a reader who has none of their own, linked from the
list card and served at addresses of their own:

| File                     | What it holds                                    |
| ------------------------ | ------------------------------------------------ |
| `/demo/traded-drugs.sdf` | 26 drugs on the market, each record named        |
| `/demo/solvents.smi`     | 34 laboratory solvents, one per line with a name |

A click reads one into the page; ⌘-clicking or saving it gives a small example
of either format to write your own against. Both are written by
`npm run demo-files` rather than by hand, so a structure that does not read
stops the script instead of reaching a visitor.

And every page takes the family's own sharing vocabulary:

| Parameter | Meaning                                                                                                                                |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `embed`   | drop the header, the page bar and the footer — `?embed` or `?embed=1`                                                                  |
| `hide`    | comma-separated parts to leave out: `editor`, `smilesInput`, `fileInput`, `table`, `plot`, `properties`, `risks`, `detail`, `download` |

`axes` and `color` name a column each: one of `logP`, `logS`, `molecularWeight`,
`polarSurfaceArea`, `druglikeness`, `acceptorCount`, `donorCount`,
`stereoCenterCount`, `rotatableBondCount`, `drugScore`, or one of the four
risks — `mutagenic`, `tumorigenic`, `irritant`, `reproductive`. A column the
tool does not know is left out rather than drawn blank, and `/compare` with no
`axes` opens on the seven the original explorer drew.

`axes=none` is the one reserved value: it says the reader turned every column
off, which is not the same as naming none at all. Without it a link that
carried an empty selection would reopen on the seven defaults, so the plot
would come back on after being switched off.

An unknown `hide` key is ignored and an over-long value is cut, so a link
written years ago still opens. The Share button in the header builds both a link
and an iframe snippet for whatever is on screen.

```html
<iframe
  src="https://osiris.cheminfo.org/?embed=1&smiles=CC(=O)Oc1ccccc1C(=O)O"
  width="100%"
  height="680"
  style="border: 1px solid #ddd; border-radius: 8px"
  title="osiris.cheminfo.org — Explorer"
></iframe>
```

## Development

```sh
npm install
npm run dev        # http://localhost:10620
npm run test       # unit tests, types, tokens, deploy contract, lint, format
npm run test-e2e   # Playwright, against the built site
npm run build      # dist/, one HTML file per address, plus sitemap and robots
npm run og-image   # redraw public/og.png from the site's own record
npm run demo-files # rewrite public/demo from the structures the script lists
```

The port is 10620 and it is not a typo. This site was created on 2026-09-17,
whose derivation (6+09+17 = 60917, less 50000 = 10917) was taken the same day by
`symmetry.cheminfo.org`, so the number comes from the 106xx block the family
keeps for exactly that case. One number, for the dev server and for compose
alike: this site has no backend to leave room for.

## Where the site is served

The build carries no mount path — every asset is written relative — so one image
serves both `https://osiris.cheminfo.org/` and a path of a shared host. Two
variables decide which:

- `BASE_PATH` is stamped into `<base href>` of every page when the container
  starts, and is what resolves the assets and the links at run time.
- `SITE_URL` is a **build-time** argument: it is what the canonical link, the
  social card, `robots.txt` and `sitemap.xml` name, so a mirror still points a
  crawler back at the published address.

```sh
docker build --build-arg SITE_URL=https://www.cheminfo.org/osiris/ .
```

So no address in the site may start at the root of the host. It is checked
rather than assumed, because the fault shows on no deployment but the mounted
one:

```sh
npm run build-mount   # dist-mount/: the same build, laid out at /osiris/ by
                      # docker-entrypoint.sh itself
npm run test-only     # reads it back: no src="/…", no href="/…" but <base>
npm run test-e2e      # opens it at /osiris/ and watches what it fetched
```

## Deployment

```sh
cp .env.example .env
# uncomment exactly one COMPOSE_FILE line
docker compose up -d
```

| Mode              | `COMPOSE_FILE`               | Exposure                                    |
| ----------------- | ---------------------------- | ------------------------------------------- |
| Port-published    | `compose.yaml` (the default) | publishes `PORT` on the host                |
| Traefik           | `compose.traefik.yaml`       | behind the reverse proxy, no published port |
| Cloudflare Tunnel | `compose.cloudflared.yaml`   | behind the tunnel, no published port        |

Never deploy by hand with `git pull && docker compose up -d --build`: the build
overwrites the running tag in place while `git pull` moves the source underneath
it, leaving neither an image nor a commit to go back to. The server's own
`deploy.sh` tags each build immutably, probes `/health`, and rolls back.

## Environment

| Variable          | Where                 | Meaning                                                                                                                                                          |
| ----------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `COMPOSE_FILE`    | `.env`                | which deployment mode is in force                                                                                                                                |
| `IMAGE_NAME`      | `.env`                | the image every compose file runs — `ghcr.io/cheminfo/osiris.cheminfo.org`                                                                                       |
| `IMAGE_TAG`       | `.env`                | the tag deployed; rewritten by `deploy.sh`, never by hand                                                                                                        |
| `PORT`            | `.env`, `npm run dev` | the host port, and the dev server's own                                                                                                                          |
| `BASE_PATH`       | container             | where this deployment is mounted; unset means `/`                                                                                                                |
| `TRACKING_SCRIPT` | container             | the analytics snippet, verbatim, injected at the end of `<head>` of every page the container serves. Unset, nothing is loaded — which is what `npm run dev` gets |
| `TUNNEL_TOKEN`    | `.env`                | the Cloudflare Tunnel token, for that mode only                                                                                                                  |
| `SITE_URL`        | build argument        | the published address the head and the sitemap are written from                                                                                                  |

## Licence

MIT. See [CHANGELOG.md](./CHANGELOG.md) for what changed and when.

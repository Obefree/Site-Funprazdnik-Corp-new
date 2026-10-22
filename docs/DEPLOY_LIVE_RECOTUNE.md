# Deploy RecoTune piano to LIVE obefree.com

Status: source merged into `main` on 2026-10-22, GitHub Pages build successful. **Live custom domain deployment NOT verified.**

## What is ready
- Repository: `Obefree/Site-Funprazdnik-Corp-new`, branch `main`
- Commit adding RecoTune: `94602f8fb9669ac0baac1795d24b9ebf47c7d0f0`
- Web entry: `public/recotune/index.html`, exported as `/recotune/index.html`
- Root homepage card in `app/page.js` links to `recotune/`
- Features: chromatic tuner, reference notes, 88-key piano, two-track local recorder and WAV export
- GitHub Pages artifact: https://obefree.github.io/Site-Funprazdnik-Corp-new/recotune/
- Successful GitHub Pages run: https://github.com/Obefree/Site-Funprazdnik-Corp-new/actions/runs/39767605291

## Blocker in connected ChatGPT Vercel account

Connected Vercel team `team_OQP31DNcOR0TPOehUZSizfWL` (`Aleks' projects`) does not list an `obefree` website project. Its domain endpoint for `obefree.com` returns HTTP 403 (forbidden). DNS configuration reports Vercel nameservers, but this does **not** grant permission to change the zone or establish which deployment serves the live URL.

**Never claim `obefree.com/recotune` is updated just because GitHub Pages succeeds.**

## Exact steps for authorized Codex / Vercel CLI session

Use the **Vercel account/team that owns obefree.com**, not the inaccessible team above.

1. Open Vercel dashboard and inspect `obefree.com` domain's **Assigned Project**, or via CLI inspect domain/project list under the correct team. Confirm the current project and its linked Git repo and production branch. Do not change DNS or any other domains.
2. If that project is already connected to `Obefree/Site-Funprazdnik-Corp-new` main, trigger its normal **production deployment** of the latest main commit. Check any Vercel environment setting `NEXT_PUBLIC_BASE_PATH`: for the root custom domain, it must be **empty/unset**, not `/Site-Funprazdnik-Corp-new`.
3. If production currently uses a different repository or hosting configuration, **do not overwrite it or reassign the domain blindly**. Inspect that site's `/recotune` route/source and merge the new piano and tuner module without removing existing microphone/studio functionality. Confirm it still routes through the correct production project. Only then trigger production deployment.
4. After deployment, test `https://obefree.com/recotune/` in desktop and mobile browsers and check:
   - HTTP 200, no unexpected redirects;
   - 88 playable keys including sharps/flats and polyphony;
   - notes and instruments, A4 calibration, sustain;
   - microphone permission/detection on HTTPS;
   - two-track recordings, playback, download mix WAV;
   - main homepage RecoTune project card navigates to `/recotune/`;
   - root homepage, /cv, /dice, /cob and unrelated projects still work.
5. Report production deployment ID, URL, commit SHA and verification findings.

## Safe local build

```sh
git clone https://github.com/Obefree/Site-Funprazdnik-Corp-new.git
cd Site-Funprazdnik-Corp-new
npm ci
NEXT_PUBLIC_BASE_PATH= npm run build
# Verify out/recotune/index.html exists
```

On Windows PowerShell, use `$env:NEXT_PUBLIC_BASE_PATH = ""` before running `npm run build`.

Current repo GitHub Pages workflow sets `NEXT_PUBLIC_BASE_PATH=/Site-Funprazdnik-Corp-new`; that setting is correct **only** for the GH Pages URL and must not be copied to root domain.

## Authorization required

If no Vercel project or DNS scope grants access to `obefree.com`, stop before touching production. Ask the owner to connect the Vercel account/team that actually owns the domain; do not guess an alternate project or migrate DNS just to make the URL work.

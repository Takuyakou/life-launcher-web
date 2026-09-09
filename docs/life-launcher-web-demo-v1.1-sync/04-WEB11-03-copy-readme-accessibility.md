# WEB11-03 — Copy / README / Screenshot / Accessibility

## Goal
Web Demoの説明・README・画像をv1.1 Demoへ同期する。

## Copy
「昇格」「source layer」「derived view」をユーザー向けに使わない。
例:
「次の一手や、やりたいことを登録しておくと『今日を組み立てる』に候補として表示されます。今日やるものは『今日へ』で今日の3件に入れます。」

## Native disclaimer
「Web Demoでは起動動作を演出しています。Windows版では登録したアプリ・ファイル・URLを実際に開きます。」

## README
- Live Demo URL
- current What
- current Limitations
- Windows product link
- current screenshot
- Deployment実態（Cloudflare Workers + Static Assets）を確認

## Screenshot
synthetic state / deterministic capture / browser chromeなし / README用1枚。

## Accessibility
accordion aria-expanded / focus-visible / native buttons / completion status / modal keyboard / Reset / no click-only fake buttons。

## Metadata
static title / description / OG / favicon / noscriptを確認。framework変更禁止。

## Tests
stale copy scan / README asset / screenshot synthetic / accessibility / 390 overflow 0。

PR + report後STOP。

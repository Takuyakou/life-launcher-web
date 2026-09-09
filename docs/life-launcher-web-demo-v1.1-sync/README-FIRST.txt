LIFE LAUNCHER WEB DEMO — v1.1 SYNC
README FIRST
============================================================
対象: Takuyakou/life-launcher-web
Production: https://life-launcher-web.takuyakou.workers.dev
参照: Takuyakou/life-launcher

目的:
Windows本体v1.1のUI/UXと中心体験をWeb Demoへ必要十分な範囲で同期する。
完全移植はしない。見た目と「候補→今日→実行」の理解を優先する。

最初にCodexへ渡すもの:
  WEB11-CODEX-START.txt

以後は各Stage完了後に:
  WEB11-00承認。続行してください
のような短い承認だけで進める。

Stage:
  WEB11-00 現Web Demo監査・差分固定
  WEB11-01 Main/Today3/Section layout同期
  WEB11-02 Today Builder/選択フロー同期
  WEB11-03 Copy/README/Screenshot/Accessibility
  WEB11-04 Full QA/Cloudflare Production readiness

各StageでPR・自動検証・workreport・execution-state更新後STOP。
Windows本体repoはread-only参照。Windows ReleaseはこのPackageの対象外。

# P7.2 Web Demo Early Completion

## Scope

Product P7.1 (life-launcher PR #31) の動的早期完了を、Web Demoへ簡略同期した。既存ページ構成・Hero・画像・ダウンロード・バージョンは変更しない。デプロイしない。

## Behavior

- 採用済み短時間snapshotと5分の小さい方を基準にする。整数1〜240以外は5分fallback。
- 手動終了時だけ確認し、閾値以上かつ予定時間未満に限る。Todayの直接IDを優先し、DoNowは一意の未完了Project採用項目へ対応づける。
- 左「今日の分は完了」、右「未完了のまま終了」。初期focusとEscapeは右。IME確定は送信せず、背景クリックは閉じない。
- 確認中のtick・再開・別タイマー開始を拒否する。採用元・候補・既存記録は保持し、部分補充しない。
- Demo時間短縮操作を追加。基準への到達だけで自動完了しない。短時間Timerの満了は従来画面を使う。
- localStorage保存成功後のみ反映。失敗時は凍結した確認と変更前状態を維持し、再試行できる。二重確定はidle guardで拒否する。

## Validation

| Check | Result |
| --- | --- |
| lint / build / public:check | PASS |
| Vitest | 53 PASS (早期完了13追加) |
| E2E development | 31 PASS / 本番専用1 SKIP |
| E2E production preview | 32 PASS、CSP・XSS・通信ゼロを含む |
| Visual | 16 PASS (早期完了4追加) |
| git diff --check | PASS |

早期確認を1366/1440/1920/390pxで検査。ボタン内横溢れなし、ページ横溢れ0、キーボードfocus-visible。1440/390pxの生成画像を目視確認した。
初回Visualはマウス操作直後にfocus-visibleを期待するテスト条件が不適切で失敗。Tab往復で実際のキーボード表示を検査するよう修正後に全16件PASS。

## Limits / Stop

- seedは既存の短時間5分を維持。3分snapshotはunit testで検証。Project設定UIの完全移植はしない。
- 実行記録の切り上げ・最低1分、再読み込みでTimer待機に戻す既存Demo簡略仕様は維持。本体の記録規則との相違をdocs/READMEに明記した。
- 本体PRとは別PRでレビューする。merge・deploy・Releaseは未実施。

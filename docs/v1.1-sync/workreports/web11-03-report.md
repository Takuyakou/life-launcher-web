# WEB11-03 Copy / Accessibility / README準備

2026-09-09。画面・keyboard・画像準備完了。README本体の適用はユーザー指定の公開順序待ち。

- 起動はWeb演出であることを明記。分単位サンプル記録とWindows機能を区別。
- Reset説明を実際に初期化するfieldへ一致させた。
- accordion aria-expanded/aria-controls、native button、非操作の完了statusを使用。
- Wishlist/Reset/満了dialogのTab循環、Escape、起点復帰。Resetは実行左・キャンセル右で、初期focusはキャンセル。
- timerは毎秒のlive読み上げをやめ、status変更・完了dialogで通知。
- Dictionaryは検索からArrowDownでtile、上下左右・Home・Endで移動。入力内の左右キーを奪わず、dialog外で十字キーを横取りしない。
- Ctrl+KはDemo内の非入力操作にscopeし、他のページ領域・modal入力を奪わない。
- title/description/OG/favicon/noscriptは既存を維持。存在と応答を検証。
- 新README用画像は2026-09-09の固定日時・合成seed・1440px、browser chromeなし。toastを消して撮影。

## READMEゲート

ユーザー指定順序は「Windows v1.1 release → 本体README → Web README」。この順序を変更する明示回答は受領していないため、root READMEは変更しない。
[差し替え原稿](../README-v1.1-draft.md)と`docs/screenshots/web-demo-v1.1.png`を準備した。適用時は画像pathをroot README用に調整する。
未公開のv1.1 Releaseリンクを作らず、現在サイトのv1.0.0 download先は維持。
したがってWEB11-03を「README反映まで全完了」とは扱わない。

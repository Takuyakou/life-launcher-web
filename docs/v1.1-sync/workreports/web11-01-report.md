# WEB11-01 Main UI / Today3

2026-09-09。実装・自動QA完了。ユーザーの「最後まで」に従い、各段階で中断せず残りWEB11を一つの作業ブランチにまとめた。監査PR #5を親とし、mainへはまだmergeしない。

- Victory → Do Now → Today3 → Builder → NextStep → Wishlist → Activityを維持。
- Today3はwide3列、medium2列、narrow1列のcompact card。project色の上端線、dot/name、完了数を表示。
- 手動checkboxを廃止。timerが予定時間に達するとfinishedになり、「終わる」または「保存して終わる」でToday項目とSessionを確定。
- Demo加速も実際の予定秒数まで進める。自然満了と同じ確定経路。
- 途中終了・一時停止からの別開始では旧項目を完了にしない。単一timerを維持。
- Today item IDで完了対象を限定。同じProjectのDo Now開始でToday snapshotを誤って完了にしない。
- exactly3件完了時だけ次バッチ。現在の3枠だけを空にし、記録・登録元を保持してBuilderへfocus。自動補充なし。
- Today採用時に5分/25分snapshotを保存。旧v2の欠落fieldは補完。
- NextStepをcompact list/accordionへ。4見出しはchevron/title/count/説明、bar全体で開閉。
- Do NowとToday3のpause/resume/endを共通コンポーネント化。色は既存token。

検証: timer境界、自然満了、保存確定、早期終了、入替、二重確定拒否、snapshot維持、次バッチ条件、4サイズと1000pxの2列。
自然満了時に開始buttonが消えてbodyへ移ったfocusを見つけ、Today3へ復帰するよう修正後にE2E PASS。
総合結果は[WEB11-04](web11-04-report.md)参照。

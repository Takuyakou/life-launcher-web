# WEB11-02 — Today Builder / Selection Flow Sync

## Goal
Web Demoでも「候補を登録 → 今日を選ぶ → Today3で実行」が自然に伝わる状態へ。

## Builder role
NextStep / Wishlist由来の候補 → 今日へ → Today3。
独立free-input DBにしない。

## Remove old UI if present
- Builderの自由入力 +追加
- 勝利条件/Session等のsource dropdown
- unrelated candidate sources

## Compact grouped layout
例:
今日を組み立てる  5件  次の一手・やりたいことから、今日やるものを選ぶ

次の一手 3件
● 読書  本を10分だけ読む       [今日へ]
● 運動  ストレッチを5分する     [今日へ]

やりたいこと 2件
・気になっていた本を読む        [今日へ]
・近所を歩く                    [今日へ]

- source group headingは1回だけ
- compact rows
- project color/name
- long text対応
- Builderの今日へを主導線にする

## Lower source
NextStep/Wishlistに重複した主「今日へ」がある場合は削除方向。Web Demoではshortcutを増やさない。

## Todayへ
- max3
- duplicate reject
- feedback
- Reset対応

## Candidate removal
Windows本体current specで価値がある場合のみ簡略再現。sourceを削除しない意味は守る。右クリック再現は必須でない。

## Pagination
現行Demo dataが自然に5件超なら5/page。見せるためだけに大量seed追加は禁止。

## Add UX
Wishlistは必要ならtext-only compact modal。大規模Project formはWebで完全再現しない。

## Tests
source-only / grouped / 今日へ / max3 / duplicate / Reset / lower duplicate button absent / mobile visual。

PR + report後STOP。

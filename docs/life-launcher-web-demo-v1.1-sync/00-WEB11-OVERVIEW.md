# Web Demo v1.1 Sync — Overview

## Goal
Windows本体v1.1で整理された「迷いを減らして開始する」情報構造をWeb Demoへ同期する。

## Main hierarchy
- 今日の勝利条件
- 今やる一手
- 今日の3件
- 今日を組み立てる
- 次の一手
- やりたいこと
- 今日の実行

## Windows側から同期する中心
- Today3: 最大3件、wide 3列 / medium 2列 / narrow 1列、Timer、完了表示、次の3件
- Today Builder: NextStep / Wishlist由来候補を選ぶ場所。独立自由入力ではない
- NextStep / Wishlist: 下層の登録・保持場所。Webではcompact表現へ
- セクションheader: title + count + muted description + accordion
- Do Now: Mainで最も強い推薦。Web固有の固定reason/rotationで可

## 完全移植しない
- Explorer表示
- 複数モニターDictionary
- Windows native launch
- Tauri path/capability
- 詳細Projectフォーム全部
- Rust推薦ロジック完全再現

## Visual
warm dark / gold / project colors / compact densityを維持。全面Landing redesign禁止。

## Privacy
synthetic data only / localStorage / no backend / no auth / no analytics / network-zero維持。

## Source of truth
current web code → current web tests → current Windows spec/code → latest reports → this package → historical docs

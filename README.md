# Life Launcher Web Demo

[Life Launcher](https://github.com/Takuyakou/life-launcher)の価値と主要な操作フローを、
ブラウザで短時間に試せるインタラクティブデモです。

## What

「何をしよう？」を「今これをやる」に変える流れを、synthetic dataだけで体験できます。

- 今日の勝利条件を編集・完了する
- 固定サンプルから「今やる一手」を切り替える
- 今日の3件をチェックする
- 5分または25分のデモタイマーを開始・一時停止・再開・終了する
- 終了した内容を「今日の実行」で確認する
- 辞書を検索し、Windows固有機能の案内を確認する
- デモ全体を初期状態へリセットする

## Product

Windows製品版:

- [GitHub Repository](https://github.com/Takuyakou/life-launcher)
- [Life Launcher v1.0.0](https://github.com/Takuyakou/life-launcher/releases/tag/v1.0.0)

## Limitations

Web DemoはWindows製品版の完全移植ではありません。

- データはすべて汎用的なsynthetic dataです
- Rustの推薦ロジックは再実装していません
- アプリ・ファイル・URLの起動はWindows版のみです
- D&D、手順書、バックアップ、設定、記録の完全機能は含みません
- visitorが変更したデモ状態はbrowserのlocalStorageだけに保存します
- 入力内容をserverへ送信しません

## Development

```powershell
npm.cmd ci
npm.cmd run dev
```

検証:

```powershell
npm.cmd run public:check
npm.cmd run lint
npm.cmd run test
npm.cmd run build
npm.cmd run test:e2e
npm.cmd run test:visual
```

OG画像の再生成時はdev serverを起動してから実行します。

```powershell
npm.cmd run screenshot:og
```

## Deployment

Cloudflare Pagesでの静的配信を想定しています。

```text
Build command: npm run build
Build output: dist
```

Pages Functions、backend、database、authentication、analytics、secretは使用しません。

## Usage

Source available for viewing. All rights reserved unless otherwise stated.

# WEB11-02 Builder / Selection Flow

2026-09-09。実装・自動QA完了。

- BuilderはProject.nextStepとWishlistだけから派生。自由入力DB・送付先selectなし。
- 自然な初期7候補を5件ずつ表示。groupは現在pageに含まれるものだけ各1見出し。全体group件数を表示。
- 最後のpageから候補がなくなれば既存pageへclamp。除外後も可能な限り現在pageを維持。
- 今日へ、stable source ID重複拒否、最大3件、選択済み表示を保持。lower sourceに重複した今日へは追加しない。
- Wishlistにtext-only追加modal。新規項目は先頭、安定UUID。blank拒否、120文字制限、Enter保存、Escape/外側キャンセル、focus復帰。
- Header内の追加buttonとaccordion toggleを分離。
- 候補除外は元の登録とSessionを残し、同一Today snapshotを外す。active/paused/finished対象はUIとreducerで拒否。
- 永続保存に成功してからstateを更新。失敗時は変更前表示と入力draftを保持。timer tick/pause/resume/満了判定では永続保存しない。
- Resetは新規Wishlist・除外・Today・Project次の一手・記録・開閉をseedへ戻す。旧v1 keyの削除はbest-effort。
- 破損したProject/Session/sectionsを含むv2データはseedへfallback。

## 意図的なWeb簡略化

Project新規作成・大規模編集form、D&D、native右クリック管理は追加していない。Projectは提供済み4件で、次の一手は満了dialogから更新する。
候補除外とToday枠は日付で自動解除せずResetまで保持する。日付処理・nativeの当日永続モデルは完全移植しない。この違いはREADME原稿に明記。
reload後のtimerはidle。進行中/未確定のtimerを復元しない。

検証: 5/page、page回復、source保持、重複・上限、追加と再読込、XSS文字列、保存失敗、active除外、Reset。

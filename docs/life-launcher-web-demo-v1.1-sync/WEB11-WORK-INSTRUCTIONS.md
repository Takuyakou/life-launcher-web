# Web Demo v1.1 Sync — Canonical Work Instructions

Workflow:
WEB11-00 → approval → merge → WEB11-01
WEB11-01 → approval → merge → WEB11-02
WEB11-02 → approval → merge → WEB11-03
WEB11-03 → approval → merge → WEB11-04
WEB11-04 → explicit production approval → merge → Cloudflare deploy check → production smoke → STOP

Resume時は execution-state / previous workreport / current git / current tests / current stage doc を再読。Stage専用promptを要求しない。

承認例:
WEB11-01承認。続行してください

WEB11-04だけ本番反映には:
WEB11-04承認。本番反映してください
が必要。

Windows repoはread-only。workreportは docs/v1.1-sync/workreports/ 。BLOCKED/test failなら次Stageへ進まずSTOP。

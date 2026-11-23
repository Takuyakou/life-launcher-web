// Windows v1.6.3 prompt text, copied unchanged from src/content/importPrompt.ts.
// The Web Demo runs the same import flow without Tauri or network access.

import type { DemoProject, DemoState, DemoWishlistItem } from "./types";
import { stateFingerprint } from "./types";

export const IMPORT_JSON_FORMAT = `{
  "lifeLauncherImport": 1,
  "projects": [
    {
      "name": "プロジェクトの名前",
      "color": "blue",
      "goal": "このプロジェクトで目指す状態(60文字まで)",
      "nextStep": { "text": "次にやる具体的な行動(〜する)", "trigger": "始めるきっかけ", "minutes": 20, "shortMinutes": 5 },
      "wishes": ["次の一手の次に控える具体的な行動(〜する)"]
    }
  ],
  "wishes": ["どのプロジェクトにも入らない具体的な行動(〜する)"]
}`;

export const IMPORT_PROMPT_FIRST = `あなたは、私の人生・目標・やりたいことを前に進めるための行動設計パートナーです。
私は「Life Launcher」という Windows アプリを使っており、「今5分以上のまとまった時間ができたときに、迷わず着手できる具体的な行動」を登録して実行しています。

あなたの役割:
これまでの私との会話履歴やメモリにある文脈をもとに、「私の人生や目標、やりたいことを達成するために、今5分以上時間が使えるとしたら何を実行すべきか」を本気で考え、下の JSON 形式で提案してください。

アプリに登録する3つの要素:
- プロジェクト: 継続して前に進めたいテーマ（最大5個に厳選）
- 次の一手: 各プロジェクトにつき1つだけ。「今すぐ手が動く」最も優先度の高い具体的な行動
- やりたいこと: 次の一手の次に控える具体行動の候補（各プロジェクト3個まで）

行動を具体化するための厳守ルール:
1. フワっとした抽象的な行動や一般論は禁止。会話履歴やメモリに出てきた具体的なツール名・対象・目標数値・今の課題や関心事を、そのまま行動文に織り込むこと
   - 悪い例: 「本を読む」「部屋を片付ける」「勉強する」「運動する」
   - 良い例: 「読みかけの本を開いて次の見出しまで10分読む」「机の上の紙類だけを全部取り出して要・不要の2山に分ける」「問題集の間違えた箇所を3問だけ解き直す」
2. すべての行動は「開く・書く・話す・測る・1つ作る」のように、開始動作と終わりの基準が見える「〜する」で終わる文にすること
3. 時間の目安は現実的に設定すること
   - "minutes": まとまって進めるときの標準時間（15〜30分）
   - "shortMinutes": 最低5分だけ時間が取れたときに着手できる最小サイズ（5〜10分）
4. 会話履歴やメモリから十分に組み立てられる場合は質問せず、そのまま JSON を出力すること。手がかりが全くない場合のみ、先に質問を3つまでして回答を受けてから JSON を作ること

出力の決まり:
- JSON は必ず \`\`\`json のコードブロック1つだけで出力し、前後に説明文を付けない
- 先頭に "lifeLauncherImport": 1 を書く
- "goal" はこのプロジェクトで目指す状態（60文字以内）
- "trigger" は始めるきっかけ（例: 朝のコーヒーの後）。自然なものがなければ省略する
- "color" は次から選ぶ: amber, blue, green, violet, rose, cyan, orange, slate, lime, magenta, sand, coral
- アプリ内のボタン・リンク・手順書パスは書かない

出力形式:
${IMPORT_JSON_FORMAT}`;

export const IMPORT_PROMPT_REPEAT = `あなたは、私の人生・目標・やりたいことを前に進めるための行動設計パートナーです。
私は「Life Launcher」という Windows アプリで、「今5分以上のまとまった時間ができたときに、迷わず着手できる具体的な行動」を管理・実行しています。

あなたの役割:
下にある「今のアプリの内容」と、これまでの私との会話履歴やメモリにある最近の文脈を見比べて、「今の私の目標ややりたいことを前に進めるために、5分以上時間が使えるとしたら新たに何を足すべきか」を考え、追加分だけを下の JSON 形式で提案してください。
（週に1回などの定期的な見直しでも繰り返し使えるよう、既にある内容と重複しない差分だけを厳選してください）

追加・見直しの厳守ルール:
1. 「今のアプリの内容」にすでにある項目、またはその言い換え・焼き直しは絶対に出さないこと
2. 今あるプロジェクトに足すときは、"name" を「今のアプリの内容」と一字一句同じにすること
3. すでに「次の一手」があるプロジェクトには "nextStep" を書かず、次の一手を終えたあとの候補として "wishes" に足すこと
4. 「次の一手」が空のプロジェクトには、今すぐ着手できる具体的な "nextStep" を1つ提案すること
5. 毎回増えすぎて管理できなくなるのを防ぐため、追加は本当に効くものだけに厳選すること
   - 新規プロジェクトは最近新しく重要になったテーマだけ最大2個まで
   - 追加する行動は全体で5〜8個程度に絞る
   - 停滞していそうなプロジェクトには、5分で心理的ハードルを越えて着手できる最小の一歩を "wishes" に1つ入れる
6. フワっとした抽象的な行動や一般論は禁止。会話履歴やメモリにある具体的なツール名・対象・目標数値・今の課題を織り込み、「開く・書く・話す・測る・1つ作る」のように開始動作と完了条件が見える「〜する」で終わる文にすること
   - 悪い例: 「本を読む」「部屋を片付ける」「勉強する」
   - 良い例: 「読みかけの本を開いて次の見出しまで10分読む」「机の上の紙類だけを全部取り出して要・不要の2山に分ける」「問題集の間違えた箇所を3問だけ解き直す」
7. "minutes" は15〜30分（標準）、"shortMinutes" は5〜10分（最低5分で着手できる最小サイズ）で設定すること
8. 会話履歴・メモリ・今のアプリの内容から組み立てられる場合は質問せず、そのまま JSON を出力すること。手がかりが全くない場合のみ、先に質問を3つまでして回答を受けてから JSON を作ること

出力の決まり:
- JSON は必ず \`\`\`json のコードブロック1つだけで出力し、前後に説明文を付けない
- 先頭に "lifeLauncherImport": 1 を書く
- "goal" は新規プロジェクトで目指す状態（60文字以内）
- "trigger" は始めるきっかけ。自然なものがなければ省略する
- "color" は次から選ぶ: amber, blue, green, violet, rose, cyan, orange, slate, lime, magenta, sand, coral
- アプリ内のボタン・リンク・手順書パスは書かない

出力形式:
${IMPORT_JSON_FORMAT}

今のアプリの内容:
{CURRENT_STATE}`;

export const IMPORT_MAX_BYTES = 256 * 1024;
const IMPORT_MAX_PROJECTS = 30;
const IMPORT_MAX_WISHES = 100;
const MAX_NAME = 120;
const MAX_GOAL = 60;
const MAX_STEP = 120;
const MAX_WISH = 120;

export type DemoImportColor = DemoProject["color"];

export type ParsedImportProject = {
  name: string;
  color: DemoImportColor;
  goal?: string;
  nextStep?: string;
  wishes: string[];
};

export type ParsedDemoImport = {
  projects: ParsedImportProject[];
  wishes: string[];
  /** Paths that the answer set but the Web Demo cannot apply (trigger, timer minutes). */
  ignoredFields: string[];
};

export type DemoImportRow = {
  key: string;
  kind: "step" | "wish";
  text: string;
  /** Why a next step is added as a wish instead. */
  reason?: string;
};

export type DemoImportGroup = {
  key: string | null;
  name: string;
  isNew: boolean;
  color?: DemoImportColor;
  goal?: string;
  note?: string;
  /** The frame's head tick was removed by the dialog (nothing in it is applied). */
  excluded: boolean;
  rows: DemoImportRow[];
};

export type DemoImportPlan = {
  groups: DemoImportGroup[];
  ignoredFields: string[];
  fingerprint: string;
};

export type ExtractImportJsonResult =
  | { ok: true; json: string }
  | { ok: false; error: string };

export type ParseDemoImportResult =
  | { ok: true; parsed: ParsedDemoImport }
  | { ok: false; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Windows v1.6.3 colours folded into the four the Web Demo draws. */
const COLOR_MAP: Record<string, DemoImportColor> = {
  amber: "amber",
  orange: "amber",
  sand: "amber",
  coral: "amber",
  green: "green",
  lime: "green",
  blue: "blue",
  cyan: "blue",
  slate: "blue",
  violet: "violet",
  rose: "violet",
  magenta: "violet",
};

export function importColor(value: unknown): DemoImportColor {
  if (typeof value !== "string") return "blue";
  return COLOR_MAP[value.trim().toLowerCase()] ?? "blue";
}

/** The text that goes into the repeat prompt's {CURRENT_STATE}. */
export function buildImportCurrentState(state: DemoState): string {
  const lines: string[] = [];
  for (const project of state.projects) {
    lines.push(`${project.name}(色: ${project.color})`);
    if (project.goal?.trim()) lines.push(`目標: ${project.goal.trim()}`);
    if (project.nextStep?.trim())
      lines.push(`次の一手: ${project.nextStep.trim()}`);
    const wishes = state.wishlist
      .filter((item) => item.projectId === project.id)
      .map((item) => item.label.trim())
      .filter(Boolean);
    if (wishes.length > 0) lines.push(`やりたいこと: ${wishes.join(" / ")}`);
  }
  const unassigned = state.wishlist
    .filter((item) => !item.projectId)
    .map((item) => item.label.trim())
    .filter(Boolean);
  if (unassigned.length > 0)
    lines.push(`プロジェクトなしのやりたいこと: ${unassigned.join(" / ")}`);
  return lines.length > 0 ? lines.join("\n") : "(まだ何もありません)";
}

/** Pull one JSON object that contains "lifeLauncherImport" out of a pasted answer. */
export function extractImportJson(text: string): ExtractImportJsonResult {
  if (new TextEncoder().encode(text).byteLength > IMPORT_MAX_BYTES)
    return { ok: false, error: "256 KBを超えています" };

  const trimmed = text.trim();
  if (trimmed) {
    try {
      const value: unknown = JSON.parse(trimmed);
      if (isRecord(value) && "lifeLauncherImport" in value)
        return { ok: true, json: trimmed };
    } catch {
      // Keep looking: the answer may wrap the JSON in prose or a code fence.
    }
  }

  let found = findImportJson(text);
  if (found.matches.length === 0) {
    const repaired = findImportJson(repairOutsideStrings(text));
    if (repaired.matches.length > 0) found = repaired;
  }
  if (found.matches.length > 1)
    return {
      ok: false,
      error: "取り込みのJSONが2つ以上あります。1つだけにしてください",
    };
  if (found.matches.length === 0)
    return {
      ok: false,
      error: found.parseError
        ? `JSONを読めません: ${found.parseError}`
        : "取り込みのJSONが見つかりません",
    };
  return { ok: true, json: found.matches[0] };
}

function findImportJson(text: string): {
  matches: string[];
  parseError?: string;
} {
  const candidates: string[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (depth === 0) {
      if (character === "{") {
        start = index;
        depth = 1;
      }
      continue;
    }
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') {
      inString = true;
      continue;
    }
    if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        candidates.push(text.slice(start, index + 1));
        start = -1;
      }
    }
  }

  const matches: string[] = [];
  let parseError: string | undefined;
  for (const candidate of candidates) {
    try {
      const value: unknown = JSON.parse(candidate);
      if (isRecord(value) && "lifeLauncherImport" in value)
        matches.push(candidate);
    } catch (error) {
      parseError ??= error instanceof Error ? error.message : String(error);
    }
  }
  return { matches, parseError };
}

const SPACE_ENTITY = /^&(?:#x20|#32|#160|#xa0|nbsp);/i;

/** Undo what a Markdown copy does to a JSON answer, outside JSON strings only. */
function repairOutsideStrings(text: string): string {
  let output = "";
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (inString) {
      output += character;
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === "\\") {
      const next = text[index + 1];
      if (next === "\n" || (next === "\r" && text[index + 2] === "\n")) continue;
      if (next === "{" || next === "}" || next === "[" || next === "]") continue;
    }
    if (character === "&") {
      const entity = SPACE_ENTITY.exec(text.slice(index, index + 8));
      if (entity) {
        output += " ";
        index += entity[0].length - 1;
        continue;
      }
    }
    if (character === "\u00A0" || character === "\uFEFF") {
      output += " ";
      continue;
    }
    output += character;
    if (depth === 0) {
      if (character === "{") depth = 1;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "{") depth += 1;
    else if (character === "}") depth -= 1;
  }
  return output;
}

/** Read the shape of one answer and check the v1.6.3 limits. */
export function parseDemoImport(json: string): ParseDemoImportResult {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    return { ok: false, error: "JSONを読めません" };
  }
  if (!isRecord(value)) return { ok: false, error: "取り込みの形式が違います" };
  if (value.lifeLauncherImport !== 1)
    return { ok: false, error: "lifeLauncherImport: 1 が見つかりません" };
  const rawProjects = value.projects ?? [];
  const rawWishes = value.wishes ?? [];
  if (!Array.isArray(rawProjects))
    return { ok: false, error: "projects は配列で書いてください" };
  if (!Array.isArray(rawWishes))
    return { ok: false, error: "wishes は配列で書いてください" };
  if (rawProjects.length > IMPORT_MAX_PROJECTS)
    return { ok: false, error: "プロジェクトは30件までです" };

  const ignoredFields: string[] = [];
  const projects: ParsedImportProject[] = [];
  let wishCount = 0;

  for (let index = 0; index < rawProjects.length; index += 1) {
    const raw = rawProjects[index];
    if (!isRecord(raw))
      return { ok: false, error: `projects[${index}] の形式が違います` };
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    if (!name) return { ok: false, error: `projects[${index}].name が空です` };
    if (name.length > MAX_NAME)
      return {
        ok: false,
        error: `projects[${index}].name は120文字までです`,
      };

    let goal: string | undefined;
    if (raw.goal !== undefined && raw.goal !== null) {
      if (typeof raw.goal !== "string")
        return { ok: false, error: `projects[${index}].goal の形式が違います` };
      const trimmed = raw.goal.trim();
      if (trimmed.length > MAX_GOAL)
        return {
          ok: false,
          error: `projects[${index}].goal は60文字までです`,
        };
      goal = trimmed || undefined;
    }

    let nextStep: string | undefined;
    if (raw.nextStep !== undefined && raw.nextStep !== null) {
      const step = raw.nextStep;
      if (typeof step === "string") {
        const text = step.trim();
        if (text.length > MAX_STEP)
          return {
            ok: false,
            error: `projects[${index}].nextStep は120文字までです`,
          };
        nextStep = text || undefined;
      } else if (isRecord(step)) {
        const text = typeof step.text === "string" ? step.text.trim() : "";
        if (!text)
          return {
            ok: false,
            error: `projects[${index}].nextStep.text が空です`,
          };
        if (text.length > MAX_STEP)
          return {
            ok: false,
            error: `projects[${index}].nextStep.text は120文字までです`,
          };
        nextStep = text;
        for (const field of ["trigger", "minutes", "shortMinutes"])
          if (field in step)
            ignoredFields.push(`projects[${index}].nextStep.${field}`);
      } else {
        return {
          ok: false,
          error: `projects[${index}].nextStep の形式が違います`,
        };
      }
    }

    const rawProjectWishes = raw.wishes ?? [];
    if (!Array.isArray(rawProjectWishes))
      return {
        ok: false,
        error: `projects[${index}].wishes は配列で書いてください`,
      };
    const wishes: string[] = [];
    for (
      let wishIndex = 0;
      wishIndex < rawProjectWishes.length;
      wishIndex += 1
    ) {
      const text =
        typeof rawProjectWishes[wishIndex] === "string"
          ? rawProjectWishes[wishIndex].trim()
          : "";
      if (!text) continue;
      if (text.length > MAX_WISH)
        return {
          ok: false,
          error: `projects[${index}].wishes[${wishIndex}] は120文字までです`,
        };
      wishes.push(text);
    }
    wishCount += wishes.length;
    projects.push({
      name,
      color: importColor(raw.color),
      goal,
      nextStep,
      wishes,
    });
  }

  const wishes: string[] = [];
  for (let index = 0; index < rawWishes.length; index += 1) {
    const text =
      typeof rawWishes[index] === "string" ? rawWishes[index].trim() : "";
    if (!text) continue;
    if (text.length > MAX_WISH)
      return {
        ok: false,
        error: `wishes[${index}] は120文字までです`,
      };
    wishes.push(text);
  }
  wishCount += wishes.length;
  if (wishCount > IMPORT_MAX_WISHES)
    return { ok: false, error: "やりたいことは合計100件までです" };

  return { ok: true, parsed: { projects, wishes, ignoredFields } };
}

/** Plan the preview rows with the same keys the Windows build uses. */
export function buildDemoImportPlan(
  state: DemoState,
  parsed: ParsedDemoImport,
  excludedKeys: readonly string[],
): DemoImportPlan {
  const excluded = new Set(excludedKeys);
  const groups: DemoImportGroup[] = [];

  parsed.projects.forEach((project, index) => {
    const key = `p${index}`;
    const existing = state.projects.find(
      (candidate) => candidate.name.trim() === project.name,
    );
    const rows: DemoImportRow[] = [];
    const addedTexts = new Set<string>();

    if (existing) {
      const wishTexts = new Set(
        state.wishlist
          .filter((item) => item.projectId === existing.id)
          .map((item) => item.label.trim()),
      );
      if (project.nextStep) {
        if (!existing.nextStep) {
          if (!addedTexts.has(project.nextStep)) {
            rows.push({
              key: `${key}.step`,
              kind: "step",
              text: project.nextStep,
            });
            addedTexts.add(project.nextStep);
          }
        } else if (project.nextStep !== existing.nextStep) {
          if (
            !addedTexts.has(project.nextStep) &&
            !wishTexts.has(project.nextStep)
          ) {
            rows.push({
              key: `${key}.step`,
              kind: "wish",
              text: project.nextStep,
              reason: "次の一手が既にあるため、やりたいことへ追加",
            });
            addedTexts.add(project.nextStep);
          }
        }
      }
      project.wishes.forEach((text, wishIndex) => {
        if (
          addedTexts.has(text) ||
          wishTexts.has(text) ||
          text === existing.nextStep
        )
          return;
        rows.push({ key: `${key}.w${wishIndex}`, kind: "wish", text });
        addedTexts.add(text);
      });
      const notes: string[] = [];
      if (project.goal && !existing.goal)
        notes.push(`目標を「${project.goal}」で補います`);
      groups.push({
        key,
        name: project.name,
        isNew: false,
        color: existing.color,
        goal: project.goal,
        ...(notes.length > 0 ? { note: notes.join("・") } : {}),
        excluded: excluded.has(key),
        rows,
      });
      return;
    }

    if (project.nextStep) {
      rows.push({
        key: `${key}.step`,
        kind: "step",
        text: project.nextStep,
      });
      addedTexts.add(project.nextStep);
    }
    project.wishes.forEach((text, wishIndex) => {
      if (addedTexts.has(text)) return;
      rows.push({ key: `${key}.w${wishIndex}`, kind: "wish", text });
      addedTexts.add(text);
    });
    groups.push({
      key,
      name: project.name,
      isNew: true,
      color: project.color,
      goal: project.goal,
      excluded: excluded.has(key),
      rows,
    });
  });

  const looseRows: DemoImportRow[] = [];
  const looseTexts = new Set(
    state.wishlist
      .filter((item) => !item.projectId)
      .map((item) => item.label.trim()),
  );
  parsed.wishes.forEach((text, index) => {
    if (looseTexts.has(text)) return;
    looseTexts.add(text);
    looseRows.push({ key: `w${index}`, kind: "wish", text });
  });
  if (looseRows.length > 0) {
    groups.push({
      key: null,
      name: "プロジェクトなし",
      isNew: false,
      excluded: false,
      rows: looseRows,
    });
  }

  return {
    groups,
    ignoredFields: parsed.ignoredFields,
    fingerprint: stateFingerprint(state),
  };
}

/** How many items a project frame imports; a new project with no rows still counts. */
export function demoImportGroupCount(
  group: DemoImportGroup,
  projectOff: boolean,
  rowOff: ReadonlySet<string>,
): number {
  if (group.key !== null && projectOff) return 0;
  if (group.rows.length === 0) return group.isNew ? 1 : 0;
  return group.rows.filter((row) => !rowOff.has(row.key)).length;
}

const uniqueId = (base: string, used: Set<string>): string => {
  let id = base;
  let suffix = 2;
  while (used.has(id)) id = `${base}-${suffix++}`;
  used.add(id);
  return id;
};

/** Apply only the checked parts; every other part of the state is left untouched. */
export function applyDemoImport(
  state: DemoState,
  parsed: ParsedDemoImport,
  excludedKeys: readonly string[],
): { projects: DemoProject[]; wishlist: DemoWishlistItem[] } {
  const plan = buildDemoImportPlan(state, parsed, excludedKeys);
  const excluded = new Set(excludedKeys);
  const projects = [...state.projects];
  const wishlist = [...state.wishlist];
  const projectIds = new Set(projects.map((project) => project.id));
  const wishlistIds = new Set(wishlist.map((item) => item.id));

  for (const group of plan.groups) {
    if (group.key !== null && excluded.has(group.key)) continue;

    if (group.key === null) {
      for (const row of group.rows) {
        if (excluded.has(row.key)) continue;
        wishlist.push({
          id: uniqueId(`import-wish-${row.key}`, wishlistIds),
          label: row.text,
        });
      }
      continue;
    }

    const index = Number.parseInt(group.key.slice(1), 10);
    const source = parsed.projects[index];
    if (!source) continue;
    let project = projects.find(
      (candidate) => candidate.name.trim() === group.name,
    );
    if (!project) {
      project = {
        id: uniqueId(`import-project-${index + 1}`, projectIds),
        name: source.name,
        color: source.color,
        ...(source.goal ? { goal: source.goal } : {}),
      };
      projects.push(project);
    } else if (source.goal && !project.goal) {
      const updated: DemoProject = { ...project, goal: source.goal };
      projects[projects.indexOf(project)] = updated;
      project = updated;
    }

    for (const row of group.rows) {
      if (excluded.has(row.key)) continue;
      if (row.kind === "step") {
        const updated: DemoProject = {
          ...project,
          nextStep: row.text,
          resumeNote: undefined,
        };
        projects[projects.indexOf(project)] = updated;
        project = updated;
      } else {
        wishlist.push({
          id: uniqueId(
            `import-wish-${group.key}-${row.key.split(".").pop() ?? "1"}`,
            wishlistIds,
          ),
          label: row.text,
          projectId: project.id,
        });
      }
    }
  }

  return { projects, wishlist };
}

export const SAMPLE_IMPORT_RESPONSE = `ありがとうございます。次の内容で提案します。

\`\`\`json
{
  "lifeLauncherImport": 1,
  "projects": [
    {
      "name": "英語",
      "color": "cyan",
      "goal": "仕事で使える英語を身につける",
      "nextStep": {
        "text": "単語帳を開いて20個だけ音読する",
        "trigger": "朝のコーヒーの後",
        "minutes": 20,
        "shortMinutes": 5
      },
      "wishes": [
        "オンライン英会話の体験レッスンを予約する",
        "英文メールの下書きを1通書く"
      ]
    },
    {
      "name": "読書",
      "color": "amber",
      "goal": "読みたい本を1冊読み終える",
      "wishes": ["読みかけの本を開いて次の見出しまで10分読む"]
    }
  ],
  "wishes": ["気になっていた記事を1つブックマークする"]
}
\`\`\`
`;

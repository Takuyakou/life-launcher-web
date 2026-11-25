import { describe, expect, it } from "vitest";
import {
  applyDemoImport,
  buildDemoImportPlan,
  buildImportCurrentState,
  demoImportGroupCount,
  extractImportJson,
  IMPORT_MAX_BYTES,
  IMPORT_PROMPT_FIRST,
  IMPORT_PROMPT_REPEAT,
  importColor,
  parseDemoImport,
  SAMPLE_IMPORT_RESPONSE,
} from "./importDemo";
import { createDemoSeed } from "./seed";
import { stateFingerprint } from "./types";
import type { ParsedDemoImport } from "./importDemo";

const fixedNow = new Date("2026-08-14T09:00:00.000Z");
const seed = () => createDemoSeed(fixedNow);
// W21-08: 初期データのやりたいことは2件になった。プロジェクトなしの1件は、ここで足す。
const seedWithLoose = () => {
  const base = seed();
  return {
    ...base,
    wishlist: [...base.wishlist, { id: "wish-walk", label: "近所をゆっくり歩く" }],
  };
};

const parsed = (value: unknown): ParsedDemoImport => {
  const result = parseDemoImport(JSON.stringify(value));
  if (!result.ok) throw new Error(result.error);
  return result.parsed;
};

const base = (overrides: Record<string, unknown> = {}) => ({
  lifeLauncherImport: 1,
  projects: [],
  wishes: [],
  ...overrides,
});

describe("import prompt", () => {
  it("keeps the v1.6.3 answer shape and the current-state slot", () => {
    expect(IMPORT_PROMPT_FIRST).toContain("```json");
    expect(IMPORT_PROMPT_FIRST).toContain('"lifeLauncherImport": 1');
    expect(IMPORT_PROMPT_FIRST).toContain('"shortMinutes": 5');
    expect(IMPORT_PROMPT_REPEAT).toContain("今のアプリの内容:\n{CURRENT_STATE}");
    expect(IMPORT_PROMPT_REPEAT).toContain("amber, blue, green, violet");
  });

  it("describes the current projects and wishes for the repeat prompt", () => {
    const text = buildImportCurrentState(seedWithLoose());
    expect(text).toContain("学習(色: violet)");
    expect(text).toContain("目標: 参考書を1冊終える");
    expect(text).toContain("次の一手: 参考書を10ページ進める");
    expect(text).toContain("やりたいこと: 英単語を20個復習する");
    expect(text).toContain("プロジェクトなしのやりたいこと: 近所をゆっくり歩く");
    expect(buildImportCurrentState({ ...seed(), projects: [], wishlist: [] })).toBe(
      "(まだ何もありません)",
    );
  });
});

describe("extractImportJson", () => {
  it("reads a bare JSON answer, a fenced answer and prose around it", () => {
    const answer = JSON.stringify(base());
    expect(extractImportJson(answer)).toEqual({ ok: true, json: answer });

    const fenced = `説明です。\n\`\`\`json\n${JSON.stringify(base(), null, 2)}\n\`\`\`\n以上です。`;
    const extracted = extractImportJson(fenced);
    expect(extracted.ok).toBe(true);
    if (extracted.ok) expect(JSON.parse(extracted.json)).toMatchObject({ lifeLauncherImport: 1 });
  });

  it("does not mistake braces inside JSON strings for the end of the object", () => {
    const value = base({ wishes: ["{ } を含むメモ", "終わり } も文字列"] });
    const text = `前置き {not json} と本文\n${JSON.stringify(value)}`;
    const extracted = extractImportJson(text);
    expect(extracted.ok).toBe(true);
    if (extracted.ok)
      expect(JSON.parse(extracted.json)).toMatchObject({
        wishes: value.wishes,
      });
  });

  it("rejects two JSON blocks", () => {
    const text = `${JSON.stringify(base())}\n${JSON.stringify(base())}`;
    expect(extractImportJson(text)).toEqual({
      ok: false,
      error: "取り込みのJSONが2つ以上あります。1つだけにしてください",
    });
  });

  it("repairs Markdown damage outside strings only", () => {
    const lineBroken = `{
      "lifeLauncherImport": 1, \\
      "projects": [ { "name": "A" } ], \\
      "wishes": []
    }`;
    const lineFixed = extractImportJson(lineBroken);
    expect(lineFixed.ok).toBe(true);
    if (lineFixed.ok)
      expect(JSON.parse(lineFixed.json)).toMatchObject({
        projects: [{ name: "A" }],
      });

    const entityBroken = `{
      "lifeLauncherImport": 1,&nbsp;
      "projects": []
    }`;
    const entityFixed = extractImportJson(entityBroken);
    expect(entityFixed.ok).toBe(true);

    const escapedBraces = `\\{ "lifeLauncherImport": 1, "projects": [], "wishes": [] \\}`;
    const bracesFixed = extractImportJson(escapedBraces);
    expect(bracesFixed.ok).toBe(true);

    // Inside a string the same text must survive untouched.
    const inString = `{"lifeLauncherImport": 1, "projects": [], "wishes": ["a&nbsp;b"]}`;
    const kept = extractImportJson(inString);
    expect(kept.ok).toBe(true);
    if (kept.ok)
      expect(JSON.parse(kept.json)).toMatchObject({ wishes: ["a&nbsp;b"] });

    expect(extractImportJson('{"lifeLauncherImport": 1, "projects": [')).toEqual({
      ok: false,
      error: "取り込みのJSONが見つかりません",
    });
  });

  it("counts the 256 KB limit in UTF-8 bytes, not characters", () => {
    const big = `あ${"い".repeat(90000)}`;
    expect(big.length).toBeLessThan(IMPORT_MAX_BYTES);
    expect(extractImportJson(big)).toEqual({
      ok: false,
      error: "256 KBを超えています",
    });

    const smaller = `あ${"い".repeat(80000)}`;
    const result = extractImportJson(smaller);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).not.toBe("256 KBを超えています");
  });

  it("explains when no JSON was given", () => {
    expect(extractImportJson("ただの文章です")).toEqual({
      ok: false,
      error: "取り込みのJSONが見つかりません",
    });
  });
});

describe("parseDemoImport", () => {
  it("reads projects, next steps, wishes and the ignored timer fields", () => {
    const result = parseDemoImport(
      JSON.stringify(
        base({
          projects: [
            {
              name: "英語",
              color: "cyan",
              goal: "仕事で使える英語",
              nextStep: {
                text: "単語を20個音読する",
                trigger: "朝",
                minutes: 20,
                shortMinutes: 5,
              },
              wishes: ["体験レッスンを予約する"],
            },
          ],
          wishes: ["記事を読む"],
        }),
      ),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.parsed.projects[0]).toMatchObject({
      name: "英語",
      color: "blue",
      goal: "仕事で使える英語",
      nextStep: "単語を20個音読する",
      wishes: ["体験レッスンを予約する"],
    });
    expect(result.parsed.ignoredFields).toEqual([
      "projects[0].nextStep.trigger",
      "projects[0].nextStep.minutes",
      "projects[0].nextStep.shortMinutes",
    ]);
  });

  it("accepts each of the 12 colours and folds unknown values to blue", () => {
    expect(importColor("amber")).toBe("amber");
    expect(importColor("ORANGE")).toBe("amber");
    expect(importColor("sand")).toBe("amber");
    expect(importColor("coral")).toBe("amber");
    expect(importColor("green")).toBe("green");
    expect(importColor("Lime")).toBe("green");
    expect(importColor("blue")).toBe("blue");
    expect(importColor("cyan")).toBe("blue");
    expect(importColor("slate")).toBe("blue");
    expect(importColor("violet")).toBe("violet");
    expect(importColor("rose")).toBe("violet");
    expect(importColor("magenta")).toBe("violet");
    expect(importColor("pink")).toBe("blue");
    expect(importColor(undefined)).toBe("blue");
  });

  it("rejects more than 30 projects and more than 100 wishes", () => {
    const projects = Array.from({ length: 31 }, (_, index) => ({
      name: `P${index}`,
    }));
    expect(parseDemoImport(JSON.stringify(base({ projects })))).toEqual({
      ok: false,
      error: "プロジェクトは30件までです",
    });

    const wishes = Array.from({ length: 101 }, (_, index) => `W${index}`);
    expect(parseDemoImport(JSON.stringify(base({ wishes })))).toEqual({
      ok: false,
      error: "やりたいことは合計100件までです",
    });

    const projectWishes = Array.from({ length: 100 }, (_, index) => `W${index}`);
    expect(
      parseDemoImport(
        JSON.stringify(
          base({ projects: [{ name: "A", wishes: projectWishes }], wishes: ["もう1件"] }),
        ),
      ),
    ).toEqual({ ok: false, error: "やりたいことは合計100件までです" });
  });

  it("enforces the string limits", () => {
    expect(
      parseDemoImport(
        JSON.stringify(base({ projects: [{ name: "あ".repeat(121) }] })),
      ),
    ).toEqual({ ok: false, error: "projects[0].name は120文字までです" });
    expect(
      parseDemoImport(
        JSON.stringify(
          base({ projects: [{ name: "A", goal: "あ".repeat(61) }] }),
        ),
      ),
    ).toEqual({ ok: false, error: "projects[0].goal は60文字までです" });
    expect(
      parseDemoImport(
        JSON.stringify(
          base({
            projects: [{ name: "A", nextStep: { text: "あ".repeat(121) } }],
          }),
        ),
      ),
    ).toEqual({ ok: false, error: "projects[0].nextStep.text は120文字までです" });
    expect(
      parseDemoImport(
        JSON.stringify(base({ wishes: ["あ".repeat(121)] })),
      ),
    ).toEqual({ ok: false, error: "wishes[0] は120文字までです" });
  });

  it("rejects a missing version marker or a broken answer", () => {
    expect(parseDemoImport("{}")).toEqual({
      ok: false,
      error: "lifeLauncherImport: 1 が見つかりません",
    });
    expect(parseDemoImport("{")).toEqual({ ok: false, error: "JSONを読めません" });
  });
});

describe("buildDemoImportPlan", () => {
  it("splits new, existing and unassigned rows and skips duplicates", () => {
    const state = seedWithLoose();
    const plan = buildDemoImportPlan(
      state,
      parsed({
        lifeLauncherImport: 1,
        projects: [
          {
            name: "英語",
            color: "cyan",
            goal: "仕事で使える英語",
            nextStep: { text: "単語を20個音読する" },
            wishes: ["体験レッスンを予約する", "体験レッスンを予約する"],
          },
          {
            name: "読書",
            nextStep: { text: "新しい一手" },
            wishes: ["気になっていた本を読む", "読みかけの本を10分読む"],
          },
          { name: "学習", wishes: ["参考書を1ページ写す"] },
        ],
        wishes: ["近所をゆっくり歩く", "記事を1本読む"],
      }),
      [],
    );
    expect(plan.fingerprint).toBe(stateFingerprint(state));
    const english = plan.groups.find((group) => group.name === "英語")!;
    expect(english).toMatchObject({ key: "p0", isNew: true, color: "blue" });
    expect(english.rows.map((row) => row.text)).toEqual([
      "単語を20個音読する",
      "体験レッスンを予約する",
    ]);

    const reading = plan.groups.find((group) => group.name === "読書")!;
    expect(reading.isNew).toBe(false);
    expect(reading.rows).toEqual([
      {
        key: "p1.step",
        kind: "wish",
        text: "新しい一手",
        reason: "次の一手が既にあるため、やりたいことへ追加",
      },
      { key: "p1.w1", kind: "wish", text: "読みかけの本を10分読む" },
    ]);

    const study = plan.groups.find((group) => group.name === "学習")!;
    expect(study.rows).toEqual([
      { key: "p2.w0", kind: "wish", text: "参考書を1ページ写す" },
    ]);

    const loose = plan.groups.find((group) => group.key === null)!;
    expect(loose.rows).toEqual([
      { key: "w1", kind: "wish", text: "記事を1本読む" },
    ]);
  });

  it("records the checked state used to build the plan", () => {
    const plan = buildDemoImportPlan(
      seed(),
      parsed(base({ projects: [{ name: "英語" }] })),
      ["p0"],
    );
    expect(plan.groups[0].excluded).toBe(true);
    expect(demoImportGroupCount(plan.groups[0], true, new Set())).toBe(0);
    expect(demoImportGroupCount(plan.groups[0], false, new Set())).toBe(1);
  });
});

describe("applyDemoImport", () => {
  it("adds a new project, its rows and the loose wishes", () => {
    const state = seed();
    const result = applyDemoImport(
      state,
      parsed({
        lifeLauncherImport: 1,
        projects: [
          {
            name: "英語",
            color: "cyan",
            goal: "仕事で使える英語",
            nextStep: { text: "単語を20個音読する" },
            wishes: ["体験レッスンを予約する"],
          },
        ],
        wishes: ["記事を1本読む"],
      }),
      [],
    );
    const english = result.projects.find((project) => project.name === "英語")!;
    expect(english).toMatchObject({
      color: "blue",
      goal: "仕事で使える英語",
      nextStep: "単語を20個音読する",
    });
    expect(
      result.wishlist.filter((item) => item.projectId === english.id).map((item) => item.label),
    ).toEqual(["体験レッスンを予約する"]);
    expect(result.wishlist.some((item) => item.label === "記事を1本読む")).toBe(true);
    expect(result.projects.slice(0, state.projects.length)).toEqual(state.projects);
  });

  it("applies nothing for a frame whose head tick was removed", () => {
    const state = seed();
    const result = applyDemoImport(
      state,
      parsed({
        lifeLauncherImport: 1,
        projects: [
          {
            name: "英語",
            color: "rose",
            goal: "補うはずのない目標",
            nextStep: { text: "追加しない一手" },
            wishes: ["追加しないやりたいこと"],
          },
          {
            name: "読書",
            goal: "補うはずのない目標",
            wishes: ["追加しない wish"],
          },
        ],
        wishes: ["追加しないトップ"],
      }),
      ["p0", "p1", "w0"],
    );
    expect(result.projects).toEqual(state.projects);
    expect(result.wishlist).toEqual(state.wishlist);
  });

  it("fills a missing goal on an existing project and keeps the other fields", () => {
    const state = seed();
    state.projects = state.projects.map((project) =>
      project.id === "study" ? { ...project, goal: undefined } : project,
    );
    const result = applyDemoImport(
      state,
      parsed(base({ projects: [{ name: "学習", goal: "補った目標" }] })),
      [],
    );
    const study = result.projects.find((project) => project.id === "study")!;
    expect(study.goal).toBe("補った目標");
    expect(study.color).toBe("violet");
    expect(study.nextStep).toBe("参考書を10ページ進める");
  });

  it("sets the next step of a project that had none and clears the resume note", () => {
    const state = seed();
    state.projects = state.projects.map((project) =>
      project.id === "reading"
        ? { ...project, nextStep: undefined, resumeNote: "3章のp.84から" }
        : project,
    );
    const result = applyDemoImport(
      state,
      parsed(
        base({
          projects: [{ name: "読書", nextStep: { text: "2章から読み直す" } }],
        }),
      ),
      [],
    );
    const updated = result.projects.find((project) => project.id === "reading")!;
    expect(updated.nextStep).toBe("2章から読み直す");
    expect(updated.resumeNote).toBeUndefined();
  });

  it("adds a next step for an existing project to the wishlist instead of replacing it", () => {
    const state = seed();
    const result = applyDemoImport(
      state,
      parsed(
        base({
          projects: [{ name: "読書", nextStep: { text: "2章から読み直す" } }],
        }),
      ),
      [],
    );
    const updated = result.projects.find((project) => project.id === "reading")!;
    expect(updated.nextStep).toBe("数分だけ読む");
    expect(updated.resumeNote).toBe("3章のp.84から");
    expect(
      result.wishlist.find(
        (item) => item.projectId === "reading" && item.label === "2章から読み直す",
      ),
    ).toBeTruthy();
  });

  it("leaves the timer, Today 3 and sessions untouched", () => {
    const state = seed();
    const result = applyDemoImport(
      state,
      parsed(base({ projects: [{ name: "英語" }], wishes: ["記事を読む"] })),
      [],
    );
    expect(result.projects.length).toBe(state.projects.length + 1);
    // applyDemoImport only returns projects and wishlist: the reducer keeps the rest.
    expect(Object.keys(result).sort()).toEqual(["projects", "wishlist"]);
    expect(state.todayItems).toHaveLength(2);
    expect(state.sessions).toHaveLength(1);
  });
});

describe("the one-click sample", () => {
  it("shows a new project, an existing addition and a loose wish in one answer", () => {
    const extracted = extractImportJson(SAMPLE_IMPORT_RESPONSE);
    expect(extracted.ok).toBe(true);
    if (!extracted.ok) return;
    const result = parseDemoImport(extracted.json);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.parsed.projects.map((project) => project.name)).toEqual([
      "英語",
      "読書",
    ]);
    expect(result.parsed.projects[0].color).toBe("blue");
    expect(result.parsed.projects[0].nextStep).toBe(
      "単語帳を開いて20個だけ音読する",
    );
    expect(result.parsed.wishes).toEqual(["気になっていた記事を1つブックマークする"]);
    expect(result.parsed.ignoredFields.length).toBe(3);
  });
});

import {
  DemoScreenSection,
  FinalSection,
  FlowSection,
  Hero,
  ScopeSection,
  SiteFooter,
  SiteHeader,
} from "./landing/Landing";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CompletionDialog,
  type CompletionMode,
} from "./components/CompletionDialog";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { DemoDictionary } from "./components/DemoDictionary";
import { DemoWindow } from "./components/DemoWindow";
import { createDemoSeed } from "./demo/seed";
import { demoReducer } from "./demo/reducer";
import {
  LEGACY_STORAGE_KEY,
  loadDemoState,
  saveDemoState,
  V2_STORAGE_KEY,
} from "./demo/storage";
import {
  nextStepSourceId,
  sourceLockedByUnfinishedToday,
  todayItemFromCandidate,
} from "./demo/todayBuilder";
import type {
  DemoAction,
  DemoBuilderCandidate,
  DemoProject,
  DemoTodayItem,
  DemoWishlistItem,
} from "./demo/types";
import { stateFingerprint } from "./demo/types";
import type { ParsedDemoImport } from "./demo/importDemo";

type ToastState = {
  id: number;
  message: string;
  tone: "info" | "success";
  undo?: boolean;
} | null;

type UndoSnapshot = {
  projects: DemoProject[];
  wishlist: DemoWishlistItem[];
  afterFingerprint: string;
};

const UNDO_TIMEOUT_MS = 5000;

function App() {
  const [state, setState] = useState(() => {
    const seed = createDemoSeed(new Date());
    try {
      return loadDemoState(window.localStorage, seed);
    } catch {
      return seed;
    }
  });
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [undo, setUndo] = useState<UndoSnapshot | null>(null);
  const demoRef = useRef<HTMLElement>(null);
  const stateRef = useRef(state);
  const undoRef = useRef<UndoSnapshot | null>(null);
  const undoTimerRef = useRef<number | null>(null);
  const undoRemainingRef = useRef(0);
  const undoStartedRef = useRef(0);
  const dispatch = useCallback((action: DemoAction): boolean => {
    const next = demoReducer(stateRef.current, action);
    if (next === stateRef.current) return false;
    const volatile =
      [
        "TICK_TIMER",
        "FINISH_TIMER",
        "EXTEND_TIMER",
        "PAUSE_TIMER",
        "RESUME_TIMER",
        "ADVANCE_TO_EARLY_THRESHOLD",
      ].includes(action.type) ||
      (action.type === "REQUEST_STOP_TIMER" && next.timer.status === "early");
    let saved = volatile;
    if (!volatile) {
      try {
        saved = saveDemoState(window.localStorage, next);
      } catch {
        saved = false;
      }
    }
    if (!saved) {
      setToast({
        id: Date.now(),
        message: "保存できませんでした。変更前の状態を保持しています。",
        tone: "info",
      });
      return false;
    }
    stateRef.current = next;
    setState(next);
    // Any other saved change ends the "元に戻す" window for an import.
    if (!volatile && undoRef.current) {
      undoRef.current = null;
      setUndo(null);
      if (undoTimerRef.current !== null) {
        window.clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
      setToast((current) => (current?.undo ? { ...current, undo: false } : current));
    }
    return true;
  }, []);

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const dropUndo = useCallback(() => {
    clearUndoTimer();
    undoRef.current = null;
    setUndo(null);
  }, [clearUndoTimer]);

  const armUndo = useCallback(
    (milliseconds: number) => {
      clearUndoTimer();
      undoRemainingRef.current = milliseconds;
      undoStartedRef.current = Date.now();
      undoTimerRef.current = window.setTimeout(() => {
        undoTimerRef.current = null;
        undoRef.current = null;
        setUndo(null);
        setToast((current) => (current?.undo ? null : current));
      }, milliseconds);
    },
    [clearUndoTimer],
  );

  const pauseUndo = useCallback(() => {
    if (undoTimerRef.current === null) return;
    clearUndoTimer();
    undoRemainingRef.current = Math.max(
      0,
      undoRemainingRef.current - (Date.now() - undoStartedRef.current),
    );
  }, [clearUndoTimer]);

  const resumeUndo = useCallback(() => {
    if (!undoRef.current || undoTimerRef.current !== null) return;
    if (undoRemainingRef.current <= 0) {
      dropUndo();
      setToast((current) => (current?.undo ? null : current));
      return;
    }
    armUndo(undoRemainingRef.current);
  }, [armUndo, dropUndo]);
  const completionProject = state.projects.find(
    (project) => project.id === state.timer.projectId,
  );
  const completion =
    state.timer.status === "finished"
      ? {
          projectId: completionProject?.id ?? "",
          projectName: state.timer.projectName,
          nextStep: completionProject?.nextStep ?? "",
          label: state.timer.label,
          durationMinutes: Math.round(state.timer.durationSeconds / 60),
        }
      : null;
  const completionSourceId = completion?.projectId
    ? nextStepSourceId(completion.projectId)
    : "";
  const completionTodaySourceId = state.todayItems.find(
    (item) => item.id === state.timer.todayItemId,
  )?.sourceId;
  const completionEditable =
    Boolean(completion?.projectId) &&
    (!sourceLockedByUnfinishedToday(state, completionSourceId) ||
      completionTodaySourceId === completionSourceId);
  const completionMode: CompletionMode = !completion
    ? "plain"
    : !state.timer.todayItemId && completion.projectId
      ? "resume"
      : completionEditable && completionTodaySourceId === completionSourceId
        ? "nextStep"
        : "plain";

  useEffect(() => {
    if (state.timer.status !== "running") return;
    const timerId = window.setInterval(() => {
      dispatch({ type: "TICK_TIMER" });
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [dispatch, state.timer.status]);

  useEffect(() => {
    if (!toast || toast.undo) return;
    const timeoutId = window.setTimeout(() => setToast(null), 3400);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const showNativeToast = (label: string) => {
    setToast({
      id: Date.now(),
      message: `${label}はWindows版で実行できます。登録したアプリ・ファイル・URLを実際に開けます。`,
      tone: "info",
    });
  };

  const startTimer = (
    label: string,
    projectId: string,
    projectName: string,
    durationSeconds: number,
    todayItemId?: string,
    mode?: "countdown" | "measure",
  ) => {
    if (
      !dispatch({
        type: "START_TIMER",
        mode,
        todayItemId,
        now: new Date(),
        label,
        projectId,
        projectName,
        durationSeconds,
      })
    )
      return;
  };

  const stopTimer = () => {
    if (!dispatch({ type: "REQUEST_STOP_TIMER", now: new Date() })) return;
    if (stateRef.current.timer.status === "early") return;
    setToast({
      id: Date.now(),
      message: "今日の実行にサンプル記録を追加しました",
      tone: "success",
    });
  };

  const completeTimerDemo = () => {
    dispatch({ type: "FINISH_TIMER" });
  };

  const confirmEarlyTimer = (complete: boolean) => {
    if (!dispatch({ type: "CONFIRM_EARLY_TIMER", now: new Date(), complete }))
      return;
    setToast({
      id: Date.now(),
      message: complete
        ? "今日の分は完了しました"
        : "未完了のまま実行記録を残しました",
      tone: "success",
    });
  };

  const addTodayCandidate = (candidate: DemoBuilderCandidate) => {
    if (state.todayItems.some((item) => item.sourceId === candidate.sourceId))
      return false;
    if (state.todayItems.length >= 3) {
      setToast({
        id: Date.now(),
        message: "今日の3件は3件までです。今日やることだけに絞ります。",
        tone: "info",
      });
      return false;
    }
    if (
      !dispatch({
        type: "ADD_TODAY_ITEM",
        item: todayItemFromCandidate(candidate),
      })
    )
      return false;
    setToast({
      id: Date.now(),
      message: `${candidate.label}を今日の3件に追加しました`,
      tone: "success",
    });
    return true;
  };

  const removeTodayItem = (id: string) => {
    if (!dispatch({ type: "REMOVE_TODAY_ITEM", id })) return false;
    setToast({
      id: Date.now(),
      message: "今日の3件から外しました",
      tone: "success",
    });
    return true;
  };

  const saveTodayPickerDraft = (
    todayItems: DemoTodayItem[],
    addedWishlist: DemoWishlistItem[],
    expectedFingerprint: string,
  ) => {
    if (
      !dispatch({
        type: "SAVE_TODAY_PICKER_DRAFT",
        todayItems,
        addedWishlist,
        expectedFingerprint,
      })
    )
      return false;
    setToast({
      id: Date.now(),
      message: "今日の3件を決定しました",
      tone: "success",
    });
    return true;
  };

  const commitImport = (
    parsed: ParsedDemoImport,
    excludedKeys: string[],
    expectedFingerprint: string,
    selectedCount: number,
  ) => {
    const previous = {
      projects: stateRef.current.projects,
      wishlist: stateRef.current.wishlist,
    };
    if (
      !dispatch({
        type: "COMMIT_IMPORT",
        parsed,
        excludedKeys,
        expectedFingerprint,
      })
    )
      return false;
    const snapshot: UndoSnapshot = {
      projects: previous.projects,
      wishlist: previous.wishlist,
      afterFingerprint: stateFingerprint(stateRef.current),
    };
    undoRef.current = snapshot;
    setUndo(snapshot);
    setToast({
      id: Date.now(),
      message: `${selectedCount}件を取り込みました`,
      tone: "success",
      undo: true,
    });
    armUndo(UNDO_TIMEOUT_MS);
    return true;
  };

  const undoImport = () => {
    const snapshot = undoRef.current;
    if (!snapshot) return;
    if (
      !dispatch({
        type: "UNDO_IMPORT",
        projects: snapshot.projects,
        wishlist: snapshot.wishlist,
        expectedFingerprint: snapshot.afterFingerprint,
      })
    ) {
      // Keep the snapshot so the button can be pressed again.
      setToast({
        id: Date.now(),
        message:
          "元に戻せませんでした。もう一度「元に戻す」を押してください。",
        tone: "info",
        undo: true,
      });
      return;
    }
    dropUndo();
    setToast({
      id: Date.now(),
      message: "取り込みを元に戻しました",
      tone: "success",
    });
  };

  const resetDemo = () => {
    if (!dispatch({ type: "RESET_DEMO", state: createDemoSeed(new Date()) }))
      return;
    try {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      window.localStorage.removeItem(V2_STORAGE_KEY);
    } catch {
      /* Current state was saved successfully. */
    }
    setDictionaryOpen(false);
    setResetOpen(false);
    setToast({
      id: Date.now(),
      message: "Web Demoを初期状態に戻しました",
      tone: "success",
    });
  };

  const focusDoNowStart = (kind: "short" | "normal") => {
    demoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.requestAnimationFrame(() => {
      demoRef.current
        ?.querySelector<HTMLButtonElement>(
          kind === "short" ? "[data-demo-do-now-short]" : "[data-demo-do-now-normal]",
        )
        ?.focus();
    });
  };
  void focusDoNowStart;

  return (
    <div className="lp-page">
      <ConfirmDialog
        open={state.timer.status === "early"}
        title="今日の分は完了にしますか？"
        description="予定より早く終わった場合でも、短時間以上取り組んでいれば今日の完了を選べます。元の次の一手・やりたいことは残ります。"
        confirmLabel="今日の分は完了"
        cancelLabel="未完了のまま終了"
        confirmTone="good"
        closeOnBackdrop={false}
        onConfirm={() => confirmEarlyTimer(true)}
        onCancel={() => confirmEarlyTimer(false)}
      />
      <a className="skip-link" href="#content">
        本文へ移動
      </a>
      <SiteHeader />

      <main id="content">
        <Hero />
        <FlowSection />

        <DemoScreenSection>
          <section aria-label="Life Launcher Web Demo" ref={demoRef}>
            <DemoWindow
              dispatch={dispatch}
              onAddTodayCandidate={addTodayCandidate}
              onRemoveTodayItem={removeTodayItem}
              onCommitImport={commitImport}
              onDemoComplete={completeTimerDemo}
              onNativeOnly={showNativeToast}
              onOpenDictionary={() => setDictionaryOpen(true)}
              onOpenReset={() => setResetOpen(true)}
              onPauseTimer={() => dispatch({ type: "PAUSE_TIMER" })}
              onResumeTimer={() => dispatch({ type: "RESUME_TIMER" })}
              onSaveTodayPickerDraft={saveTodayPickerDraft}
              onStartTimer={startTimer}
              onStopTimer={stopTimer}
              state={state}
            />
          </section>
        </DemoScreenSection>

        <ScopeSection />
        <FinalSection />
      </main>

      <SiteFooter />

      <DemoDictionary
        open={dictionaryOpen}
        onClose={() => setDictionaryOpen(false)}
        onNativeOnly={showNativeToast}
      />
      <ConfirmDialog
        confirmLabel="リセットする"
        description="勝利条件、今日の3件、次の一手、やりたいこと、候補の除外、タイマー、実行記録、開閉状態をサンプルに戻します。"
        onCancel={() => setResetOpen(false)}
        onConfirm={resetDemo}
        open={resetOpen}
        title="Web Demoをリセットしますか？"
      />
      <CompletionDialog
        durationMinutes={completion?.durationMinutes ?? 0}
        hasProject={Boolean(completion?.projectId)}
        initialNextStep={completion?.nextStep ?? ""}
        label={completion?.label ?? ""}
        mode={completionMode}
        onExtend={(minutes) => {
          dispatch({ type: "EXTEND_TIMER", minutes });
        }}
        onFinish={({ nextStep, resumeNote }) => {
          if (!completion) return;
          if (
            !dispatch({
              type: "CONFIRM_TIMER",
              now: new Date(),
              nextStep,
              resumeNote,
            })
          )
            return;
          setToast({
            id: Date.now(),
            message: nextStep
              ? "次の一手を更新しました"
              : resumeNote
                ? "次はここからを保存しました"
                : "今日の実行に記録しました",
            tone: "success",
          });
        }}
        open={Boolean(completion)}
        projectName={completion?.projectName ?? ""}
      />
      <div aria-atomic="true" aria-live="polite" className="toast-region">
        {toast ? (
          <div
            className={`toast toast-${toast.tone}${toast.undo ? " toast-undoable" : ""}`}
            key={toast.id}
            onBlur={resumeUndo}
            onFocus={pauseUndo}
            onMouseEnter={pauseUndo}
            onMouseLeave={resumeUndo}
          >
            <span>{toast.message}</span>
            {toast.undo && undo ? (
              <button
                className="toast-undo"
                onClick={undoImport}
                type="button"
              >
                元に戻す
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default App;

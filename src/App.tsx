import { useCallback, useEffect, useRef, useState } from "react";
import { CompletionDialog } from "./components/CompletionDialog";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { DemoDictionary } from "./components/DemoDictionary";
import { DemoFrame } from "./components/DemoFrame";
import { UiIcon } from "./components/UiIcon";
import { createDemoSeed } from "./demo/seed";
import { demoReducer } from "./demo/reducer";
import {
  LEGACY_STORAGE_KEY,
  loadDemoState,
  saveDemoState,
} from "./demo/storage";
import { todayItemFromCandidate } from "./demo/todayBuilder";
import type { DemoAction, DemoBuilderCandidate } from "./demo/types";

type ToastState = {
  id: number;
  message: string;
  tone: "info" | "success";
} | null;
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
  const demoRef = useRef<HTMLElement>(null);
  const stateRef = useRef(state);
  const dispatch = useCallback((action: DemoAction): boolean => {
    const next = demoReducer(stateRef.current, action);
    if (next === stateRef.current) return false;
    const volatile = [
      "TICK_TIMER",
      "FINISH_TIMER",
      "PAUSE_TIMER",
      "RESUME_TIMER",
    ].includes(action.type);
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
    return true;
  }, []);
  const completionProject = state.projects.find(
    (project) => project.id === state.timer.projectId,
  );
  const completion =
    state.timer.status === "finished"
      ? {
          projectId: completionProject?.id ?? "",
          projectName: state.timer.projectName,
          nextStep: completionProject?.nextStep ?? "",
        }
      : null;

  useEffect(() => {
    if (state.timer.status !== "running") return;
    const timerId = window.setInterval(() => {
      dispatch({ type: "TICK_TIMER" });
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [dispatch, state.timer.status]);

  useEffect(() => {
    if (!toast) return;
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
  ) => {
    if (
      !dispatch({
        type: "START_TIMER",
        todayItemId,
        now: new Date(),
        label,
        projectId,
        projectName,
        durationSeconds,
      })
    )
      return;
    setToast({
      id: Date.now(),
      message: `${label}のタイマーを開始しました`,
      tone: "success",
    });
  };

  const stopTimer = () => {
    if (!dispatch({ type: "STOP_TIMER", now: new Date() })) return;
    setToast({
      id: Date.now(),
      message: "今日の実行にサンプル記録を追加しました",
      tone: "success",
    });
  };

  const completeTimerDemo = () => {
    dispatch({ type: "FINISH_TIMER" });
  };

  const addTodayCandidate = (candidate: DemoBuilderCandidate) => {
    if (state.todayItems.some((item) => item.sourceId === candidate.sourceId))
      return;
    if (state.todayItems.length >= 3) {
      setToast({
        id: Date.now(),
        message: "今日の3件は3件までです。今日やることだけに絞ります。",
        tone: "info",
      });
      return;
    }
    if (
      !dispatch({
        type: "ADD_TODAY_ITEM",
        item: todayItemFromCandidate(candidate),
      })
    )
      return;
    setToast({
      id: Date.now(),
      message: `${candidate.label}を今日の3件に追加しました`,
      tone: "success",
    });
  };

  const removeTodayItem = (id: string) => {
    if (!dispatch({ type: "REMOVE_TODAY_ITEM", id })) return;
    setToast({
      id: Date.now(),
      message: "今日の3件から外しました",
      tone: "success",
    });
  };

  const excludeTodayCandidate = (candidate: DemoBuilderCandidate) => {
    if (
      !dispatch({
        type: "EXCLUDE_TODAY_CANDIDATE",
        sourceId: candidate.sourceId,
      })
    )
      return;
    setToast({
      id: Date.now(),
      message: "今日の候補から外しました。登録元は残っています。",
      tone: "info",
    });
  };

  const resetDemo = () => {
    if (!dispatch({ type: "RESET_DEMO", state: createDemoSeed(new Date()) }))
      return;
    try {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
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

  const focusDemo = () => {
    window.requestAnimationFrame(() => demoRef.current?.focus());
  };

  const focusDoNowShortStart = () => {
    demoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.requestAnimationFrame(() => {
      demoRef.current
        ?.querySelector<HTMLButtonElement>("[data-demo-do-now-short]")
        ?.focus();
    });
  };

  return (
    <>
      <a className="skip-link" href="#content">
        本文へ移動
      </a>
      <header className="site-header">
        <a
          className="site-brand"
          href="#top"
          aria-label="Life Launcher トップへ"
        >
          <span className="brand-mark" aria-hidden="true">
            L
          </span>
          <span>Life Launcher</span>
        </a>
        <nav aria-label="メインナビゲーション">
          <a href="#why">できること</a>
          <a href="#demo">Web Demo</a>
          <a href="#privacy">安全性</a>
        </nav>
      </header>

      <main id="content">
        <section className="hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow">WINDOWS DESKTOP APP</p>
            <h1>Life Launcher</h1>
            <p className="hero-lead">
              「何をしよう？」を
              <br />
              「今これをやる」に変える。
            </p>
            <p className="hero-description">
              迷っているときに「今やる一手」を1つ示し、必要なものを開いて、開始まで連れていく個人向け実行支援アプリです。
            </p>
            <div className="hero-actions">
              <a
                className="button button-gold button-large hero-primary"
                href="#demo"
                onClick={focusDemo}
              >
                <UiIcon name="play" size={16} /> ブラウザで試す
              </a>
              <a
                className="button button-quiet button-large"
                href="https://github.com/Takuyakou/life-launcher/releases/latest"
                rel="noopener noreferrer"
                target="_blank"
              >
                Windows版をダウンロード <UiIcon name="external" size={15} />
              </a>
              <a
                className="text-link"
                href="https://github.com/Takuyakou/life-launcher"
                rel="noopener noreferrer"
                target="_blank"
              >
                GitHub <UiIcon name="external" size={14} />
              </a>
            </div>
          </div>
          <div className="hero-proof" aria-label="Life Launcherの流れ">
            <div>
              <span>01</span>
              <strong>決める</strong>
              <small>今日の勝利条件を1つ</small>
            </div>
            <div>
              <span>02</span>
              <strong>選ぶ</strong>
              <small>今やる一手を小さく</small>
            </div>
            <div>
              <span>03</span>
              <strong>始める</strong>
              <small>必要なものを開いて5分から</small>
            </div>
            <div
              className="hero-mini-preview"
              aria-label="Life Launcher画面のプレビュー"
            >
              <div className="hero-mini-victory">
                <span>今日の勝利条件</span>
                <strong>後回しを1つ終わらせる</strong>
              </div>
              <div className="hero-mini-step">
                <span className="hero-mini-project">Project: 読書</span>
                <strong>本を数分だけ読む</strong>
              </div>
              <button
                className="button button-good hero-preview-action"
                onClick={focusDoNowShortStart}
                type="button"
              >
                <UiIcon name="play" size={13} /> 5分で始める
              </button>
            </div>
          </div>
        </section>

        <section className="why-section" id="why">
          <div className="section-intro">
            <p className="eyebrow">WHY LIFE LAUNCHER?</p>
            <h2>管理するためではなく、始めるために。</h2>
          </div>
          <div className="reason-grid">
            <article>
              <span>1</span>
              <h3>今日を絞る</h3>
              <p>
                登録した次の一手とやりたいことから、今日取り組む3件までを選びます。
              </p>
            </article>
            <article>
              <span>2</span>
              <h3>一手を小さくする</h3>
              <p>今週の重点から、説明できる固定ルールで1件だけ提示します。</p>
            </article>
            <article>
              <span>3</span>
              <h3>開始までつなぐ</h3>
              <p>
                Windows版では登録したアプリや手順書を開き、タイマーを始めます。
              </p>
            </article>
          </div>
        </section>

        <section
          className="demo-section-shell"
          id="demo"
          ref={demoRef}
          tabIndex={-1}
        >
          <div className="demo-intro">
            <div>
              <p className="eyebrow">INTERACTIVE DEMO</p>
              <h2>ブラウザで、開始までの流れを試す。</h2>
            </div>
            <div className="demo-disclosure">
              <span>サンプルデータだけで安全に試せます</span>
              <p>Windows固有機能は、Web上の演出として再現します。</p>
            </div>
          </div>
          <p className="mobile-recommendation">
            PCで開くとデモをより操作しやすく確認できます。
          </p>
          <DemoFrame
            dispatch={dispatch}
            onAddTodayCandidate={addTodayCandidate}
            onRemoveTodayItem={removeTodayItem}
            onExcludeTodayCandidate={excludeTodayCandidate}
            onDemoComplete={completeTimerDemo}
            onNativeOnly={showNativeToast}
            onOpenDictionary={() => setDictionaryOpen(true)}
            onOpenReset={() => setResetOpen(true)}
            onPauseTimer={() => {
              dispatch({ type: "PAUSE_TIMER" });
              setToast({
                id: Date.now(),
                message: "タイマーを一時停止しました",
                tone: "info",
              });
            }}
            onResumeTimer={() => dispatch({ type: "RESUME_TIMER" })}
            onStartTimer={startTimer}
            onStopTimer={stopTimer}
            state={state}
          />
          <p className="demo-privacy">
            デモの入力内容はサーバーへ送信しません。このブラウザ内にだけ保存されます。
          </p>
        </section>

        <section className="features-section">
          <div className="section-intro">
            <p className="eyebrow">FEATURES</p>
            <h2>考える場所と、動く場所をつなぐ。</h2>
          </div>
          <div className="feature-list">
            <article>
              <h3>今やる一手</h3>
              <p>
                今週の重点から固定ルールで1件だけ提示し、必要なら選ばれた理由も確認できます。
              </p>
            </article>
            <article>
              <h3>今日を組み立てる / 今日の3件</h3>
              <p>
                次の一手とやりたいことを候補にまとめ、「今日へ」で選んだ最大3件から実行します。
              </p>
            </article>
            <article>
              <h3>Quick Launcher / 辞書</h3>
              <p>
                Windows版ではアプリ・ファイル・フォルダ・URLを登録し、開始と同時にまとめて開けます。
              </p>
            </article>
            <article>
              <h3>タイマー / 今日の実行</h3>
              <p>
                始めた内容をタイマーで実行し、終了時に記録します。Web
                Demoでは分単位のサンプル記録を残します。
              </p>
            </article>
            <article>
              <h3>手順書</h3>
              <p>
                ローカルのMarkdown・Text・HTMLを、作業開始時に別ウィンドウで参照できます。
              </p>
            </article>
            <article>
              <h3>辞書</h3>
              <p>
                Windows版では、Ctrl+Kからラベル・分類・キーワードで検索して呼び出せます。
              </p>
            </article>
          </div>
        </section>

        <section className="privacy-section" id="privacy">
          <div>
            <p className="eyebrow">PRIVACY / SECURITY</p>
            <h2>Local-first.</h2>
          </div>
          <div className="privacy-copy">
            <p>Windows版のユーザーデータは端末内に保存します。</p>
            <p>
              公開前にコードだけでなく、Git履歴・画像・fixtureも監査しました。
            </p>
            <p>
              Windows版ではfavicon取得のSSRF対策と、Tauriのウィンドウ別最小権限化を行っています。
            </p>
            <p>
              Web
              Demoは外部API・アカウント・追跡用analyticsを使わず、入力はlocalStorageだけに保存します。
            </p>
          </div>
        </section>

        <section className="tech-section">
          <p className="eyebrow">TECH STACK</p>
          <div>
            <span>React</span>
            <span>TypeScript</span>
            <span>Vite</span>
            <span>Rust</span>
            <span>Tauri 2</span>
          </div>
          <p>
            Web
            Demoは静的SPAです。リリース版はWindows向けTauriデスクトップアプリです。
          </p>
        </section>

        <section className="final-cta">
          <div>
            <p className="eyebrow">READY?</p>
            <h2>次の一手を、今ここで始める。</h2>
          </div>
          <div>
            <a
              className="button button-gold button-large"
              href="#demo"
              onClick={focusDemo}
            >
              <UiIcon name="play" size={16} /> ブラウザで試す
            </a>
            <a
              className="button button-quiet button-large"
              href="https://github.com/Takuyakou/life-launcher/releases/latest"
              rel="noopener noreferrer"
              target="_blank"
            >
              Windows版をダウンロード <UiIcon name="external" size={15} />
            </a>
          </div>
        </section>
      </main>

      <footer>
        <span>© 2026 Takuyakou</span>
        <div>
          <a
            href="https://github.com/Takuyakou/life-launcher"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          <a
            href="https://github.com/Takuyakou/life-launcher/releases/latest"
            rel="noopener noreferrer"
            target="_blank"
          >
            Windows版
          </a>
        </div>
        <span>Usage terms are available in the GitHub repository.</span>
      </footer>

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
        editable={Boolean(completion?.projectId)}
        initialValue={completion?.nextStep ?? ""}
        onSave={(nextStep) => {
          if (!completion) return;
          if (!dispatch({ type: "CONFIRM_TIMER", now: new Date(), nextStep }))
            return;
          setToast({
            id: Date.now(),
            message: "次の一手を更新しました",
            tone: "success",
          });
        }}
        onSkip={() => {
          if (!dispatch({ type: "CONFIRM_TIMER", now: new Date() })) return;
          setToast({
            id: Date.now(),
            message: "今日の実行に記録しました",
            tone: "success",
          });
        }}
        open={Boolean(completion)}
        projectName={completion?.projectName ?? ""}
      />
      <div aria-atomic="true" aria-live="polite" className="toast-region">
        {toast ? (
          <div className={`toast toast-${toast.tone}`} key={toast.id}>
            {toast.message}
          </div>
        ) : null}
      </div>
    </>
  );
}

export default App;

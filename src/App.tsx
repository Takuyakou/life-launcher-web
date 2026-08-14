import { useEffect, useReducer, useRef, useState } from "react";
import { CompletionDialog } from "./components/CompletionDialog";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { DemoDictionary } from "./components/DemoDictionary";
import { DemoFrame } from "./components/DemoFrame";
import { UiIcon } from "./components/UiIcon";
import { createDemoSeed } from "./demo/seed";
import { demoReducer } from "./demo/reducer";
import { clearDemoState, loadDemoState, saveDemoState } from "./demo/storage";
import type { DemoTodayItem } from "./demo/types";

type ToastState = { id: number; message: string; tone: "info" | "success" } | null;
type CompletionState = {
  projectId: string;
  projectName: string;
  nextStep: string;
} | null;

function App() {
  const [state, dispatch] = useReducer(
    demoReducer,
    undefined,
    () => loadDemoState(window.localStorage, createDemoSeed(new Date())),
  );
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [completion, setCompletion] = useState<CompletionState>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const demoRef = useRef<HTMLElement>(null);

  useEffect(() => {
    saveDemoState(window.localStorage, state);
  }, [state]);

  useEffect(() => {
    if (state.timer.status !== "running") return;
    const timerId = window.setInterval(() => {
      if (state.timer.remainingSeconds <= 1) {
        const project = state.projects.find((item) => item.id === state.timer.projectId);
        dispatch({ type: "STOP_TIMER", now: new Date() });
        if (project) {
          setCompletion({ projectId: project.id, projectName: project.name, nextStep: project.nextStep });
        }
        setToast({ id: Date.now(), message: "タイマーが満了し、今日の実行に追加しました", tone: "success" });
      } else {
        dispatch({ type: "TICK_TIMER" });
      }
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [state.projects, state.timer]);

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
  ) => {
    if (state.timer.status !== "idle") dispatch({ type: "STOP_TIMER", now: new Date() });
    setCompletion(null);
    dispatch({ type: "START_TIMER", label, projectId, projectName, durationSeconds });
    setToast({ id: Date.now(), message: `${label}のタイマーを開始しました`, tone: "success" });
  };

  const stopTimer = () => {
    dispatch({ type: "STOP_TIMER", now: new Date() });
    setCompletion(null);
    setToast({ id: Date.now(), message: "今日の実行にサンプル記録を追加しました", tone: "success" });
  };

  const completeTimerDemo = () => {
    if (state.timer.status === "idle") return;
    const project = state.projects.find((item) => item.id === state.timer.projectId);
    dispatch({ type: "STOP_TIMER", now: new Date() });
    if (project) {
      setCompletion({ projectId: project.id, projectName: project.name, nextStep: project.nextStep });
    }
    setToast({ id: Date.now(), message: "タイマーを満了まで進め、今日の実行に追加しました", tone: "success" });
  };

  const addTodayCandidate = (item: DemoTodayItem) => {
    if (state.todayItems.some((todayItem) => todayItem.id === item.id)) return;
    if (state.todayItems.length >= 3) {
      setToast({ id: Date.now(), message: "今日の3件は3件までです。今日やることだけに絞ります。", tone: "info" });
      return;
    }
    dispatch({ type: "ADD_TODAY_ITEM", item });
    setToast({ id: Date.now(), message: `${item.label}を今日の3件に追加しました`, tone: "success" });
  };

  const resetDemo = () => {
    clearDemoState(window.localStorage);
    dispatch({ type: "RESET_DEMO", state: createDemoSeed(new Date()) });
    setDictionaryOpen(false);
    setResetOpen(false);
    setCompletion(null);
    setToast({ id: Date.now(), message: "Web Demoを初期状態に戻しました", tone: "success" });
    window.requestAnimationFrame(() => demoRef.current?.focus());
  };

  const focusDemo = () => {
    window.requestAnimationFrame(() => demoRef.current?.focus());
  };

  return (
    <>
      <a className="skip-link" href="#content">本文へ移動</a>
      <header className="site-header">
        <a className="site-brand" href="#top" aria-label="Life Launcher トップへ">
          <span className="brand-mark" aria-hidden="true">L</span>
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
            <p className="hero-lead">「何をしよう？」を<br />「今これをやる」に変える。</p>
            <p className="hero-description">
              迷っているときに「今やる一手」を1つ示し、必要なものを開いて、開始まで連れていく個人向け実行支援アプリです。
            </p>
            <div className="hero-actions">
              <a className="button button-gold button-large hero-primary" href="#demo" onClick={focusDemo}>
                <UiIcon name="play" size={16} /> ブラウザで試す
              </a>
              <a
                className="button button-quiet button-large"
                href="https://github.com/Takuyakou/life-launcher/releases/tag/v1.0.0"
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
            <div><span>01</span><strong>決める</strong><small>今日の勝利条件を1つ</small></div>
            <div><span>02</span><strong>選ぶ</strong><small>今やる一手を小さく</small></div>
            <div><span>03</span><strong>始める</strong><small>必要なものを開いて5分から</small></div>
            <div className="hero-mini-preview" aria-label="Life Launcher画面のプレビュー">
              <div><span>今日の勝利条件</span><strong>本を10分読む</strong></div>
              <div><span>今やる一手</span><strong>本を10分だけ読む</strong></div>
              <span className="hero-preview-action"><UiIcon name="play" size={13} /> 5分で開始</span>
            </div>
          </div>
        </section>

        <section className="why-section" id="why">
          <div className="section-intro">
            <p className="eyebrow">WHY LIFE LAUNCHER?</p>
            <h2>管理するためではなく、始めるために。</h2>
          </div>
          <div className="reason-grid">
            <article><span>1</span><h3>今日を絞る</h3><p>勝利条件を1つ、取り組む項目を3件までに絞ります。</p></article>
            <article><span>2</span><h3>一手を小さくする</h3><p>今週の重点から、説明できる固定ルールで1件だけ提示します。</p></article>
            <article><span>3</span><h3>開始までつなぐ</h3><p>Windows版では登録したアプリや手順書を開き、タイマーを始めます。</p></article>
          </div>
        </section>

        <section className="demo-section-shell" id="demo" ref={demoRef} tabIndex={-1}>
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
          <p className="mobile-recommendation">PCで開くとデモをより操作しやすく確認できます。</p>
          <DemoFrame
            dispatch={dispatch}
            onAddTodayCandidate={addTodayCandidate}
            onDemoComplete={completeTimerDemo}
            onNativeOnly={showNativeToast}
            onOpenDictionary={() => setDictionaryOpen(true)}
            onOpenReset={() => setResetOpen(true)}
            onPauseTimer={() => {
              dispatch({ type: "PAUSE_TIMER" });
              setToast({ id: Date.now(), message: "タイマーを一時停止しました", tone: "info" });
            }}
            onResumeTimer={() => dispatch({ type: "RESUME_TIMER" })}
            onStartTimer={startTimer}
            onStopTimer={stopTimer}
            state={state}
          />
          <p className="demo-privacy">デモの入力内容はサーバーへ送信しません。このブラウザ内にだけ保存されます。</p>
        </section>

        <section className="features-section">
          <div className="section-intro">
            <p className="eyebrow">FEATURES</p>
            <h2>考える場所と、動く場所をつなぐ。</h2>
          </div>
          <div className="feature-list">
            <article><h3>今やる一手</h3><p>今週の重点から固定ルールで1件だけ提示し、必要なら選ばれた理由も確認できます。</p></article>
            <article><h3>今日の勝利条件 / 今日の3件</h3><p>今日の基準を1つ決め、取り組む項目は最大3件に絞ります。</p></article>
            <article><h3>Quick Launcher / 辞書</h3><p>Windows版ではアプリ・ファイル・フォルダ・URLを登録し、開始と同時にまとめて開けます。</p></article>
            <article><h3>タイマー / 今日の実行</h3><p>始めた内容をタイマーで実行し、1分以上の実行を自動で記録します。</p></article>
            <article><h3>手順書</h3><p>ローカルのMarkdown・Text・HTMLを、作業開始時に別ウィンドウで参照できます。</p></article>
            <article><h3>辞書</h3><p>登録数が増えても、Ctrl+Kからラベル・分類・キーワードで検索して呼び出せます。</p></article>
          </div>
        </section>

        <section className="privacy-section" id="privacy">
          <div>
            <p className="eyebrow">PRIVACY / SECURITY</p>
            <h2>Local-first.</h2>
          </div>
          <div className="privacy-copy">
            <p>Windows版のユーザーデータは端末内に保存します。</p>
            <p>公開前にコードだけでなく、Git履歴・画像・fixtureも監査しました。</p>
            <p>Windows版ではfavicon取得のSSRF対策と、Tauriのウィンドウ別最小権限化を行っています。</p>
            <p>Web Demoは外部API・アカウント・追跡用analyticsを使わず、入力はlocalStorageだけに保存します。</p>
          </div>
        </section>

        <section className="tech-section">
          <p className="eyebrow">TECH STACK</p>
          <div><span>React</span><span>TypeScript</span><span>Vite</span><span>Rust</span><span>Tauri 2</span></div>
          <p>Web Demoは静的SPAです。製品版はWindows向けTauriデスクトップアプリです。</p>
        </section>

        <section className="final-cta">
          <div>
            <p className="eyebrow">READY?</p>
            <h2>次の一手を、今ここで始める。</h2>
          </div>
          <div>
            <a className="button button-gold button-large" href="#demo" onClick={focusDemo}>
              <UiIcon name="play" size={16} /> ブラウザで試す
            </a>
            <a
              className="button button-quiet button-large"
              href="https://github.com/Takuyakou/life-launcher/releases/tag/v1.0.0"
              rel="noopener noreferrer"
              target="_blank"
            >Windows版をダウンロード <UiIcon name="external" size={15} /></a>
          </div>
        </section>
      </main>

      <footer>
        <span>© 2026 Takuyakou</span>
        <div>
          <a href="https://github.com/Takuyakou/life-launcher" rel="noopener noreferrer" target="_blank">GitHub</a>
          <a href="https://github.com/Takuyakou/life-launcher/releases/tag/v1.0.0" rel="noopener noreferrer" target="_blank">Windows版</a>
        </div>
        <span>Usage terms are available in the GitHub repository.</span>
      </footer>

      <DemoDictionary open={dictionaryOpen} onClose={() => setDictionaryOpen(false)} onNativeOnly={showNativeToast} />
      <ConfirmDialog
        confirmLabel="リセットする"
        description="入力した勝利条件、チェック状態、デモの実行記録を初期状態に戻します。"
        onCancel={() => setResetOpen(false)}
        onConfirm={resetDemo}
        open={resetOpen}
        title="Web Demoをリセットしますか？"
      />
      <CompletionDialog
        initialValue={completion?.nextStep ?? ""}
        onSave={(nextStep) => {
          if (!completion) return;
          dispatch({ type: "UPDATE_PROJECT_NEXT_STEP", projectId: completion.projectId, nextStep });
          setCompletion(null);
          setToast({ id: Date.now(), message: "次の一手を更新しました", tone: "success" });
        }}
        onSkip={() => setCompletion(null)}
        open={Boolean(completion)}
        projectName={completion?.projectName ?? ""}
      />
      <div aria-atomic="true" aria-live="polite" className="toast-region">
        {toast ? <div className={`toast toast-${toast.tone}`} key={toast.id}>{toast.message}</div> : null}
      </div>
    </>
  );
}

export default App;

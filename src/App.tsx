import { useEffect, useReducer, useRef, useState } from "react";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { DemoDictionary } from "./components/DemoDictionary";
import { DemoFrame } from "./components/DemoFrame";
import { UiIcon } from "./components/UiIcon";
import { createDemoSeed } from "./demo/seed";
import { demoReducer } from "./demo/reducer";
import { clearDemoState, loadDemoState, saveDemoState } from "./demo/storage";

type ToastState = { id: number; message: string; tone: "info" | "success" } | null;

function App() {
  const [state, dispatch] = useReducer(
    demoReducer,
    undefined,
    () => loadDemoState(window.localStorage, createDemoSeed(new Date())),
  );
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const demoRef = useRef<HTMLElement>(null);

  useEffect(() => {
    saveDemoState(window.localStorage, state);
  }, [state]);

  useEffect(() => {
    if (state.timer.status !== "running") return;
    const timerId = window.setInterval(() => {
      if (state.timer.remainingSeconds <= 1) {
        dispatch({ type: "STOP_TIMER", now: new Date() });
        setToast({ id: Date.now(), message: "タイマーが満了し、今日の実行に追加しました", tone: "success" });
      } else {
        dispatch({ type: "TICK_TIMER" });
      }
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [state.timer.remainingSeconds, state.timer.status]);

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
    dispatch({ type: "START_TIMER", label, projectId, projectName, durationSeconds });
    setToast({ id: Date.now(), message: `${label}のタイマーを開始しました`, tone: "success" });
  };

  const stopTimer = () => {
    dispatch({ type: "STOP_TIMER", now: new Date() });
    setToast({ id: Date.now(), message: "今日の実行にサンプル記録を追加しました", tone: "success" });
  };

  const resetDemo = () => {
    clearDemoState(window.localStorage);
    dispatch({ type: "RESET_DEMO", state: createDemoSeed(new Date()) });
    setDictionaryOpen(false);
    setResetOpen(false);
    setToast({ id: Date.now(), message: "Web Demoを初期状態に戻しました", tone: "success" });
    window.requestAnimationFrame(() => demoRef.current?.focus());
  };

  const focusDemo = () => {
    window.requestAnimationFrame(() => demoRef.current?.focus());
  };

  return (
    <>
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

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">WINDOWS DESKTOP APP</p>
            <h1>Life Launcher</h1>
            <p className="hero-lead">「何をしよう？」を<br />「今これをやる」に変える。</p>
            <p className="hero-description">
              迷っているときに「今やる一手」を1つ示し、開始まで連れていく個人向け実行支援アプリです。
            </p>
            <div className="hero-actions">
              <a className="button button-gold button-large" href="#demo" onClick={focusDemo}>
                ブラウザで試す
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
            <div><span>03</span><strong>始める</strong><small>5分からタイマーで</small></div>
          </div>
        </section>

        <section className="why-section" id="why">
          <div className="section-intro">
            <p className="eyebrow">WHY LIFE LAUNCHER?</p>
            <h2>管理するためではなく、始めるために。</h2>
          </div>
          <div className="reason-grid">
            <article><span>1</span><h3>今日を絞る</h3><p>勝利条件と3件だけを見て、選択肢を減らします。</p></article>
            <article><span>2</span><h3>一手を小さくする</h3><p>「次に何をするか」を、すぐ着手できる言葉にします。</p></article>
            <article><span>3</span><h3>実行を残す</h3><p>タイマーを止めると、その一手が今日の実行として残ります。</p></article>
          </div>
        </section>

        <section className="demo-section-shell" id="demo" ref={demoRef} tabIndex={-1}>
          <div className="demo-intro">
            <div>
              <p className="eyebrow">INTERACTIVE DEMO</p>
              <h2>触って、開始までの流れを試す。</h2>
            </div>
            <div className="demo-disclosure">
              <strong>WEB DEMO</strong>
              <span>サンプルデータ</span>
              <p>Windows固有機能はデスクトップ版で利用できます。</p>
            </div>
          </div>
          <p className="mobile-recommendation">PCで開くとデモをより操作しやすく確認できます。</p>
          <DemoFrame
            dispatch={dispatch}
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
            <article><h3>今やる一手</h3><p>迷いを、開始できる大きさの行動へ変えます。</p></article>
            <article><h3>今日の勝利条件と3件</h3><p>今日が終わったと言える基準と、優先する3件を置けます。</p></article>
            <article><h3>Quick Launcher / 辞書</h3><p>Windows版ではアプリ・ファイル・URLを登録して開けます。</p></article>
            <article><h3>タイマー / 今日の実行</h3><p>始めた一手を計測し、実行した内容として積み上げます。</p></article>
            <article><h3>手順書</h3><p>Windows版ではローカルのMarkdown・Text・HTMLを閲覧できます。</p></article>
          </div>
        </section>

        <section className="privacy-section" id="privacy">
          <div>
            <p className="eyebrow">PRIVACY / SECURITY</p>
            <h2>Local-first.</h2>
          </div>
          <div className="privacy-copy">
            <p>Windows版のユーザーデータは端末内に保存します。</p>
            <p>Web Demoはサンプルデータだけで動作し、入力内容をサーバーへ送信しません。</p>
            <p>バックエンド、アカウント、追跡用analytics、外部APIは使用していません。</p>
          </div>
        </section>

        <section className="tech-section">
          <p className="eyebrow">TECH STACK</p>
          <div><span>React</span><span>TypeScript</span><span>Vite</span><span>Rust</span><span>Tauri 2</span></div>
          <p>Web Demoは静的SPAです。製品版はWindows向けTauriデスクトップアプリです。</p>
        </section>

        <section className="final-cta">
          <p className="eyebrow">READY?</p>
          <h2>次の一手を、今ここで始める。</h2>
          <div>
            <a className="button button-gold button-large" href="#demo" onClick={focusDemo}>ブラウザで試す</a>
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
        <span>Life Launcher</span>
        <a href="https://github.com/Takuyakou/life-launcher" rel="noopener noreferrer" target="_blank">GitHub</a>
        <span>Source available for viewing. All rights reserved.</span>
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
      <div aria-atomic="true" aria-live="polite" className="toast-region">
        {toast ? <div className={`toast toast-${toast.tone}`} key={toast.id}>{toast.message}</div> : null}
      </div>
    </>
  );
}

export default App;

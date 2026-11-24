import type { ReactNode } from "react";
import { UiIcon } from "../components/UiIcon";

const RELEASES_URL = "https://github.com/Takuyakou/life-launcher/releases/latest";
const REPO_URL = "https://github.com/Takuyakou/life-launcher";

function DownloadIcon({ size }: { size: number }) {
  return (
    <svg
      aria-hidden="true"
      className="ui-icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9">
        <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
      </g>
    </svg>
  );
}

function CheckMark() {
  return (
    <span className="lp-check" aria-hidden="true">
      <UiIcon name="check" size={14} />
    </span>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="lp-eyebrow">{children}</p>;
}

function DownloadButton() {
  return (
    <a
      className="button lp-cta lp-cta-secondary"
      href={RELEASES_URL}
      rel="noopener noreferrer"
      target="_blank"
    >
      Windows版をダウンロード
      <DownloadIcon size={16} />
    </a>
  );
}

/* W18: 最後の段の Windows 版の札。版の数字は書かない(公開のたびに直さなくてよいように)。
   書いてあることは Windows 版 README の「ダウンロード」と同じ(3 形式・SHA256SUMS.txt・WebView2)。 */
function WindowsCard() {
  return (
    <div className="lp-get">
      <h3 className="lp-get-title">Windows版を入手</h3>
      <p className="lp-get-meta">Windows 10 / 11 (x64) · WebView2 Runtime</p>
      <a
        className="button button-gold start-button lp-get-button"
        href={RELEASES_URL}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span>最新版をダウンロード</span>
        <span>（GitHub Releases）</span>
      </a>
      <p className="lp-get-note">インストーラー / 単体実行 EXE / ポータブル ZIP の 3 形式・SHA256SUMS 添付</p>
    </div>
  );
}

const TECH_STACK = ["Tauri 2", "Rust", "React", "TypeScript"];

function TryButton({ className = "" }: { className?: string }) {
  return (
    <a className={`button button-gold lp-cta ${className}`.trim()} href="#demo">
      <UiIcon name="play" size={18} />
      ブラウザで試す
    </a>
  );
}

export function SiteHeader() {
  return (
    <header className="lp-header">
      <div className="lp-container lp-header-inner">
        <a className="lp-brand" href="#top" aria-label="Life Launcher トップへ">
          <span className="lp-brand-mark" aria-hidden="true">
            L
          </span>
          <span>Life Launcher</span>
        </a>
        <nav className="lp-nav" aria-label="メインナビゲーション">
          <a className="lp-nav-link" href="#why">
            できること
          </a>
          <a className="lp-nav-link" href="#demo">
            Web Demo
          </a>
          <a className="lp-nav-link" href="#privacy">
            安全性
          </a>
          <a
            className="lp-nav-link"
            href={REPO_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          <a
            className="button lp-header-download"
            href={RELEASES_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            Windows版
            <DownloadIcon size={14} />
          </a>
        </nav>
      </div>
    </header>
  );
}

const HERO_CANDIDATES: Array<{ label: string; tone: string }> = [
  { label: "参考書を10ページ進める", tone: "violet" },
  { label: "ストレッチをする", tone: "green" },
  { label: "近所をゆっくり歩く", tone: "none" },
  { label: "英単語を20個復習する", tone: "violet" },
  { label: "気になっていた本を読む", tone: "amber" },
];

export function Hero({
  onStartShort,
  onStartNormal,
}: {
  onStartShort: () => void;
  onStartNormal: () => void;
}) {
  return (
    <section className="lp-hero" id="top">
      <div className="lp-container lp-hero-grid">
        <div className="lp-hero-copy">
          <div className="lp-hero-titles">
            <Eyebrow>WINDOWS DESKTOP APP</Eyebrow>
            <h1 className="lp-hero-title">Life Launcher</h1>
            <p className="lp-hero-lead">
              <span className="lp-hero-lead-quiet">「何をしよう？」を</span>
              <span className="lp-hero-lead-line">
                <span className="lp-hero-lead-accent">「今これをやる」</span>に変える。
              </span>
            </p>
          </div>
          <p className="lp-hero-description">
            迷っているときに「今やる一手」を1つ示し、必要なものを開いて、開始まで連れていく個人向け実行支援アプリです。
          </p>
          <div className="lp-actions">
            <TryButton className="lp-hero-primary" />
            <DownloadButton />
          </div>
        </div>

        <div className="lp-hero-visual">
          <ul className="lp-hero-candidates" aria-hidden="true">
            {HERO_CANDIDATES.map((candidate) => (
              <li className="lp-hero-chip" data-tone={candidate.tone} key={candidate.label}>
                <span className="lp-hero-chip-dot" />
                {candidate.label}
              </li>
            ))}
          </ul>
          <p className="lp-hero-connector">
            <span className="lp-hero-connector-line" aria-hidden="true" />
            この中から、1件だけ。
          </p>
          <div className="lp-hero-card" aria-label="今やる一手のプレビュー" role="group">
            <div className="lp-hero-card-head">
              <span className="lp-hero-card-kicker">
                今やる一手
                <span className="lp-hero-card-project project-amber">
                  <span className="lp-hero-card-dot" aria-hidden="true" />
                  読書
                </span>
              </span>
              <span className="lp-hero-card-reason">今日の3件に入っている一手</span>
            </div>
            <strong className="lp-hero-card-title">数分だけ読む</strong>
            <p className="lp-hero-card-resume">
              <span className="lp-hero-card-resume-label">次はここから</span>
              <span>3章のp.84から</span>
            </p>
            <div className="lp-hero-card-actions">
              <button
                className="button button-good start-button lp-hero-start"
                onClick={onStartShort}
                type="button"
              >
                <UiIcon name="play" size={17} />
                5分で始める
              </button>
              <button
                className="button button-normal start-button lp-hero-start-normal"
                onClick={onStartNormal}
                type="button"
              >
                <UiIcon name="play" size={17} />
                通常25分
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WhySection() {
  return (
    <section className="lp-section lp-why" id="why">
      <div className="lp-container">
        <Eyebrow>WHY LIFE LAUNCHER?</Eyebrow>
        <h2 className="lp-h2 lp-why-title">管理するためではなく、始めるために。</h2>
        <div className="lp-why-grid">
          <article className="lp-why-item">
            <div className="lp-why-art" aria-hidden="true">
              <div className="lp-why-row is-done">
                <CheckMark />
                ストレッチをする
              </div>
              <div className="lp-why-row is-current">
                <span className="lp-why-dot" />
                数分だけ読む
              </div>
              <div className="lp-why-row is-empty">
                <span className="lp-why-slot">3</span>
                空けておいてもかまいません
              </div>
            </div>
            <h3 className="lp-why-heading">
              <span className="lp-num">1</span>今日を絞る
            </h3>
            <p className="lp-body">
              登録した次の一手とやりたいことから、今日取り組む3件までを選びます。
            </p>
          </article>
          <article className="lp-why-item">
            <div className="lp-why-art" aria-hidden="true">
              <div className="lp-why-pick">
                <span className="lp-why-pick-kicker">今やる一手</span>
                <span className="lp-why-pick-title">数分だけ読む</span>
              </div>
              <div className="lp-why-faded">参考書を10ページ進める</div>
              <div className="lp-why-faded">ストレッチをする</div>
            </div>
            <h3 className="lp-why-heading">
              <span className="lp-num">2</span>一手を小さくする
            </h3>
            <p className="lp-body">「次の一手」があるプロジェクトから、今やることを1件だけ示します。</p>
          </article>
          <article className="lp-why-item">
            <div className="lp-why-art lp-why-art-launch" aria-hidden="true">
              <div className="lp-why-launch-list">
                <span>
                  <CheckMark />
                  読書メモを開く
                </span>
                <span>
                  <CheckMark />
                  参考ページを開く
                </span>
                <span>
                  <CheckMark />
                  タイマーを開始
                </span>
              </div>
              <span className="lp-why-clock">05:00</span>
            </div>
            <h3 className="lp-why-heading">
              <span className="lp-num">3</span>開始までつなぐ
            </h3>
            <p className="lp-body">Windows版では登録したアプリや手順書を開き、タイマーを始めます。</p>
          </article>
        </div>
      </div>
    </section>
  );
}

const DEMO_STEPS: Array<{ title: string; note: string }> = [
  { title: "今日やるものを選ぶ", note: "3件まで。その場で足せます" },
  { title: "5分で始める", note: "タイマーが動きます" },
  { title: "終えて、次を書き残す", note: "延長するか、終わるか" },
  { title: "まとめて取り込む", note: "サンプルの答えで試せます" },
];

export function DemoSection({
  children,
  sectionRef,
}: {
  children: ReactNode;
  sectionRef: React.Ref<HTMLElement>;
}) {
  return (
    <section className="lp-demo" id="demo" ref={sectionRef}>
      <div className="lp-container">
        <div className="lp-demo-intro">
          <div className="lp-demo-titles">
            <Eyebrow>INTERACTIVE DEMO</Eyebrow>
            <h2 className="lp-h2">開始までの流れを試す。</h2>
          </div>
          <p className="lp-demo-lead">サンプルデータだけで安全に試せます。</p>
        </div>
        <ol className="lp-demo-steps" aria-label="デモの進め方">
          {DEMO_STEPS.map((step, index) => (
            <li className={index === 0 ? "lp-demo-step is-first" : "lp-demo-step"} key={step.title}>
              <span className="lp-demo-step-num" aria-hidden="true">
                {index + 1}
              </span>
              <span className="lp-demo-step-text">
                <span className="lp-demo-step-title">{step.title}</span>
                <span className="lp-demo-step-note">{step.note}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="lp-demo-mobile-note">PCで開くとデモをより操作しやすく確認できます。</p>
        <div className="lp-demo-window">{children}</div>
        <p className="lp-demo-privacy">
          デモの入力内容はサーバーへ送信しません。このブラウザ内にだけ保存されます。
        </p>
      </div>
    </section>
  );
}

type Feature = { title: string; body: string; tag: "demo" | "staged" | "windows" };

const THINK_FEATURES: Feature[] = [
  {
    title: "今やる一手",
    body: "「次の一手」を設定したプロジェクトから1件を表示し、理由も確認できます。",
    tag: "demo",
  },
  {
    title: "今日やるものを選ぶ / 今日の3件",
    body: "「次の一手」と「やりたいこと」から最大3件を選び、タイマーから実行します。プロジェクトで絞り、その場で1件足せます。",
    tag: "demo",
  },
  {
    title: "まとめて取り込む",
    body: "ChatGPT や Claude の答えを貼り、取り込むものを選んで、プロジェクト・次の一手・やりたいことをまとめて足します。",
    tag: "demo",
  },
];

const ACT_FEATURES: Feature[] = [
  {
    title: "タイマー / 今日の実行",
    body: "始めた内容をタイマーで実行し、終了時に記録します。予定時間が来たら、分数を決めて続けられます。",
    tag: "demo",
  },
  {
    title: "Quick Launcher / 辞書",
    body: "アプリ・ファイル・フォルダ・URLを登録し、開始と同時にまとめて開けます。Ctrl+K から、ラベル・分類・キーワードで呼び出せます。",
    tag: "staged",
  },
  {
    title: "手順書",
    body: "ローカルのMarkdown・テキスト・HTMLを、作業開始時に別ウィンドウで参照できます。",
    tag: "windows",
  },
];

const TAG_LABEL: Record<Feature["tag"], string> = {
  demo: "Web Demo で試せる",
  staged: "Web Demo は演出",
  windows: "Windows版",
};

function FeatureColumn({
  label,
  tone,
  features,
}: {
  label: string;
  tone: "think" | "act";
  features: Feature[];
}) {
  return (
    <div className="lp-feature-col" data-tone={tone}>
      <p className="lp-feature-col-label">
        <span className="lp-feature-col-dot" aria-hidden="true" />
        {label}
      </p>
      {features.map((feature) => (
        <div className="lp-feature" key={feature.title}>
          <div className="lp-feature-head">
            <h3 className="lp-feature-title">{feature.title}</h3>
            <span className="lp-feature-tag" data-tag={feature.tag}>
              {TAG_LABEL[feature.tag]}
            </span>
          </div>
          <p className="lp-body">{feature.body}</p>
        </div>
      ))}
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section className="lp-section lp-features">
      <div className="lp-container">
        <Eyebrow>FEATURES</Eyebrow>
        <h2 className="lp-h2 lp-features-title">
          <span className="lp-features-think">考える場所</span>と、
          <br />
          <span className="lp-features-act">動く場所</span>をつなぐ。
        </h2>
        <div className="lp-feature-grid">
          <FeatureColumn label="考える場所" tone="think" features={THINK_FEATURES} />
          <FeatureColumn label="動く場所" tone="act" features={ACT_FEATURES} />
        </div>
      </div>
    </section>
  );
}

export function PrivacySection() {
  return (
    <section className="lp-section lp-privacy" id="privacy">
      <div className="lp-container lp-privacy-grid">
        <div className="lp-privacy-head">
          <Eyebrow>PRIVACY / SECURITY</Eyebrow>
          <h2 className="lp-privacy-title">Local-first.</h2>
          <ul className="lp-tech-chips" aria-label="使っている技術">
            {TECH_STACK.map((name) => (
              <li className="lp-tech-chip" key={name}>
                {name}
              </li>
            ))}
          </ul>
        </div>
        <ul className="lp-privacy-list">
          <li>Windows版のユーザーデータは端末内に保存します。</li>
          <li>
            Web Demoは外部API・アカウント・追跡用analyticsを使わず、入力はこのブラウザの中だけに保存します。
          </li>
          <li>公開前にコードだけでなく、Git履歴・画像・fixtureも監査しました。</li>
          <li>Windows版ではfavicon取得のSSRF対策と、Tauriのウィンドウ別最小権限化を行っています。</li>
        </ul>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="lp-section lp-final">
      <div className="lp-container lp-final-inner">
        <span className="lp-final-ghost" aria-hidden="true">
          05:00
        </span>
        <div className="lp-final-copy">
          <Eyebrow>READY?</Eyebrow>
          <h2 className="lp-h2">次の一手を、今ここで始める。</h2>
          <a className="lp-final-try" href="#demo">
            <UiIcon name="play" size={16} />
            まずはブラウザで試す
          </a>
        </div>
        <WindowsCard />
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-container lp-footer-inner">
        <span>© 2026 Takuyakou</span>
        <div className="lp-footer-links">
          <a href={REPO_URL} rel="noopener noreferrer" target="_blank">
            GitHub
          </a>
          <a href={RELEASES_URL} rel="noopener noreferrer" target="_blank">
            Windows版
          </a>
          <span>利用条件は GitHub リポジトリにあります。</span>
        </div>
      </div>
    </footer>
  );
}

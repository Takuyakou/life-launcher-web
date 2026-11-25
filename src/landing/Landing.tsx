import { useEffect, useRef, useState, type ReactNode } from "react";

const RELEASES = "https://github.com/Takuyakou/life-launcher/releases/latest";
const REPO = "https://github.com/Takuyakou/life-launcher";

const prefersReducedMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * デモの窓全体が画面に入る位置(窓の上端が画面の上から 32px)までページを動かす。
 * 動きを減らす設定のときは、なめらかにせずすぐに移る。
 */
function scrollToDemoWindow() {
  const stage = document.querySelector<HTMLElement>(".lp-stage");
  if (!stage) return;
  const top = Math.max(0, stage.getBoundingClientRect().top + window.scrollY - 32);
  window.scrollTo({ top, behavior: prefersReducedMotion() ? "instant" : "smooth" });
}

const tryDemo = (event: { preventDefault: () => void }) => {
  event.preventDefault();
  scrollToDemoWindow();
};

const PlayIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    aria-hidden="true"
    fill="none"
    height={size}
    stroke="currentColor"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width={size}
  >
    <path d="M7 5l12 7-12 7z" />
  </svg>
);

const DownloadIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    aria-hidden="true"
    fill="none"
    height={size}
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.9"
    viewBox="0 0 24 24"
    width={size}
  >
    <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
  </svg>
);

const CheckIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    aria-hidden="true"
    fill="none"
    height={size}
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.6"
    viewBox="0 0 24 24"
    width={size}
  >
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export function SiteHeader() {
  return (
    <header className="lp-header">
      <div className="lp-wrap lp-header-inner">
        <a aria-label="Life Launcher トップへ" className="lp-brand" href="#top">
          <span aria-hidden="true" className="lp-mark">
            L
          </span>
          <span className="lp-brand-name">Life Launcher</span>
        </a>
        <nav aria-label="メインナビゲーション" className="lp-nav">
          <a href="#flow">使い方</a>
          <a href="#screen">デモ</a>
          <a href="#diff">試せる機能</a>
          <a className="lp-hdl" href={RELEASES} rel="noopener noreferrer" target="_blank">
            Windows版
            <DownloadIcon size={14} />
          </a>
        </nav>
      </div>
    </header>
  );
}

export function Hero() {
  return (
    <section id="top">
      <div className="lp-wrap lp-hero">
        <div className="lp-hero-copy">
          <p className="lp-mono lp-eyebrow">これは何か</p>
          <h1 className="lp-h1">
            <span>今日やることを3件に絞り、</span>
            <span>1件を選んで、</span>
            <span>
              <span className="lp-hl">すぐ始める</span>ためのアプリです。
            </span>
          </h1>
          <p className="lp-lead">
            Life Launcher は Windows のデスクトップアプリです。迷ったときに「今やる一手」を1つ示し、その作業に使うアプリやファイルを開いて、タイマーを始めます。
          </p>
          <div className="lp-ctas">
            <a className="lp-cta lp-cta--primary" href="#screen" onClick={tryDemo}>
              <PlayIcon />
              ブラウザで試す
            </a>
            <a className="lp-cta" href={RELEASES} rel="noopener noreferrer" target="_blank">
              Windows版をダウンロード
              <DownloadIcon />
            </a>
          </div>
        </div>

        <figure className="lp-plate lp-f1">
          <div className="lp-fig-grid">
            <div className="lp-fig-col">
              <div className="lp-fig-head">
                <span aria-hidden="true" className="lp-num">
                  1
                </span>
                <span className="lp-fig-title">次の一手</span>
                <span className="lp-fig-note">プロジェクトごとに1つ</span>
              </div>
              <div className="lp-k lp-fig-card">
                <span className="lp-fig-meta">
                  <span className="lp-dot lp-dot--violet" />
                  学習
                </span>
                <span className="lp-fig-text">参考書を10ページ進める</span>
              </div>
              <div className="lp-k lp-fig-card lp-a1">
                <span className="lp-fig-meta">
                  <span className="lp-dot lp-dot--amber" />
                  読書
                </span>
                <span className="lp-fig-text">数分だけ読む</span>
              </div>
              <div className="lp-k lp-fig-card">
                <span className="lp-fig-meta">
                  <span className="lp-dot lp-dot--green" />
                  運動
                </span>
                <span className="lp-fig-text">ストレッチをする</span>
              </div>
            </div>

            <div className="lp-fig-col">
              <div className="lp-fig-head">
                <span aria-hidden="true" className="lp-num">
                  2
                </span>
                <span className="lp-fig-title">今日の3件</span>
                <span className="lp-fig-note">最大3件</span>
              </div>
              <div className="lp-k lp-fig-done">
                <CheckIcon size={14} />
                <span>ストレッチをする</span>
              </div>
              <div className="lp-fig-stack">
                <div className="lp-e lp-fig-slot">空き</div>
                <div className="lp-a2">
                  <div className="lp-k lp-fig-card">
                    <span className="lp-fig-meta">
                      <span className="lp-dot lp-dot--amber" />
                      読書
                    </span>
                    <span className="lp-fig-text">数分だけ読む</span>
                  </div>
                </div>
              </div>
              <div className="lp-e lp-fig-slot">空けておいてもかまいません</div>
            </div>

            <div className="lp-fig-col">
              <div className="lp-fig-head">
                <span aria-hidden="true" className="lp-num">
                  3
                </span>
                <span className="lp-fig-title">始める</span>
                <span className="lp-fig-note">5分 または 25分</span>
              </div>
              <div className="lp-fig-stack">
                <div className="lp-e lp-fig-timer-slot">待機中</div>
                <div className="lp-a3 lp-k lp-fig-running">
                  <div className="lp-fig-running-head">
                    <span className="lp-fig-running-title">
                      <span className="lp-fig-meta">
                        <span className="lp-dot lp-dot--amber" />
                        読書
                      </span>
                      <span className="lp-fig-strong">数分だけ読む</span>
                    </span>
                    <span className="lp-go lp-a4">
                      <PlayIcon size={12} />
                      5分で始める
                    </span>
                  </div>
                  <div className="lp-fig-chips">
                    <span className="lp-k lp-fig-chip lp-a5">読書メモが開く</span>
                    <span className="lp-k lp-fig-chip lp-a6">参考ページが開く</span>
                  </div>
                  <div className="lp-fig-bar-row">
                    <span className="lp-fig-bar">
                      <span className="lp-a7" />
                    </span>
                    <span className="lp-mono lp-fig-minutes">5分</span>
                  </div>
                  <div className="lp-a8 lp-fig-finish">
                    <CheckIcon size={14} />
                    <span>終了。次はここから: 3章のp.84から</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}

export function FlowSection() {
  return (
    <section className="lp-band" id="flow">
      <div className="lp-wrap lp-section">
        <div className="lp-section-head">
          <p className="lp-mono lp-eyebrow">使い方</p>
          <h2 className="lp-h2">
            <span>やることは4つだけ。</span>
          </h2>
        </div>
        <ol className="lp-steps">
          <li className="lp-step">
            <span className="lp-mono lp-step-num">1</span>
            <div aria-hidden="true" className="lp-k lp-vig">
              <div className="lp-k lp-vig-card">
                <span className="lp-vig-meta">
                  <span className="lp-dot lp-dot--violet" />
                  学習
                </span>
                <span className="lp-vig-text">参考書を10ページ進める</span>
              </div>
              <div className="lp-k lp-vig-card">
                <span className="lp-vig-meta">
                  <span className="lp-dot lp-dot--amber" />
                  読書
                </span>
                <span className="lp-vig-text">数分だけ読む</span>
              </div>
              <div className="lp-fig-stack">
                <div className="lp-e lp-hu lp-vig-add">＋ 次の一手</div>
                <div className="lp-hv">
                  <div className="lp-k lp-vig-card">
                    <span className="lp-vig-meta">
                      <span className="lp-dot lp-dot--green" />
                      運動
                    </span>
                    <span className="lp-vig-text">ストレッチをする</span>
                  </div>
                </div>
              </div>
            </div>
            <span className="lp-step-title">次の一手を書いておく</span>
            <span className="lp-step-text">
              プロジェクトごとに1つ、「次にやること」を書いておきます。思いついたことは「やりたいこと」に置けます。
            </span>
          </li>

          <li className="lp-step">
            <span className="lp-mono lp-step-num">2</span>
            <div aria-hidden="true" className="lp-k lp-vig">
              <span className="lp-vig-label">
                今日の3件
                <span className="lp-vig-count">
                  <span className="lp-hu">2 / 3</span>
                  <span className="lp-hv lp-hv--flat">3 / 3</span>
                </span>
              </span>
              <div className="lp-vig-grid">
                <div className="lp-k lp-vig-tile lp-vig-tile--amber">
                  <span className="lp-vig-tile-label">読書</span>
                  <span className="lp-vig-tile-text">数分読む</span>
                </div>
                <div className="lp-k lp-vig-tile lp-vig-tile--green">
                  <span className="lp-vig-tile-label">運動</span>
                  <span className="lp-vig-tile-text">散歩</span>
                </div>
                <div className="lp-fig-stack">
                  <div className="lp-e lp-hu lp-vig-empty">空き</div>
                  <div className="lp-k lp-hv lp-vig-tile lp-vig-tile--violet">
                    <span className="lp-vig-tile-label">学習</span>
                    <span className="lp-vig-tile-text">参考書</span>
                  </div>
                </div>
              </div>
              <span className="lp-vig-note">4件目は入りません</span>
            </div>
            <span className="lp-step-title">今日やる3件を選ぶ</span>
            <span className="lp-step-text">
              候補から今日やるものを最大3件選びます。4件目は入りません。
            </span>
          </li>

          <li className="lp-step">
            <span className="lp-mono lp-step-num">3</span>
            <div aria-hidden="true" className="lp-k lp-vig">
              <span className="lp-go lp-p1 lp-vig-go">
                <PlayIcon size={12} />
                5分で始める
              </span>
              <div className="lp-vig-chips">
                <span className="lp-k lp-q1">読書メモが開く</span>
                <span className="lp-k lp-q2">参考ページが開く</span>
              </div>
              <span className="lp-vig-clock">
                <span className="lp-vig-bar">
                  <span className="lp-bar" />
                </span>
                <span className="lp-mono lp-vig-time">04:06</span>
              </span>
            </div>
            <span className="lp-step-title">5分で始める</span>
            <span className="lp-step-text">
              ボタンを押すと、その作業に使うアプリ・ファイル・URL が開き、タイマーが動きます。
            </span>
          </li>

          <li className="lp-step">
            <span className="lp-mono lp-step-num">4</span>
            <div aria-hidden="true" className="lp-k lp-vig">
              <span className="lp-vig-text lp-vig-text--strong">予定時間になりました</span>
              <span className="lp-vig-label">次はここから</span>
              <span className="lp-k lp-vig-quote">
                <span className="lp-ty">3章のp.84から</span>
              </span>
              <span className="lp-vig-choices">
                <span className="lp-vig-choice">続ける</span>
                <span className="lp-p2 lp-vig-choice lp-vig-choice--danger">終わる</span>
              </span>
            </div>
            <span className="lp-step-title">終えて、次を書き残す</span>
            <span className="lp-step-text">
              予定時間が来たら、延ばすか終えるかを選びます。終えるときに「次はここから」を残せます。
            </span>
          </li>
        </ol>
      </div>
    </section>
  );
}

type Zone = { id: string; title: string; text: string };

const ZONES: Zone[] = [
  {
    id: "1",
    title: "辞書・ショートカット",
    text: "よく使うアプリ・フォルダ・URL を置きます。デモでは開く動きだけを画面で見せます。",
  },
  {
    id: "2",
    title: "今日の勝利条件",
    text: "今日の目標を1行で書き、できたら印を付けます。",
  },
  {
    id: "3",
    title: "今やる一手",
    text: "迷ったときに見る場所です。次の一手の中から、1件だけ出します。",
  },
  {
    id: "4",
    title: "今日の3件",
    text: "今日やると決めたものです。最大3件でここからタイマーを始めます。",
  },
  {
    id: "5",
    title: "次の一手・やりたいこと",
    text: "候補を置く場所です。次の一手はプロジェクトごとに1つです。",
  },
  {
    id: "6",
    title: "タイマー",
    text: "5分か25分で始めます。予定時間が来たら、延ばすか終えるかを選びます。",
  },
];

type ZoneRect = {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  /** 本文の列の中の場所は、本文の列の見えている範囲で切る(stage 内の座標)。 */
  clip?: { left: number; top: number; width: number; height: number };
};

/**
 * 番号は本物のデモの上に重ねる。位置はデモの中の `[data-zone="n"]` を測って決めるので、
 * デモの高さや開閉が変わってもずれない。帯そのものは操作を邪魔しないよう
 * pointer-events を切ってあり、触れるのは番号の丸だけ。
 */
export function DemoScreenSection({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [rects, setRects] = useState<ZoneRect[]>([]);
  const [active, setActive] = useState<string | null>(null);
  // 説明を押したときに、対応する場所を約1.6秒だけ光らせる。
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  /**
   * 番号の説明を押したときの移動。ページをデモの窓全体が入る位置へ動かし、
   * 本文の列の場所なら、本文の列の中もその場所(上の番号の札を含む)が見える所まで動かす。
   * 1列に折りたたむ幅では中のスクロールが無いので、場所が画面の縦の真ん中に来るまでページを動かす。
   * フォーカスは動かさない(押した説明のボタンに残る)。
   */
  const goToZone = (id: string) => {
    const stage = stageRef.current;
    if (!stage) return;
    const behavior: ScrollBehavior = prefersReducedMotion() ? "instant" : "smooth";
    const node = stage.querySelector<HTMLElement>(`[data-zone="${id}"]`);
    const main = stage.querySelector<HTMLElement>(".dl-main");
    const scrollsInside = main !== null && getComputedStyle(main).overflowY === "auto";
    if (!scrollsInside) {
      if (node) {
        const rect = node.getBoundingClientRect();
        const top = rect.top + window.scrollY + rect.height / 2 - window.innerHeight / 2;
        window.scrollTo({ top: Math.max(0, top), behavior });
      }
    } else {
      scrollToDemoWindow();
      if (node && main && main.contains(node)) {
        const view = main.getBoundingClientRect();
        const rect = node.getBoundingClientRect();
        // 番号の札は、場所の左上から 11px はみ出し、光る枠は 3px 外に出る。
        const above = rect.top - 14 - view.top;
        const below = rect.bottom + 4 - view.bottom;
        const delta = above < 0 ? above : below > 0 ? Math.min(below, above) : 0;
        if (delta !== 0) main.scrollTo({ top: main.scrollTop + delta, behavior });
      }
    }
    window.clearTimeout(flashTimer.current);
    setFlash(id);
    flashTimer.current = window.setTimeout(() => setFlash(null), 1600);
  };
  const lit = (id: string) => active === id || flash === id;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const base = stage.getBoundingClientRect();
      const next: ZoneRect[] = [];
      for (const zone of ZONES) {
        const node = stage.querySelector<HTMLElement>(
          `[data-zone="${zone.id}"]`,
        );
        if (!node) continue;
        const rect = node.getBoundingClientRect();
        const scroller = node.closest<HTMLElement>(".dl-main");
        const view = scroller?.getBoundingClientRect();
        next.push({
          id: zone.id,
          left: rect.left - base.left,
          top: rect.top - base.top,
          width: rect.width,
          height: rect.height,
          clip: view
            ? {
                left: view.left - base.left,
                top: view.top - base.top,
                width: view.width,
                height: view.height,
              }
            : undefined,
        });
      }
      setRects((current) =>
        current.length === next.length &&
        current.every((item, index) => {
          const candidate = next[index];
          return (
            candidate &&
            item.id === candidate.id &&
            Math.round(item.left) === Math.round(candidate.left) &&
            Math.round(item.top) === Math.round(candidate.top) &&
            Math.round(item.width) === Math.round(candidate.width) &&
            Math.round(item.height) === Math.round(candidate.height) &&
            Math.round(item.clip?.top ?? 0) === Math.round(candidate.clip?.top ?? 0) &&
            Math.round(item.clip?.height ?? 0) === Math.round(candidate.clip?.height ?? 0)
          );
        })
          ? current
          : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    for (const node of stage.querySelectorAll("[data-zone]")) observer.observe(node);
    const onScroll = () => measure();
    window.addEventListener("resize", onScroll);
    // 本文の列が中でスクロールしたときも、番号を一緒に動かす(scroll は伝わらないので capture)。
    stage.addEventListener("scroll", onScroll, true);
    const interval = window.setInterval(measure, 800);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onScroll);
      stage.removeEventListener("scroll", onScroll, true);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <section id="screen">
      <div className="lp-wrap lp-section">
        <div className="lp-section-head">
          <p className="lp-mono lp-eyebrow">デモ</p>
          <h2 className="lp-h2">
            <span>開始までの流れを試す。</span>
          </h2>
          <p className="lp-lead lp-lead--tight lp-demo-lead">
            サンプルデータだけで安全に試せます。
          </p>
        </div>

        <figure className="lp-fig2">
          <div className="lp-stage" ref={stageRef}>
            {children}
            {rects.map((rect) => {
              const zone = ZONES.find((item) => item.id === rect.id)!;
              const isActive = lit(rect.id);
              const origin = rect.clip ?? { left: 0, top: 0, width: 0, height: 0 };
              const zoneNode = (
                <div
                  className="lp-zone"
                  data-active={isActive ? "true" : undefined}
                  key={rect.clip ? undefined : rect.id}
                  style={{
                    left: `${rect.left - origin.left}px`,
                    top: `${rect.top - origin.top}px`,
                    width: `${rect.width}px`,
                    height: `${rect.height}px`,
                  }}
                >
                  <button
                    aria-label={`${zone.title}の説明を見る`}
                    className="lp-zone-num"
                    onBlur={() => setActive(null)}
                    onFocus={() => setActive(rect.id)}
                    onMouseEnter={() => setActive(rect.id)}
                    onMouseLeave={() => setActive(null)}
                    type="button"
                  >
                    {rect.id}
                  </button>
                </div>
              );
              return rect.clip ? (
                <div
                  className="lp-zone-clip"
                  key={rect.id}
                  style={{
                    left: `${rect.clip.left}px`,
                    top: `${rect.clip.top}px`,
                    width: `${rect.clip.width}px`,
                    height: `${rect.clip.height}px`,
                  }}
                >
                  {zoneNode}
                </div>
              ) : (
                zoneNode
              );
            })}
          </div>

          <ol className="lp-zone-list">
            {ZONES.map((zone) => (
              <li
                className="lp-zone-item"
                data-active={lit(zone.id) ? "true" : undefined}
                key={zone.id}
                onMouseEnter={() => setActive(zone.id)}
                onMouseLeave={() => setActive(null)}
              >
                <button
                  className="lp-zone-item-btn"
                  data-zone-go={zone.id}
                  onClick={() => goToZone(zone.id)}
                  type="button"
                >
                  <span aria-hidden="true" className="lp-num">
                    {zone.id}
                  </span>
                  <span className="lp-zone-copy">
                    <span className="lp-zone-title">{zone.title}</span>
                    <span className="lp-zone-text">{zone.text}</span>
                  </span>
                  <span className="lp-sr-only">デモの{zone.title}へ移動</span>
                </button>
              </li>
            ))}
          </ol>
        </figure>
      </div>
    </section>
  );
}

const SCOPE_ROWS: { label: string; demo: boolean | string; windows: boolean | string }[] = [
  { label: "今やる一手・今日の3件・今日の勝利条件", demo: true, windows: true },
  { label: "タイマー(5分・25分・延長)", demo: true, windows: true },
  { label: "まとめて取り込む", demo: true, windows: true },
  { label: "辞書", demo: true, windows: true },
  { label: "アプリ・ファイル・URL を開く", demo: "開く動きだけ", windows: true },
  { label: "手順書ビューアー", demo: false, windows: true },
  { label: "記録・今週を決める", demo: false, windows: true },
  { label: "データの保存先", demo: "このブラウザの中", windows: "この PC の中" },
];

const Cell = ({ value }: { value: boolean | string }) => {
  if (value === true)
    return (
      <span className="lp-cell-yes">
        <span className="lp-sr-only">できる</span>
        <CheckIcon />
      </span>
    );
  if (value === false)
    return (
      <span aria-label="できない" className="lp-cell-no" role="img">
        —
      </span>
    );
  return <span>{value}</span>;
};

export function ScopeSection() {
  return (
    <section className="lp-band" id="diff">
      <div className="lp-wrap lp-section">
        <div className="lp-section-head">
          <p className="lp-mono lp-eyebrow">試せる機能</p>
          <h2 className="lp-h2">
            <span>試した流れを取り入れる。</span>
          </h2>
        </div>
        <div className="lp-table-scroll">
          <table className="lp-table">
            <thead>
              <tr>
                <th scope="col">できること</th>
                <th scope="col">デモ</th>
                <th scope="col">Windows版</th>
              </tr>
            </thead>
            <tbody>
              {SCOPE_ROWS.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td>
                    <Cell value={row.demo} />
                  </td>
                  <td>
                    <Cell value={row.windows} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lp-note">デモはWindows版をすべて移したものではありません。</p>
      </div>
    </section>
  );
}

export function FinalSection() {
  return (
    <section id="get">
      <div className="lp-wrap lp-final">
        <span aria-hidden="true" className="lp-ghost">
          05:00
        </span>
        <div className="lp-final-copy">
          <p className="lp-mono lp-eyebrow">READY?</p>
          <h2 className="lp-fin">
            <span>
              <span className="lp-hl">次の一手</span>を、
            </span>
            <span>今ここで始める。</span>
          </h2>
          <a className="lp-try" href="#screen" onClick={tryDemo}>
            <PlayIcon size={16} />
            まずはブラウザで試す
          </a>
        </div>
        <div className="lp-get">
          <h3>Windows版を入手</h3>
          <p className="lp-get-meta">Windows 10 / 11 (x64) · WebView2 Runtime</p>
          <a className="lp-getbtn" href={RELEASES} rel="noopener noreferrer" target="_blank">
            <span>最新版をダウンロード</span>
            <span>（GitHub Releases）</span>
          </a>
          <p className="lp-get-note">
            インストーラー / 単体実行 EXE / ポータブル ZIP の 3 形式・SHA256SUMS 添付
          </p>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap lp-footer-inner">
        <span>© 2026 Takuyakou</span>
        <div className="lp-footer-links">
          <a href={REPO} rel="noopener noreferrer" target="_blank">
            GitHub
          </a>
          <a href={RELEASES} rel="noopener noreferrer" target="_blank">
            Windows版
          </a>
        </div>
      </div>
    </footer>
  );
}

import { useEffect, useState } from "react";
import type { DemoTimerState } from "../demo/types";
import { UiIcon } from "./UiIcon";

type Props = {
  timer: DemoTimerState;
  minutes: number;
  onChangeMinutes: (minutes: number) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onDemoComplete: () => void;
  onDemoAdvance: () => void;
  advanceMinutes: number | null;
};

const formatClock = (seconds: number) => {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${(safe % 60).toString().padStart(2, "0")}`;
};

export function DemoTimerPanel({
  timer,
  minutes,
  onChangeMinutes,
  onPause,
  onResume,
  onStop,
  onDemoComplete,
  onDemoAdvance,
  advanceMinutes,
}: Props) {
  const [draft, setDraft] = useState(String(minutes));
  const active = timer.status !== "idle";
  const running = timer.status === "running";

  useEffect(() => {
    setDraft(String(minutes));
  }, [minutes]);

  const commit = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      setDraft(String(minutes));
      return;
    }
    const next = Math.min(240, Math.max(1, parsed));
    setDraft(String(next));
    onChangeMinutes(next);
  };

  const clock = active
    ? formatClock(timer.mode === "measure" ? timer.elapsedSeconds : timer.remainingSeconds)
    : `${minutes}分`;
  const percent =
    timer.mode !== "measure" && timer.durationSeconds > 0
      ? Math.min(
          100,
          Math.max(
            0,
            ((timer.durationSeconds - timer.remainingSeconds) / timer.durationSeconds) * 100,
          ),
        )
      : null;

  const state = !active
    ? "待機中"
    : timer.status === "paused"
      ? "一時停止"
      : timer.status === "finished"
        ? "完了確認中"
        : timer.mode === "measure"
          ? "計測中"
          : "実行中";

  return (
    <section aria-label="デモタイマー" className="dl-timer">
      <div className="dl-timer-meta">
        <span>Timer</span>
      </div>
      <strong className="dl-timer-title">{active ? timer.label : "通常タイマー"}</strong>
      <div className="dl-timer-state">
        <span
          className="dl-pill dl-pill--state"
          data-state={
            !active
              ? "idle"
              : timer.status === "paused"
                ? "paused"
                : timer.status === "finished"
                  ? "complete"
                  : "running"
          }
        >
          {state}
        </span>
      </div>
      <div aria-label="残り時間" className="dl-timer-clock" role="timer">
        {clock}
      </div>
      {percent !== null ? (
        <div aria-hidden="true" className="dl-timer-progress">
          <span style={{ width: `${percent}%` }} />
        </div>
      ) : null}

      {active ? (
        <div className="dl-timer-controls">
          <button
            className="dl-timer-button"
            onClick={running ? onPause : onResume}
            type="button"
          >
            <UiIcon name={running ? "pause" : "play"} size={14} />
            {running ? "一時停止" : "再開"}
          </button>
          <button
            className="dl-timer-button dl-timer-button--finish"
            onClick={onStop}
            type="button"
          >
            <UiIcon name="stop" size={14} />
            終了
          </button>
        </div>
      ) : (
        <div className="dl-timer-presets">
          <button
            aria-label="通常タイマーを5分減らす"
            className="dl-preset-button"
            onClick={() => onChangeMinutes(Math.max(1, minutes - 5))}
            type="button"
          >
            −
          </button>
          <label className="dl-preset-input">
            <input
              aria-label="通常タイマーの分数"
              inputMode="numeric"
              max={240}
              min={1}
              onBlur={(event) => commit(event.target.value)}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              type="number"
              value={draft}
            />
            <span>分</span>
          </label>
          <button
            aria-label="通常タイマーを5分増やす"
            className="dl-preset-button"
            onClick={() => onChangeMinutes(Math.min(240, minutes + 5))}
            type="button"
          >
            ＋
          </button>
        </div>
      )}

      {active ? (
        <div className="dl-timer-demo">
          {advanceMinutes !== null ? (
            <button
              className="dl-demo-button"
              onClick={onDemoAdvance}
              type="button"
            >
              {advanceMinutes}分経過まで進める <span>DEMO</span>
            </button>
          ) : null}
          {timer.mode !== "measure" ? (
            <button
              className="dl-demo-button"
              onClick={onDemoComplete}
              type="button"
            >
              満了まで進める <span>DEMO</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

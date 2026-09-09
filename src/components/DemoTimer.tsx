import type { DemoTimerState } from "../demo/types";
import { UiIcon } from "./UiIcon";

type DemoTimerProps = {
  timer: DemoTimerState;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onDemoComplete: () => void;
  onDemoAdvance: () => void;
  canAdvance: boolean;
};

const formatSeconds = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
};

export function DemoTimer({
  timer,
  onPause,
  onResume,
  onStop,
  onDemoComplete,
  onDemoAdvance,
  canAdvance,
}: DemoTimerProps) {
  const active = timer.status !== "idle";

  return (
    <aside
      aria-label="デモタイマー"
      className={`demo-timer timer-${timer.status}`}
    >
      <div>
        <p className="eyebrow">Timer</p>
        <strong>{active ? timer.label : "開始を待っています"}</strong>
        <span className="timer-status">
          {timer.status === "running"
            ? "実行中"
            : timer.status === "paused"
              ? "一時停止"
              : timer.status === "finished"
                ? "満了"
                : timer.status === "early"
                  ? "終了確認中"
                  : "待機中"}
        </span>
      </div>
      <div
        role="timer"
        aria-label="残り時間"
        aria-live="off"
        className="timer-clock"
      >
        {active ? formatSeconds(timer.remainingSeconds) : "25:00"}
      </div>
      {active && timer.status !== "finished" && timer.status !== "early" ? (
        <>
          <div className="timer-actions">
            {timer.status === "running" ? (
              <button
                className="button button-quiet"
                onClick={onPause}
                type="button"
              >
                <UiIcon name="pause" size={15} /> 一時停止
              </button>
            ) : (
              <button
                className="button button-good"
                onClick={onResume}
                type="button"
              >
                <UiIcon name="play" size={15} /> 再開
              </button>
            )}
            <button
              className="button button-danger"
              onClick={onStop}
              type="button"
            >
              <UiIcon name="stop" size={15} /> 終了
            </button>
          </div>
          <button
            className="demo-complete-button"
            onClick={onDemoAdvance}
            disabled={!canAdvance}
            type="button"
          >
            短時間分まで進める <span>DEMO</span>
          </button>
          <button
            className="demo-complete-button"
            onClick={onDemoComplete}
            type="button"
          >
            満了まで進める <span>DEMO</span>
          </button>
        </>
      ) : (
        <p className="timer-hint">
          {timer.status === "finished" || timer.status === "early"
            ? "終了を確認してください。"
            : "今やる一手・今日の3件から開始"}
        </p>
      )}
    </aside>
  );
}

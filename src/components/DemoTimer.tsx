import type { DemoTimerState } from "../demo/types";
import { UiIcon } from "./UiIcon";

type DemoTimerProps = {
  timer: DemoTimerState;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
};

const formatSeconds = (seconds: number) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
};

export function DemoTimer({ timer, onPause, onResume, onStop }: DemoTimerProps) {
  const active = timer.status !== "idle";

  return (
    <aside aria-label="デモタイマー" className={`demo-timer timer-${timer.status}`}>
      <div>
        <p className="eyebrow">Timer</p>
        <strong>{active ? timer.label : "開始を待っています"}</strong>
        <span className="timer-status">
          {timer.status === "running" ? "実行中" : timer.status === "paused" ? "一時停止" : "待機中"}
        </span>
      </div>
      <div aria-live="polite" className="timer-clock">
        {active ? formatSeconds(timer.remainingSeconds) : "25:00"}
      </div>
      {active ? (
        <div className="timer-actions">
          {timer.status === "running" ? (
            <button className="button button-quiet" onClick={onPause} type="button">
              <UiIcon name="pause" size={15} /> 一時停止
            </button>
          ) : (
            <button className="button button-good" onClick={onResume} type="button">
              <UiIcon name="play" size={15} /> 再開
            </button>
          )}
          <button className="button button-danger" onClick={onStop} type="button">
            <UiIcon name="stop" size={15} /> 終了
          </button>
        </div>
      ) : (
        <p className="timer-hint">次の一手から5分または25分を選べます。</p>
      )}
    </aside>
  );
}

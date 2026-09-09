import type { TimerStatus } from "../demo/types";
import { UiIcon } from "./UiIcon";

type Props = {
  label: string;
  status: TimerStatus;
  shortMinutes?: number;
  normalMinutes?: number;
  primary?: boolean;
  onStart: (minutes: number) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
};

export function TimerActions({
  label,
  status,
  shortMinutes = 5,
  normalMinutes = 25,
  primary,
  onStart,
  onPause,
  onResume,
  onStop,
}: Props) {
  return (
    <div
      className="sync-timer-actions"
      role="group"
      aria-label={`${label}のタイマー操作`}
    >
      {status === "idle" ? (
        <>
          <button
            type="button"
            className="button button-good"
            aria-label={`${label}を${shortMinutes}分で開始`}
            data-demo-do-now-short={primary || undefined}
            onClick={() => onStart(shortMinutes)}
          >
            <UiIcon name="play" size={14} />
            <span>
              {primary ? `${shortMinutes}分で始める` : `${shortMinutes}分`}
            </span>
          </button>
          <button
            type="button"
            className="button button-normal"
            aria-label={`${label}を${normalMinutes}分で開始`}
            onClick={() => onStart(normalMinutes)}
          >
            <UiIcon name="play" size={14} />
            <span>
              {primary ? `通常${normalMinutes}分` : `${normalMinutes}分`}
            </span>
          </button>
        </>
      ) : status === "finished" || status === "early" ? (
        <span role="status">{status === "early" ? "終了確認中" : "満了"}</span>
      ) : (
        <>
          <button
            type="button"
            className={`button ${status === "paused" ? "button-good" : "button-quiet"}`}
            aria-label={`${label}を${status === "paused" ? "再開" : "一時停止"}`}
            onClick={status === "paused" ? onResume : onPause}
          >
            <UiIcon name={status === "paused" ? "play" : "pause"} size={14} />
            <span>{status === "paused" ? "再開" : "一時停止"}</span>
          </button>
          <button
            type="button"
            className="button button-danger"
            aria-label={`${label}を終了`}
            onClick={onStop}
          >
            <UiIcon name="stop" size={14} />
            <span>終了</span>
          </button>
        </>
      )}
    </div>
  );
}

import type { ReactNode } from "react";
import { MobileButton, type MobileButtonVariant } from "./Button";

export type MobileErrorSymbolColor = "dark-gray" | "white" | "light-gray";

const SYMBOL_COLOR_CLASS: Record<MobileErrorSymbolColor, string> = {
  "dark-gray": "bg-[var(--mobile-color-dark-gray)]",
  white: "bg-[var(--mobile-color-white)]",
  "light-gray": "bg-[var(--mobile-color-light-gray)]",
};

const SYMBOL_STROKE_COLOR: Record<MobileErrorSymbolColor, string> = {
  "dark-gray": "#4A4A4A",
  white: "#FFFFFF",
  "light-gray": "#C7C7C7",
};

/**
 * E01~E07(에러 화면) 공용 상단 장식 심볼 — "II ○ II ≡" 4개 요소, h-14px, gap-13.377px.
 * E01/E02/E03/E04(dark, white)와 E05/E06/E07(light, light-gray)까지 7개 전부 대조 완료 —
 * 구조/치수는 100% 동일하고 색만 화면마다 다르다. 처음엔 "dark 배경=white, light
 * 배경=dark-gray"로 짐작했는데 Figma가 E06을 dark-gray→light-gray로 바꾼 걸 재확인하면서
 * 그 짐작이 틀렸다는 게 증명됐다 — 그래서 테마로 자동 추론하지 않고 화면마다 실측값을
 * color prop으로 명시한다(E01~E04=white, E05~E07=light-gray, dark-gray는 실제로 쓰인 화면
 * 없었지만 옵션은 남겨둠).
 *
 * Figma가 두 개의 얇은 막대를 grid로 "같은 셀에 겹쳐서 margin으로 밀어내는" 방식으로
 * 구현했는데(place-items-start + col-1/row-1 + ml), 실제로는 겹치지 않고 나란히 있을
 * 뿐이라 relative+absolute 두 겹으로 단순화했다(시각적 결과는 동일, 코드만 단순).
 * 3줄 "≡" 부분도 원본은 rotate-90 트릭을 쓰지만, 회전 후 눈에 보이는 최종 크기가
 * 그냥 가로 막대와 같아서 회전 없이 바로 구현했다.
 */
export function MobileErrorSymbol({ color = "dark-gray" }: { color?: MobileErrorSymbolColor }) {
  const barClass = SYMBOL_COLOR_CLASS[color];
  const strokeColor = SYMBOL_STROKE_COLOR[color];

  return (
    <div className="flex h-[14px] items-start gap-[13.377px]">
      <div className="relative h-[14px] w-[14px] shrink-0">
        <div className={`absolute top-0 left-0 h-[14px] w-[3.267px] ${barClass}`} />
        <div className={`absolute top-0 left-[10.73px] h-[14px] w-[3.267px] ${barClass}`} />
      </div>
      <svg viewBox="0 0 14 14" fill="none" className="size-[14px] shrink-0" aria-hidden>
        <path
          d="M7 1.63379C9.96389 1.6338 12.3662 4.03608 12.3662 7C12.3662 9.96392 9.96389 12.3662 7 12.3662C4.03609 12.3662 1.63379 9.96393 1.63379 7C1.63379 4.03607 4.03609 1.63379 7 1.63379Z"
          stroke={strokeColor}
          strokeWidth="3.26667"
        />
      </svg>
      <div className="relative h-[14px] w-[14px] shrink-0">
        <div className={`absolute top-0 left-0 h-[14px] w-[3.267px] ${barClass}`} />
        <div className={`absolute top-0 left-[10.73px] h-[14px] w-[3.267px] ${barClass}`} />
      </div>
      <div className="relative h-[14px] w-[14px] shrink-0">
        <div className={`absolute top-[10.73px] left-0 h-[3.111px] w-[14px] ${barClass}`} />
        <div className={`absolute top-[5.37px] left-0 h-[3.111px] w-[14px] ${barClass}`} />
        <div className={`absolute top-0 left-0 h-[3.111px] w-[14px] ${barClass}`} />
      </div>
    </div>
  );
}

export type MobileErrorMessageIconColor = "accent" | "light-gray";

const MESSAGE_ICON_FILL: Record<MobileErrorMessageIconColor, string> = {
  accent: "var(--mobile-color-accent)",
  "light-gray": "var(--mobile-color-light-gray)",
};

/**
 * E01~E07 공용 중앙 아이콘 — 처음엔 "돋보기"로 짐작했는데 실제 path를 뽑아보니 스타일라이즈된
 * 큰따옴표(") 모양이었다(E06에서 확인). path 자체(29.346×23.193)는 7개 화면 전부 byte-identical
 * — 색만 dark 테마(E01~E04)는 accent 노랑(#ffcc01), light 테마(E05~E07)는 light-gray(#c7c7c7).
 * 심볼과 달리 이 아이콘 색은 "테마=색" 2분류로 정확히 맞아떨어졌다(심볼처럼 화면별 예외 없음,
 * 7개 전부 실측 완료).
 */
export function MobileErrorMessageIcon({ color }: { color: MobileErrorMessageIconColor }) {
  return (
    <svg viewBox="0 0 29.3457 23.1934" fill="none" className="h-[23.193px] w-[29.346px]" aria-hidden>
      <path
        d="M29.3457 23.1934H16.2598V12.7441L22.5586 0H28.3203L23.6328 11.7188H29.3457V23.1934ZM13.1348 23.1934H0V12.7441L6.34766 0H12.1094L7.42188 11.7188H13.1348V23.1934Z"
        fill={MESSAGE_ICON_FILL[color]}
      />
    </svg>
  );
}

export type MobileErrorStateActionProps = {
  label: string;
  href?: string;
  onClick?: () => void;
  /**
   * 버튼 색상은 화면 테마로 자동 추론하지 않는다 — E01~E07 7개 전부 대조한 결과 "보이는
   * 버튼" 색이 화면마다 달랐다: E01="outline-soft"(#757575), E02는 두 버튼 다 실제로
   * 보이며 첫 번째="outline-white", 두 번째="outline-soft", E03="outline-warm", E05/E06/E07=
   * "outline-dark". outline-soft/outline-white는 기존 MobileButtonVariant에 없어서 이번에
   * 추가했다. 화면마다 실측값을 명시하고, 안 넘기면 테마 기반 기본값만 폴백으로 쓴다.
   */
  variant?: MobileButtonVariant;
};

export type MobileErrorDescriptionLine = string | { text: string; hidden?: boolean };

/**
 * E01~E07 공유 템플릿 — symbolIcon(상단 장식)/messageIcon(중앙 아이콘)/title(줄별 배열)/
 * description(줄별 배열)/primaryAction+secondaryAction(선택) 또는 footer(둘 중 하나) props를
 * 받는다.
 *
 * 버튼 슬롯은 기본 2개인데, 화면마다 실제로 몇 개가 보이는지가 다르다(E01/E03/E05/E06/E07은
 * 1개만 보이고 나머지 하나는 opacity-0 스페이서, E02는 2개 다 보임) — secondaryAction을
 * 안 넘기면 h-56px 빈 스페이서를 그대로 둔다. E04는 버튼 자체가 없고 완전히 다른 구조
 * (문의 안내 텍스트 2줄)라 footer로 통째로 대체한다 — footer가 있으면 버튼 슬롯 자체를
 * 렌더링하지 않는다(primaryAction/secondaryAction과 동시에 안 씀).
 */
type MobileErrorStateButtonsProps =
  | { footer?: undefined; primaryAction: MobileErrorStateActionProps; secondaryAction?: MobileErrorStateActionProps }
  | { footer: ReactNode; primaryAction?: undefined; secondaryAction?: undefined };

export function MobileErrorState({
  theme = "light",
  symbolIcon,
  messageIcon,
  title,
  description,
  bottomPadding = 160,
  ...buttons
}: {
  theme?: "light" | "dark";
  symbolIcon: ReactNode;
  messageIcon: ReactNode;
  title: string[];
  description: MobileErrorDescriptionLine[];
  /** 대부분 160px, E03(세션 만료)만 140px(위아래 대칭 패딩) — Figma 실측 결과 다름. */
  bottomPadding?: number;
} & MobileErrorStateButtonsProps) {
  const bgClass = theme === "dark" ? "bg-[var(--mobile-color-black)]" : "bg-[var(--mobile-color-white)]";
  const titleColorClass = theme === "dark" ? "text-[var(--mobile-color-white)]" : "text-[var(--mobile-color-dark-gray)]";
  const fallbackVariant: MobileButtonVariant = theme === "dark" ? "outline-warm" : "outline-dark";

  return (
    <div
      className={`flex min-h-screen w-full flex-col items-center gap-[140px] px-[var(--mobile-space-30)] pt-[140px] ${bgClass}`}
      style={{ paddingBottom: bottomPadding }}
    >
      {symbolIcon}

      {/* Message 블록은 Figma에서 고정 높이(233.193px)를 갖는 컴포넌트다 — 타이틀이
          1줄이든 2줄이든 이 박스 크기는 항상 같고, 내용은 그 안에서 위쪽부터 채워진다.
          get_metadata 실측: E01(타이틀 2줄)과 E03(타이틀 1줄)의 Message 노드 height가
          233.193/233.19로 완전히 같고, 바로 다음 버튼 블록의 y좌표도 두 화면에서
          똑같이 message.y+373.193이었다 — content 높이만큼 박스가 줄어들게 두면(고정
          높이 없이 content-driven로 두면) 타이틀이 짧을 때 버튼이 그만큼 위로 딸려
          올라간다(실제 발견된 버그). h-[233.193px]를 고정해서 버튼 위치를 타이틀
          줄 수와 무관하게 항상 동일하게 만든다 — 2줄 타이틀처럼 content가 233.193px를
          넘는 화면은 박스 밖으로 살짝 넘치지만(overflow, clip 안 함) 그것도 Figma
          원본과 동일한 실제 동작이다(다음 형제 요소 위치는 넘친 content가 아니라 이
          고정 높이 기준으로 계산됨). */}
      <div className="flex h-[233.193px] w-[333px] flex-col items-center gap-[40px]">
        {messageIcon}

        <div className={`text-center text-[30px] leading-[42px] font-extrabold tracking-[-0.6px] ${titleColorClass}`}>
          {title.map((line, index) => (
            <p key={index} className={index < title.length - 1 ? "mb-0" : ""}>
              {line}
            </p>
          ))}
        </div>

        <div className="flex w-full flex-col items-center gap-[8px] text-center text-[16px] leading-normal font-semibold tracking-[-0.32px] text-[var(--mobile-color-hint)]">
          {description.map((line, index) => {
            const isObj = typeof line === "object";
            const text = isObj ? line.text : line;
            const hidden = isObj && line.hidden;
            return (
              <p key={index} className={hidden ? "opacity-0" : ""}>
                {text}
              </p>
            );
          })}
        </div>
      </div>

      {buttons.footer ? (
        buttons.footer
      ) : (
        <div className="flex w-[333px] flex-col items-start gap-[16px]">
          {buttons.secondaryAction ? (
            <MobileButton
              variant={buttons.secondaryAction.variant ?? fallbackVariant}
              compact
              href={buttons.secondaryAction.href}
              onClick={buttons.secondaryAction.onClick}
            >
              {buttons.secondaryAction.label}
            </MobileButton>
          ) : (
            <div aria-hidden className="h-[56px] w-[333px] opacity-0" />
          )}

          <MobileButton
            variant={buttons.primaryAction!.variant ?? fallbackVariant}
            compact
            href={buttons.primaryAction!.href}
            onClick={buttons.primaryAction!.onClick}
          >
            {buttons.primaryAction!.label}
          </MobileButton>
        </div>
      )}
    </div>
  );
}

import type { ComponentPropsWithoutRef } from "react";

/**
 * 밝은 화면(S11 사유입력 등)과 어두운 화면(S01 로그인)에서 배경만 달라지는 게 아니라,
 * 실제로 타이핑한 값의 글자색도 달라져야 한다 — S01은 검은 배경이라 값 텍스트가
 * black이면 안 보인다. bg="transparent"가 기본값이고, 사유입력/날짜선택처럼 옅은
 * 회색 채움이 필요하면 bg="filled". textColor="light"는 S01/S02처럼 어두운 배경 위
 * 인풋에 쓴다.
 */
export type MobileTextFieldBg = "transparent" | "filled";
export type MobileTextFieldTextColor = "dark" | "light";

type MobileTextFieldProps = {
  label?: string;
  bg?: MobileTextFieldBg;
  textColor?: MobileTextFieldTextColor;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"input">, "className">;

const BG_CLASSNAME: Record<MobileTextFieldBg, string> = {
  transparent: "bg-transparent",
  filled: "bg-[var(--mobile-color-input-bg)]",
};

/**
 * S11 "날짜 선택"(filled) 재검증 결과 border/padding이 transparent(S01 로그인 등)와
 * 다르다 — filled: border-light-gray + px-20/py-16, transparent: 기존 border-warm-gray
 * + px-30/py-20 그대로 유지(Stage 1에서 이미 검증됨, 여기서 건드리지 않음).
 */
const BORDER_CLASSNAME: Record<MobileTextFieldBg, string> = {
  transparent: "border-[var(--mobile-color-warm-gray)]",
  filled: "border-[var(--mobile-color-light-gray)]",
};

// filled(S11 날짜 선택)는 사용자 지시로 py-16보다 4px 낮게 강제 고정 — py-14.
const PADDING_CLASSNAME: Record<MobileTextFieldBg, string> = {
  transparent: "px-[var(--mobile-space-30)] py-[var(--mobile-space-20)]",
  filled: "px-[20px] py-[14px]",
};

/**
 * 라벨 크기는 bg 변형마다 실제로 다르다 — S16(transparent, 비밀번호 필드) 재검증 결과
 * 13px(caption)인데, S11(filled, 날짜선택)만 12px(badge)였다. 이전에 S11 기준으로
 * label을 전부 12px로 바꿨던 게 S01/S02/S16(transparent 전부)에 회귀였다 — bg별로
 * 분리해서 되돌림.
 */
const LABEL_TEXT_CLASSNAME: Record<MobileTextFieldBg, string> = {
  transparent: "text-[length:var(--mobile-text-caption)] tracking-[var(--mobile-text-caption-tracking)]",
  filled: "text-[length:var(--mobile-text-badge)] tracking-[var(--mobile-text-badge-tracking)]",
};

const TEXT_COLOR_CLASSNAME: Record<MobileTextFieldTextColor, string> = {
  dark: "text-[var(--mobile-color-black)]",
  light: "text-[var(--mobile-color-white)]",
};

export function MobileTextField({
  label,
  bg = "transparent",
  textColor = "dark",
  className = "",
  id,
  ...rest
}: MobileTextFieldProps) {
  return (
    <div className="flex w-full flex-col items-start justify-center gap-[var(--mobile-space-10)]">
      {label ? (
        <label
          htmlFor={id}
          className={`font-semibold text-[var(--mobile-color-soft-gray)] ${LABEL_TEXT_CLASSNAME[bg]}`}
        >
          {label}
        </label>
      ) : null}
      <input
        id={id}
        {...rest}
        // 크롬 등 브라우저 자동완성이 배경을 노랑/파랑으로 강제로 덮어써서 다크 테마
        // 인풋이 이상하게 보이는 문제 방지 — transition 지연 트릭으로 그 강제 배경을 무력화.
        className={`w-full rounded-[var(--mobile-radius-input)] border font-semibold text-[length:var(--mobile-text-subtitle)] tracking-[var(--mobile-text-subtitle-tracking)] placeholder:text-[var(--mobile-color-warm-gray)] focus:outline-none [&:-webkit-autofill]:[-webkit-text-fill-color:inherit] [&:-webkit-autofill]:[transition:background-color_600000s_0s,color_600000s_0s] ${BORDER_CLASSNAME[bg]} ${PADDING_CLASSNAME[bg]} ${BG_CLASSNAME[bg]} ${TEXT_COLOR_CLASSNAME[textColor]} ${className}`}
      />
    </div>
  );
}

/** "YYYY-MM-DD" -> "2026년 7월 23일 (목)". 요일만 Intl(KST 명시)로 구하고 연/월/일은
 * 문자열에서 직접 파싱한다(Date 게터는 브라우저 로컬 타임존을 타서 자정 근처에 하루
 * 어긋날 수 있음 — todayKST()류 패턴과 동일한 이유로 회피). */
function formatKoreanDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const weekday = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", weekday: "short" }).format(
    new Date(`${iso}T00:00:00+09:00`),
  );
  return `${year}년 ${month}월 ${day}일 (${weekday})`;
}

type MobileDateFieldProps = {
  label?: string;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"input">, "className" | "type" | "value">;

/**
 * S11 "시작일"/"종료일"/"날짜 선택" 전용 — Figma 원본(node 88:703)은 네이티브
 * `<input type="date">`가 아니라 포맷된 한글 텍스트("2026년 7월 15일 (수)")를 보여주는
 * 버튼이었다. 실제 `<input type="date">`를 그대로 쓰면 브라우저/OS마다 내부 렌더링이
 * 완전히 달라서(iOS Safari "2026. 7. 23.", Chrome "07/23/2026" 등 — 실측 확인, CD가
 * 실기기 스크린샷으로 "프레임이 깨졌다"고 지적한 원인) 디자인과 안 맞고 화면마다
 * 다르게 보인다. 진짜 `<input type="date">`는 완전히 투명하게 위에 겹쳐서
 * 클릭/접근성/네이티브 날짜 피커는 그대로 유지하고, 눈에 보이는 텍스트만 별도
 * div로 Figma 그대로 그린다.
 */
export function MobileDateField({ label, id, value, className = "", ...rest }: MobileDateFieldProps & { value: string }) {
  return (
    <div className="flex w-full flex-col items-start justify-center gap-[var(--mobile-space-10)]">
      {label ? (
        <label
          htmlFor={id}
          className="text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]"
        >
          {label}
        </label>
      ) : null}
      <div className="relative w-full">
        <div
          aria-hidden
          className="pointer-events-none flex w-full items-center justify-center rounded-[8px] border border-[var(--mobile-color-light-gray)] bg-[var(--mobile-color-input-bg)] px-[20px] py-[16px] text-[16px] font-semibold tracking-[-0.32px] text-[var(--mobile-color-black)]"
        >
          {value ? formatKoreanDate(value) : ""}
        </div>
        <input
          id={id}
          type="date"
          value={value}
          {...rest}
          className={`absolute inset-0 h-full w-full cursor-pointer opacity-0 ${className}`}
        />
      </div>
    </div>
  );
}

type MobileTextAreaProps = {
  label?: string;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"textarea">, "className">;

export function MobileTextArea({ label, className = "", id, ...rest }: MobileTextAreaProps) {
  return (
    <div className="flex w-full flex-col items-start justify-center gap-[var(--mobile-space-10)]">
      {label ? (
        <label
          htmlFor={id}
          className="text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-soft-gray)]"
        >
          {label}
        </label>
      ) : null}
      <textarea
        id={id}
        {...rest}
        // 사용자 지시로 중앙정렬 대신 좌측정렬로 강제 고정.
        className={`w-full rounded-[var(--mobile-radius-chip)] border border-[var(--mobile-color-light-gray)] bg-[var(--mobile-color-input-bg)] p-[var(--mobile-space-30)] text-left text-[length:var(--mobile-text-body)] font-semibold tracking-[var(--mobile-text-body-tracking)] text-[var(--mobile-color-black)] placeholder:text-[var(--mobile-color-warm-gray)] focus:outline-none ${className}`}
      />
    </div>
  );
}

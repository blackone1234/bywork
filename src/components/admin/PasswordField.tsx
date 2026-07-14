"use client";

import { useState, type ComponentPropsWithoutRef } from "react";
import { TextField, type TextFieldVariant, type TextFieldBorderColor } from "@/components/admin/TextField";
import { EyeIcon } from "@/components/admin/EyeIcon";

type PasswordFieldProps = Omit<ComponentPropsWithoutRef<"input">, "className" | "type" | "style"> & {
  variant?: TextFieldVariant;
  fullWidth?: boolean;
  borderColor?: TextFieldBorderColor;
  className?: string;
};

export function PasswordField({ className = "", fullWidth = false, ...rest }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative ${fullWidth ? "w-full" : "w-full max-w-[500px]"} ${className}`}>
      {/* 오른쪽에 눈 아이콘 버튼이 들어갈 자리를 inline style로 확보한다 — 이 프로젝트에서는
          className 문자열을 이어붙이는 방식으로 같은 속성(padding-right)을 덮어쓰면 Tailwind가
          생성하는 스타일시트 순서 때문에 안 먹힐 때가 있어서, 확실하게 이기는 inline style을 쓴다. */}
      <TextField {...rest} fullWidth={fullWidth} type={visible ? "text" : "password"} style={{ paddingRight: "44px" }} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "비밀번호 숨기기" : "비밀번호 표시"}
        className="absolute top-1/2 right-[16px] -translate-y-1/2 text-line transition-colors hover:text-black"
      >
        <EyeIcon crossed={!visible} />
      </button>
    </div>
  );
}

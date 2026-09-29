"use client";

import { useId, useRef, useState, type InputHTMLAttributes } from "react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/**
 * A password field with an eye button that shows or hides what was typed. The button never
 * submits the form, and pressing it leaves focus and the caret in the field. While the password
 * is visible the field is plain text, so spellcheck and autocorrect are kept off: browsers can
 * send spellchecked text to an online service, and a password must never go there.
 */
export function PasswordInput({ className = "", id, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fallbackId = useId();
  const inputId = id ?? fallbackId;

  // When a focused field changes type during a mouse click, Chrome moves the caret to the start at
  // the next repaint, so anything typed next would land at the front. Setting it back straight
  // away is undone by that repaint; putting it back on the next frame sticks.
  function toggle() {
    const input = inputRef.current;
    const start = input?.selectionStart ?? null;
    const end = input?.selectionEnd ?? null;
    setVisible((shown) => !shown);
    requestAnimationFrame(() => {
      if (input && document.activeElement === input) input.setSelectionRange(start, end);
    });
  }

  return (
    <span className="relative flex">
      <input
        {...props}
        ref={inputRef}
        id={inputId}
        type={visible ? "text" : "password"}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        className={`${className} w-full min-w-0 pr-11`}
      />
      <button
        type="button"
        aria-label="Show password"
        aria-controls={inputId}
        aria-pressed={visible}
        title={visible ? "Hide password" : "Show password"}
        onMouseDown={(event) => event.preventDefault()}
        onClick={toggle}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
      >
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="M4 4l16 16" />}
        </svg>
      </button>
    </span>
  );
}

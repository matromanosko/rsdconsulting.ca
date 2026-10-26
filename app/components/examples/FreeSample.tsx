"use client";

import { FormEvent, ReactNode, startTransition, useActionState, useEffect, useState } from "react";
import { requestSample } from "@/app/examples/actions";
import { DATA_SOURCES, type GateState } from "@/app/examples/gate";
import { useDict } from "@/app/lib/i18n/LangProvider";

// Fluent-style "free sample" dialog, opened from the home page and the
// /examples top bar. Submitting runs the Server Action, which forwards the
// lead, then the dialog swaps to a thank-you message.

const input =
  "h-8 w-full rounded-[2px] border border-[#8A8886] bg-white px-2 text-sm text-[#252423] outline-none placeholder:text-[#A19F9D] hover:border-[#323130] focus:border-[#252423] focus:shadow-[inset_0_-2px_0_#F2C811]";

const secondary =
  "inline-flex h-8 items-center rounded-[2px] border border-[#8A8886] px-4 text-sm font-semibold hover:bg-[#F3F2F1]";
const primary =
  "inline-flex h-8 items-center rounded-[2px] bg-[#252423] px-5 text-sm font-semibold text-white hover:bg-[#3B3A39] disabled:opacity-60";

function Field({ id, label, ...props }: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <input id={id} name={id} required className={input} {...props} />
    </div>
  );
}

export function FreeSampleDialog({ onClose }: { onClose: () => void }) {
  const t = useDict().sample;
  const [state, dispatch, pending] = useActionState<GateState, FormData>(requestSample, {});
  const [sources, setSources] = useState<string[]>([]);
  const [localError, setLocalError] = useState("");
  const [who, setWho] = useState({ name: "", email: "" });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggle(source: string) {
    setLocalError("");
    setSources((s) => (s.includes(source) ? s.filter((x) => x !== source) : [...s, source]));
  }

  // dispatch by hand so a failed attempt doesn't reset what was typed
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sources.length) return setLocalError(t.errors.sources);
    const data = new FormData(event.currentTarget);
    setWho({ name: String(data.get("name") ?? "").trim().split(/\s+/)[0], email: String(data.get("email") ?? "").trim() });
    startTransition(() => dispatch(data));
  }

  const error = localError || state.error;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#252423]/45 backdrop-blur-[3px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ fontFamily: '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif' }}
    >
      <div className="flex min-h-full items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sample-title"
          className="w-full max-w-[460px] rounded-[4px] bg-white text-left text-[#252423] shadow-[0_25px_60px_rgba(0,0,0,0.3)]"
        >
          <div className="h-1 rounded-t-[4px] bg-[#F2C811]" />
          {state.sent ? (
            <div className="flex flex-col gap-4 p-6">
              <h2 id="sample-title" className="text-xl font-bold">
                {t.thanks(who.name)}
              </h2>
              <p className="text-sm leading-relaxed text-[#605E5C]">
                {t.sent(who.email)}
              </p>
              <div className="flex justify-end pt-1">
                <button type="button" onClick={onClose} className={primary} autoFocus>
                  {t.close}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-1.5">
                <h2 id="sample-title" className="text-xl font-bold">
                  {t.title}
                </h2>
                <p className="text-sm leading-relaxed text-[#605E5C]">
                  {t.intro}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="name" label={t.name} autoComplete="name" autoFocus />
                <Field id="company" label={t.company} autoComplete="organization" />
                <Field id="email" label={t.email} type="email" autoComplete="email" />
                <Field id="phone" label={t.phone} type="tel" autoComplete="tel" />
              </div>

              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-semibold">{t.sourcesQuestion}</legend>
                <p className="-mt-1 text-xs text-[#605E5C]">{t.selectAll}</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  {DATA_SOURCES.map((source) => (
                    <label key={source} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="sources"
                        value={source}
                        checked={sources.includes(source)}
                        onChange={() => toggle(source)}
                        className="h-4 w-4 accent-[#252423]"
                      />
                      {t.sources[source]}
                    </label>
                  ))}
                </div>
                {sources.includes("Other") && (
                  <input name="otherSource" aria-label={t.otherLabel} placeholder={t.otherPlaceholder} className={input} />
                )}
              </fieldset>

              {error && (
                <p role="alert" className="rounded-[2px] bg-[#FDE7E9] px-3 py-2 text-sm text-[#A4262C]">
                  {error}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button type="button" onClick={onClose} className={secondary}>
                  {t.cancel}
                </button>
                <button type="submit" disabled={pending} className={primary}>
                  {pending ? t.sending : t.send}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// A button that opens the dialog; styling comes from the caller.
export default function FreeSampleButton({ className, children }: { className: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open && <FreeSampleDialog onClose={() => setOpen(false)} />}
    </>
  );
}

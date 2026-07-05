/** Primary CTA — white pill on dark background. */
export const primaryButtonClass =
  "press-scale inline-flex items-center justify-center rounded-[10px] bg-white font-semibold text-black shadow-[0_2px_14px_rgba(255,255,255,0.18)] transition-[background,box-shadow,transform] duration-200 ease-out hover:bg-[#e8e8e8] hover:shadow-[0_4px_22px_rgba(255,255,255,0.22)] hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";

export const primaryButtonMdClass = `${primaryButtonClass} px-4 py-2.5 text-sm`;

export const primaryButtonSmClass = `${primaryButtonClass} px-3 py-2 text-[13px]`;

/** Secondary CTA — glass surface with border. */
export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-[9px] border border-border bg-surface font-medium text-subtle transition hover:border-border-strong hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButtonMdClass = `${secondaryButtonClass} px-4 py-2.5 text-sm`;

/** Accent CTA — yellow for map / location actions. */
export const yellowButtonClass =
  "inline-flex items-center justify-center rounded-full bg-[#fffc00] font-extrabold text-stone-900 shadow-[0_2px_0_rgb(0_0_0_0.12)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50";

export const yellowButtonMdClass = `${yellowButtonClass} px-4 py-2.5 text-sm`;

export const yellowButtonSmClass = `${yellowButtonClass} px-5 py-2.5 text-sm`;

/** Input field shell — consistent across forms. */
export const inputFieldClass =
  "w-full rounded-xl border border-border bg-black/35 py-3.5 pl-4 text-sm text-foreground outline-none transition placeholder:text-subtle/70 focus:border-brand-border focus:ring-2 focus:ring-brand-soft";

/** Section label — uppercase micro typography. */
export const sectionLabelClass =
  "text-[10px] font-semibold uppercase tracking-[0.12em] text-muted";

/** Page section spacing */
export const sectionGapClass = "flex flex-col gap-6 sm:gap-7 lg:gap-8";

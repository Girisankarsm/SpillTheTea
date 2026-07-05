import { type ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  /** narrow = feed pages, wide = map/explore, default = standard */
  width?: "narrow" | "default" | "wide";
  className?: string;
};

const widthClass = {
  narrow: "max-w-[640px]",
  default: "max-w-[760px] lg:max-w-[880px]",
  wide: "max-w-[1100px]",
} as const;

export function PageContainer({
  children,
  width = "default",
  className = "",
}: PageContainerProps) {
  return (
    <div
      className={[
        "page-enter mx-auto w-full min-w-0 px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-9",
        widthClass[width],
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="animate-fade-up mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div className="min-w-0">
        <h1 className="font-display text-[1.65rem] font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-[1.85rem]">
          {title}
        </h1>
        {subtitle ? (
          <p className="body-text mt-1.5 max-w-md text-subtle">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </header>
  );
}

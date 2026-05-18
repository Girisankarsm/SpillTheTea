"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PlaceSuggestion } from "@/lib/types/place-search";

type LocationSearchInputProps = {
  id?: string;
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  active?: boolean;
  variant?: "pickup" | "drop";
  selected?: boolean;
  biasLat?: number;
  biasLng?: number;
  onFocus?: () => void;
  onChange: (value: string) => void;
  onSelect: (place: PlaceSuggestion) => void;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
};

function PinDot({ variant }: { variant: "pickup" | "drop" }) {
  return (
    <span
      className={`mt-2.5 h-3 w-3 shrink-0 rounded-full ${
        variant === "pickup" ? "bg-brand ring-4 ring-brand/20" : "bg-orange-500 ring-4 ring-orange-500/20"
      }`}
      aria-hidden
    />
  );
}

export function LocationSearchInput({
  id,
  label,
  value,
  placeholder = "Search for a place…",
  required,
  active,
  variant = "pickup",
  selected,
  biasLat,
  biasLng,
  onFocus,
  onChange,
  onSelect,
}: LocationSearchInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const listId = `${inputId}-suggestions`;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  const [mounted, setMounted] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputWrapRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateMenuPosition = useCallback(() => {
    const el = inputWrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  const searchPlaces = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const url = new URL("/api/places/search", window.location.origin);
        url.searchParams.set("q", trimmed);
        if (biasLat != null && biasLng != null) {
          url.searchParams.set("lat", String(biasLat));
          url.searchParams.set("lon", String(biasLng));
        }

        const res = await fetch(url.toString());
        const json = (await res.json()) as { places?: PlaceSuggestion[] };
        setSuggestions(json.places ?? []);
        setHighlightIndex(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [biasLat, biasLng],
  );

  useEffect(() => {
    if (!open) return;
    updateMenuPosition();

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      void searchPlaces(value);
    }, 220);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [value, open, searchPlaces, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;

    function reposition() {
      updateMenuPosition();
    }

    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (!target.closest?.(`#${listId}`)) {
          setOpen(false);
        }
      }
    }

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [listId]);

  function pickSuggestion(place: PlaceSuggestion) {
    onSelect(place);
    onChange(place.label);
    setOpen(false);
    setSuggestions([]);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && open && highlightIndex >= 0 && suggestions[highlightIndex]) {
      event.preventDefault();
      pickSuggestion(suggestions[highlightIndex]);
      return;
    }

    if (!open || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const showMenu =
    open && !!menuPos && (loading || suggestions.length > 0 || value.trim().length > 0);

  const menu =
    showMenu && mounted ? (
      <ul
        id={listId}
        role="listbox"
        style={{
          position: "fixed",
          top: menuPos.top,
          left: menuPos.left,
          width: menuPos.width,
          zIndex: 10000,
        }}
        className="max-h-60 overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-2xl"
      >
        {loading && suggestions.length === 0 ? (
          <li className="px-3 py-3 text-xs text-subtle">Searching nearby places…</li>
        ) : null}

        {!loading && suggestions.length === 0 && value.trim().length > 0 ? (
          <li className="px-3 py-3 text-xs text-subtle">
            No matches — try a full name like &quot;SRM University&quot; or a road name.
          </li>
        ) : null}

        {suggestions.map((place, index) => (
          <li key={place.id} role="option" aria-selected={highlightIndex === index}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pickSuggestion(place)}
              className={`flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-brand-soft ${
                highlightIndex === index ? "bg-brand-soft" : ""
              }`}
            >
              <span className="mt-0.5 text-base text-subtle" aria-hidden>
                📍
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {place.label}
                </span>
                {place.subtitle ? (
                  <span className="mt-0.5 block truncate text-[11px] leading-snug text-subtle">
                    {place.subtitle}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <div ref={rootRef} className="flex gap-3">
      <PinDot variant={variant} />

      <div className="min-w-0 flex-1 space-y-1">
        <label htmlFor={inputId} className="text-[11px] font-bold uppercase tracking-wide text-subtle">
          {label}
        </label>

        <div ref={inputWrapRef} className="relative">
          <input
            id={inputId}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
              updateMenuPosition();
            }}
            onFocus={() => {
              onFocus?.();
              setOpen(true);
              updateMenuPosition();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            maxLength={200}
            required={required}
            autoComplete="off"
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            className={`w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand ${
              active ? "border-brand ring-1 ring-brand/30" : "border-border"
            } ${selected ? "pr-9" : ""}`}
          />
          {selected ? (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand">
              ✓
            </span>
          ) : null}
          {loading ? (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-subtle">
              …
            </span>
          ) : null}
        </div>
      </div>

      {menu ? createPortal(menu, document.body) : null}
    </div>
  );
}

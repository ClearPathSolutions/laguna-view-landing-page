"use client";

import { useRef, useState } from "react";
import { REVIEWS } from "@/lib/site";
import { GoogleG, Stars } from "./icons";

const TRUNCATE = 180;

function ReviewCard({ author, text }: { author: string; text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > TRUNCATE;
  const shown = expanded || !isLong ? text : text.slice(0, TRUNCATE).trimEnd() + "…";

  return (
    <figure className="card flex w-[85vw] max-w-[380px] shrink-0 snap-start flex-col sm:w-[380px]">
      <div className="mb-3 flex items-center justify-between">
        <Stars count={5} />
        <GoogleG className="h-5 w-5" />
      </div>
      <blockquote className="grow text-[15px] leading-relaxed text-body">
        “{shown}”
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="ml-1 font-semibold text-teal underline-offset-2 hover:underline"
          >
            {expanded ? "Read less" : "Read more"}
          </button>
        )}
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-2 border-t border-ink/5 pt-4">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-teal/10 font-serif font-semibold text-teal">
          {author.charAt(0)}
        </span>
        <span className="font-semibold text-ink">{author}</span>
      </figcaption>
    </figure>
  );
}

export default function Reviews() {
  const railRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: dir * (rail.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <section id="reviews" className="bg-beige py-20 sm:py-24">
      <div className="container-lp">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">{REVIEWS.eyebrow}</p>
            <h2 className="h2 mt-3">{REVIEWS.h2}</h2>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Previous reviews"
              className="grid h-11 w-11 place-items-center rounded-full border border-teal/25 bg-white text-teal transition hover:bg-teal hover:text-white"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Next reviews"
              className="grid h-11 w-11 place-items-center rounded-full border border-teal/25 bg-white text-teal transition hover:bg-teal hover:text-white"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div
        ref={railRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-5 px-5 pb-2 sm:mx-auto sm:max-w-content sm:scroll-px-8 sm:px-8"
      >
        {REVIEWS.items.map((r) => (
          <ReviewCard key={r.author} {...r} />
        ))}
      </div>
    </section>
  );
}

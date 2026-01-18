"use client";

import { useState } from "react";

type DescriptionSectionProps = {
  description: string;
};

const MAX_LENGTH = 200; // 文字数しきい値

export default function DescriptionSection({ description }: DescriptionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isLong = description.length > MAX_LENGTH;
  const displayText = isLong && !isExpanded 
    ? description.substring(0, MAX_LENGTH) + "..."
    : description;

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl border border-zinc-200 shadow-sm">
      <h3 className="font-bold text-lg mb-4 text-zinc-900">About this property</h3>
      <p className="whitespace-pre-line text-zinc-600 leading-relaxed text-sm md:text-base">
        {displayText}
      </p>
      {isLong && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 text-zinc-800 font-semibold text-sm hover:text-black transition-colors underline"
        >
          {isExpanded ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { tools, type Tool } from "../lib/catalog";

export default function SearchTools() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredTools = query.trim()
    ? tools.filter((t) => {
      const q = query.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        t.purpose.toLowerCase().includes(q) ||
        t.keywords.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }).slice(0, 10)
    : [];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!filteredTools.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredTools.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredTools.length) % filteredTools.length);
    } else if (e.key === "Enter") {
      const selected = filteredTools[selectedIndex];
      if (selected) {
        window.location.href = `/tools/${selected.slug}`;
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="search"
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "640px",
        margin: "24px auto 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
        <span style={{ fontSize: "1.2rem", color: "#1463da", marginRight: "8px" }}>⌕</span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Find a tool (e.g. PDF, Calculator, Compressor, Image, QR)..."
          aria-label="Search tools"
          style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "1.05rem" }}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748b",
              fontSize: "1.1rem",
              cursor: "pointer",
              padding: "2px 8px",
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* FLOATING LIVE SEARCH DROPDOWN OVERLAY */}
      {isOpen && query.trim().length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 12px 35px rgba(0, 0, 0, 0.18)",
            border: "1px solid #d7e1ee",
            zIndex: 100,
            maxHeight: "420px",
            overflowY: "auto",
            padding: "8px",
          }}
        >
          {filteredTools.length > 0 ? (
            filteredTools.map((t, idx) => (
              <Link
                key={t.slug}
                href={`/tools/${t.slug}`}
                onClick={() => setIsOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: selectedIndex === idx ? "#edf5ff" : "transparent",
                  color: "#10213a",
                  textDecoration: "none",
                  transition: "background 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "1.1rem", color: "#1463da" }}>⚙</span>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "0.95rem" }}>{t.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{t.purpose}</div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    background: "#e2e8f0",
                    color: "#475569",
                    fontWeight: "600",
                  }}
                >
                  {t.category}
                </span>
              </Link>
            ))
          ) : (
            <div style={{ padding: "16px", textTransform: "none", color: "#64748b", textAlign: "center" }}>
              No tools matching &ldquo;{query}&rdquo; found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

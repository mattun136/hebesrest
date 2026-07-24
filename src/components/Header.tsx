"use client";

import { useState } from "react";
import Link from "next/link";

const navLinks = [
  { href: "/#story", label: "ブランドストーリー" },
  { href: "/#features", label: "特徴" },
  { href: "/#producer", label: "生産者" },
  { href: "/#products", label: "商品一覧" },
  { href: "/#voices", label: "お客様の声" },
  { href: "/#faq", label: "よくある質問" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-brand-line bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a
          href="#top"
          className="font-serif text-lg tracking-[0.2em] text-brand-green-dark"
        >
          HEBEREST
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-foreground/70 transition-colors hover:text-brand-green-dark"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/#products"
            className="hidden rounded-full bg-brand-green-dark px-5 py-2 text-sm text-white transition-colors hover:bg-brand-green sm:inline-block"
          >
            購入する
          </Link>
          <button
            type="button"
            aria-label="メニューを開く"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-line lg:hidden"
          >
            <span className="sr-only">メニュー</span>
            <div className="flex flex-col gap-1.5">
              <span className="block h-px w-4 bg-foreground" />
              <span className="block h-px w-4 bg-foreground" />
            </div>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-brand-line bg-background px-5 py-4 lg:hidden">
          <ul className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-sm text-foreground/80"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                href="/#products"
                onClick={() => setOpen(false)}
                className="mt-1 inline-block rounded-full bg-brand-green-dark px-5 py-2 text-sm text-white"
              >
                購入する
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

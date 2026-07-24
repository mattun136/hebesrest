# Phase A: ブランドメッセージ更新（HEBESU→HEBEREST + キャッチコピー変更） Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** サイト全体のブランド名表記を `HEBESU` から `HEBEREST` に統一し、Heroのキャッチコピーを「へべすの価値を、未来へ。」から「へべすでひとやすみ。」に変更しつつ、既存ミッション文を二層目として残す。

**Architecture:** テキスト・JSXマークアップの差し替えのみ。5ファイル（`Header.tsx` `Hero.tsx` `Footer.tsx` `Producer.tsx` `layout.tsx`）を個別タスクとして順に変更する。新規ファイル・新規依存パッケージ・レイアウト構造の変更なし。

**Tech Stack:** Next.js 16.2.10（App Router）/ React 19.2.4 / TypeScript / Tailwind CSS v4。テストランナー（Jest/Vitest等）は本プロジェクトに未導入。

## Global Constraints

- 対象仕様書: `docs/superpowers/specs/2026-07-13-brand-message-and-order-form-design.md` 3章・6章（フェーズA）
- サイトキャッチコピー: 「へべすでひとやすみ。」／ ブランドミッション: 「へべすの価値を、未来へ。」— 両方を残す二層構造（仕様書3-1）
- ブランド名表記は全箇所 `HEBEREST` に統一する（`HEBESU` を残さない）
- 既存のレイアウト構造・Tailwindデザイントークン（`--brand-green` 等）・画像・外部リンクは変更しない
- 本フェーズに自動テストは存在しない。検証は各タスクでの `npm run build`（型チェック＋コンパイル）と、最終タスクでのブラウザ実機確認（スクリーンショット）で行う（仕様書6章フェーズAタスク5、7章テスト計画に準拠）
- 各タスク完了時に個別コミットする（1タスク=1コミット）

---

### Task 1: Header ロゴを HEBEREST に変更

**Files:**
- Modify: `src/components/Header.tsx:24`

**Interfaces:**
- Consumes: なし
- Produces: なし（表示テキストのみの変更、他タスクからの依存なし）

- [ ] **Step 1: 現在の該当箇所を確認する**

`src/components/Header.tsx` の23〜25行目は以下の通り:

```tsx
        <a
          href="#top"
          className="font-serif text-lg tracking-[0.2em] text-brand-green-dark"
        >
          HEBESU
        </a>
```

- [ ] **Step 2: `HEBESU` を `HEBEREST` に変更する**

24行目を以下に置き換える:

```tsx
          HEBEREST
```

- [ ] **Step 3: ビルドで型エラー・構文エラーがないことを確認する**

Run: `npm run build`
Expected: `✓ Compiled successfully` が表示され、エラーなく完了する

- [ ] **Step 4: コミット**

```bash
git add src/components/Header.tsx
git commit -m "feat: rename header logo from HEBESU to HEBEREST"
```

---

### Task 2: Hero セクションのキャッチコピー変更とブランド名リネーム

**Files:**
- Modify: `src/components/Hero.tsx:29-37`

**Interfaces:**
- Consumes: なし
- Produces: なし

- [ ] **Step 1: 現在の該当箇所を確認する**

`src/components/Hero.tsx` の28〜37行目:

```tsx
      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center sm:px-8">
        <span className="mb-6 text-xs tracking-[0.4em] text-white/90">
          MIYAZAKI HEBESU
        </span>

        <h1 className="font-serif text-4xl font-medium leading-tight tracking-wide text-white drop-shadow-sm sm:text-6xl md:text-7xl">
          へべすの価値を、
          <br />
          未来へ。
        </h1>

        <p className="mt-8 max-w-xl text-base leading-loose text-white/85 sm:text-lg">
```

- [ ] **Step 2: eyebrow・見出し・ミッション添え書きを書き換える**

28〜39行目を以下に置き換える（`MIYAZAKI HEBESU`→`MIYAZAKI HEBEREST`、見出しをキャッチコピーに差し替え、ミッション文を小さく添え書きとして新設）:

```tsx
      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center sm:px-8">
        <span className="mb-6 text-xs tracking-[0.4em] text-white/90">
          MIYAZAKI HEBEREST
        </span>

        <h1 className="font-serif text-4xl font-medium leading-tight tracking-wide text-white drop-shadow-sm sm:text-6xl md:text-7xl">
          へべすでひとやすみ。
        </h1>

        <p className="mt-4 text-xs tracking-[0.3em] text-white/70">
          — へべすの価値を、未来へ。—
        </p>

        <p className="mt-8 max-w-xl text-base leading-loose text-white/85 sm:text-lg">
```

- [ ] **Step 3: ビルドで確認する**

Run: `npm run build`
Expected: エラーなく完了する

- [ ] **Step 4: コミット**

```bash
git add src/components/Hero.tsx
git commit -m "feat: replace hero tagline with 'hebesu de hitoyasumi' and add mission subtext"
```

---

### Task 3: Footer のブランド名・説明文を更新

**Files:**
- Modify: `src/components/Footer.tsx:15-19`
- Modify: `src/components/Footer.tsx:38-40`

**Interfaces:**
- Consumes: なし
- Produces: なし

- [ ] **Step 1: 現在の該当箇所を確認する**

`src/components/Footer.tsx` の14〜21行目:

```tsx
        <div>
          <a href="#top" className="font-serif text-lg tracking-[0.2em] text-white">
            HEBESU
          </a>
          <p className="mt-4 max-w-xs text-sm leading-loose">
            宮崎県産へべすの価値を、生産者とともに未来へつなぐブランドです。
          </p>
        </div>
```

- [ ] **Step 2: ロゴと説明文を二層構造に書き換える**

14〜21行目を以下に置き換える:

```tsx
        <div>
          <a href="#top" className="font-serif text-lg tracking-[0.2em] text-white">
            HEBEREST
          </a>
          <p className="mt-4 max-w-xs text-sm leading-loose">
            へべすでひとやすみ。
          </p>
          <p className="mt-2 max-w-xs text-xs leading-loose text-white/50">
            宮崎県産へべすの価値を、生産者とともに未来へつなぐブランドです。
          </p>
        </div>
```

- [ ] **Step 3: コピーライト表記を確認する**

37〜40行目:

```tsx
          <p className="mt-4 text-white/40">
            &copy; {new Date().getFullYear()} HEBESU. All rights reserved.
          </p>
```

- [ ] **Step 4: コピーライトを HEBEREST に変更する**

39行目を以下に置き換える:

```tsx
            &copy; {new Date().getFullYear()} HEBEREST. All rights reserved.
```

- [ ] **Step 5: ビルドで確認する**

Run: `npm run build`
Expected: エラーなく完了する

- [ ] **Step 6: コミット**

```bash
git add src/components/Footer.tsx
git commit -m "feat: rename footer brand to HEBEREST and add two-layer tagline"
```

---

### Task 4: Producer セクションのブランド名リネーム

**Files:**
- Modify: `src/components/Producer.tsx:46`
- Modify: `src/components/Producer.tsx:59`

**Interfaces:**
- Consumes: なし
- Produces: なし

- [ ] **Step 1: 現在の該当箇所を確認する**

`src/components/Producer.tsx` の45〜47行目、58〜60行目:

```tsx
          <p className="mt-6 max-w-xl text-sm leading-loose text-foreground/60">
            HEBESUがお届けするへべすは、宮崎県で大切に育てられたものです。
          </p>
```

```tsx
          <p className="mt-4 max-w-xl text-sm leading-loose text-foreground/60">
            その想いを大切に、HEBESUは宮崎のへべすの魅力を全国へ届けていきます。
          </p>
```

- [ ] **Step 2: 両箇所を HEBEREST に置き換える**

46行目を以下に置き換える:

```tsx
            HEBERESTがお届けするへべすは、宮崎県で大切に育てられたものです。
```

59行目を以下に置き換える:

```tsx
            その想いを大切に、HEBERESTは宮崎のへべすの魅力を全国へ届けていきます。
```

- [ ] **Step 3: ビルドで確認する**

Run: `npm run build`
Expected: エラーなく完了する

- [ ] **Step 4: コミット**

```bash
git add src/components/Producer.tsx
git commit -m "feat: rename brand references in Producer section to HEBEREST"
```

---

### Task 5: metadata（title / description / OGP / Twitter card）を更新

**Files:**
- Modify: `src/app/layout.tsx:19-48`

**Interfaces:**
- Consumes: なし
- Produces: なし

- [ ] **Step 1: 現在の該当箇所を確認する**

`src/app/layout.tsx` の19〜48行目:

```tsx
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "へべす | 宮崎県産 高級へべすブランド",
    template: "%s | へべす",
  },
  description:
    "宮崎県が誇る香酸柑橘「へべす」。豊かな香りと爽やかな酸味、栄養価の高さを未来へつなぐ生産者直送のブランドサイト。",
  keywords: [
    "へべす",
    "宮崎県",
    "柑橘",
    "香酸柑橘",
    "産地直送",
    "高級フルーツ",
  ],
  openGraph: {
    title: "へべす | 宮崎県産 高級へべすブランド",
    description: "へべすの価値を、未来へ。宮崎県産の香酸柑橘「へべす」をお届けします。",
    url: siteUrl,
    siteName: "へべす",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "へべす | 宮崎県産 高級へべすブランド",
    description: "へべすの価値を、未来へ。",
  },
};
```

- [ ] **Step 2: title・description・OGP・Twitter card を書き換える**

19〜48行目を以下に置き換える:

```tsx
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "HEBEREST（ヘベレスト）| へべすでひとやすみ。宮崎県産 高級へべすブランド",
    template: "%s | HEBEREST",
  },
  description:
    "「へべすでひとやすみ。」宮崎県が誇る香酸柑橘「へべす」。豊かな香りと爽やかな酸味、栄養価の高さを未来へつなぐ生産者直送のブランドサイト。",
  keywords: [
    "へべす",
    "宮崎県",
    "柑橘",
    "香酸柑橘",
    "産地直送",
    "高級フルーツ",
    "HEBEREST",
  ],
  openGraph: {
    title: "HEBEREST（ヘベレスト）| へべすでひとやすみ。",
    description:
      "へべすでひとやすみ。——へべすの価値を、未来へ。宮崎県産の香酸柑橘「へべす」をお届けします。",
    url: siteUrl,
    siteName: "HEBEREST",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HEBEREST（ヘベレスト）| へべすでひとやすみ。",
    description: "へべすでひとやすみ。",
  },
};
```

- [ ] **Step 3: ビルドで確認する**

Run: `npm run build`
Expected: エラーなく完了する

- [ ] **Step 4: コミット**

```bash
git add src/app/layout.tsx
git commit -m "feat: update site metadata, OGP and Twitter card to HEBEREST branding"
```

---

### Task 6: lint・型チェック・ビルドの最終確認とブラウザ実機確認

**Files:**
- なし（検証のみ、変更ファイルなし）

**Interfaces:**
- Consumes: Task 1〜5で変更した全ファイル
- Produces: なし（フェーズAの完了確認）

- [ ] **Step 1: lint を実行する**

Run: `npm run lint`
Expected: エラーなく完了する（warningのみは許容）

- [ ] **Step 2: 本番ビルドを実行する**

Run: `npm run build`
Expected: `✓ Compiled successfully`、`✓ Generating static pages` まで完走する

- [ ] **Step 3: 開発サーバーを起動する**

Run: `npm run dev`
Expected: `http://localhost:3000`（使用中の場合は別ポート）で起動する

- [ ] **Step 4: Playwright を一時導入してスクリーンショットを撮影する**

このプロジェクトにブラウザ確認ツールが常設されていないため、一時的に導入する。

```bash
npm install --no-save playwright
npx playwright install chromium
```

以下のスクリプトを一時ファイル `shot-tmp.js` として作成し実行する:

```js
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.screenshot({ path: "shot-full.png", fullPage: true });
  const hero = await page.$("#top");
  await hero.screenshot({ path: "shot-hero.png" });
  const footer = await page.$("footer");
  await footer.screenshot({ path: "shot-footer.png" });
  const producer = await page.$("#producer");
  await producer.screenshot({ path: "shot-producer.png" });
  await browser.close();
})();
```

Run: `node shot-tmp.js`

- [ ] **Step 5: スクリーンショットを目視確認する**

以下を確認する:
- Header・Hero eyebrow・Footer・コピーライトが `HEBEREST` 表記になっている（`HEBESU` が一切残っていない）
- Hero見出しが「へべすでひとやすみ。」、その下に小さく「— へべすの価値を、未来へ。—」が表示されている
- Producerセクションの本文に `HEBEREST` が反映されている
- レイアウト崩れ・テキストの重なりがない

- [ ] **Step 6: 一時ファイルと Playwright を削除する**

```bash
rm -f shot-tmp.js shot-full.png shot-hero.png shot-footer.png shot-producer.png
npm uninstall --no-save playwright
```

Windows環境の場合は Chromium バイナリも削除する:

```bash
rm -rf "C:/Users/user/AppData/Local/ms-playwright"
```

- [ ] **Step 7: git status で作業ツリーがクリーンであることを確認する**

Run: `git status`
Expected: `nothing to commit, working tree clean`（Task 1〜5のコミットのみが積まれている状態）

---

## 完了後の報告事項

全タスク完了後、以下をユーザーに報告する:
- lint・型チェック・build の結果
- スクリーンショットで確認した内容（HEBEREST表記・新キャッチコピー・レイアウト崩れの有無）
- GitHubへのpushは行わず、結果報告のうえでユーザーの指示を待つ（既存ルール「GitHubへコミット・Pushする前に結果を報告する」に従う）

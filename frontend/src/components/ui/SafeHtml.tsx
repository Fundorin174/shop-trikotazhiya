"use client";

import { useState, useEffect } from "react";

/**
 * Ленивая инициализация DOMPurify — работает только в браузере.
 */
let _purify: { sanitize: (html: string, opts: object) => string } | null = null;

function getPurify() {
  if (typeof window === "undefined") return null;
  if (_purify) return _purify;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("dompurify");
  _purify = mod.default || mod;
  return _purify;
}

/** Удалить HTML-теги (fallback для SSR / plain-text) */
function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

/** Проверить, содержит ли строка HTML-теги */
function hasHtmlTags(html: string): boolean {
  return /<[a-z][\s\S]*>/i.test(html);
}

/**
 * Допустимые HTML-теги для описаний товаров.
 * Разрешены только безопасные теги форматирования — никаких скриптов, форм, iframe.
 */
const ALLOWED_TAGS = [
  // Блочные
  "p", "div", "br", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "blockquote", "pre", "code",
  // Строчные
  "b", "i", "u", "s", "em", "strong", "small", "sub", "sup",
  "span", "a", "mark",
  // Таблицы
  "table", "thead", "tbody", "tr", "th", "td",
  // Медиа (только img)
  "img",
];

const ALLOWED_ATTR = [
  "href", "target", "rel",
  "src", "alt", "width", "height",
  "class", "style",
];

/** Санитизация HTML + добавление rel к ссылкам */
function sanitizeHtml(html: string): string | null {
  if (!hasHtmlTags(html)) return null;

  const purify = getPurify();
  if (!purify) return null;

  const clean = purify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target"],
  });

  if (!clean) return null;

  // Добавляем rel="noopener noreferrer" ко всем <a target="_blank">
  return clean.replace(
    /<a\s([^>]*target="_blank"[^>]*)>/gi,
    (match: string, attrs: string) => {
      if (attrs.includes("rel=")) return match;
      return `<a ${attrs} rel="noopener noreferrer">`;
    },
  );
}

interface SafeHtmlProps {
  html: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Компонент для безопасного рендера HTML-контента.
 * Использует DOMPurify для очистки от XSS-инъекций.
 *
 * SSR отдаёт текст без тегов (DOMPurify недоступен на сервере),
 * после гидрации клиент подставляет полную HTML-разметку.
 *
 * Если контент не содержит HTML-тегов — рендерится как обычный текст.
 */
export function SafeHtml({ html, className, as: Tag = "div" }: SafeHtmlProps) {
  // На SSR и при первом клиентском рендере — null (plain-text fallback).
  // После useEffect DOMPurify обрабатывает HTML → компонент обновляется.
  const [safeHtml, setSafeHtml] = useState<string | null>(null);

  useEffect(() => {
    const result = sanitizeHtml(html);
    setSafeHtml(result);
  }, [html]);

  if (safeHtml) {
    return (
      <Tag
        className={className}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    );
  }

  // SSR / начальный рендер / обычный текст
  return (
    <Tag className={className}>
      {hasHtmlTags(html) ? stripTags(html) : html}
    </Tag>
  );
}

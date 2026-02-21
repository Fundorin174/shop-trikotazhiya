"use client";

import DOMPurify from "dompurify";
import { useMemo } from "react";

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

/**
 * Безопасные CSS-свойства (через style="...").
 * DOMPurify фильтрует опасные свойства вроде expression(), url() и т.д.
 */

interface SafeHtmlProps {
  html: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Компонент для безопасного рендера HTML-контента.
 * Использует DOMPurify для очистки от XSS-инъекций.
 *
 * Если контент не содержит HTML-тегов — рендерится как обычный текст.
 */
export function SafeHtml({ html, className, as: Tag = "div" }: SafeHtmlProps) {
  const sanitized = useMemo(() => {
    // Проверяем, содержит ли текст HTML-теги
    const hasHtml = /<[a-z][\s\S]*>/i.test(html);

    if (!hasHtml) {
      // Обычный текст — возвращаем как есть (React экранирует автоматически)
      return null;
    }

    // Очищаем HTML от опасного содержимого
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
      // Все ссылки открываются в новой вкладке с безопасными атрибутами
      ADD_ATTR: ["target"],
    });
  }, [html]);

  // Для ссылок: добавляем rel="noopener noreferrer" ко всем <a target="_blank">
  const finalHtml = useMemo(() => {
    if (!sanitized) return null;
    return sanitized.replace(
      /<a\s([^>]*target="_blank"[^>]*)>/gi,
      (match, attrs) => {
        if (attrs.includes("rel=")) return match;
        return `<a ${attrs} rel="noopener noreferrer">`;
      }
    );
  }, [sanitized]);

  if (!finalHtml) {
    // Обычный текст без HTML
    return <Tag className={className}>{html}</Tag>;
  }

  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: finalHtml }}
    />
  );
}

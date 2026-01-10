import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { parseMessage, extractCitations } from "../utils/parseMessage";

/**
 * Intelligent ChatMessage renderer with semantic blocks
 * Renders sections, paragraphs, lists, and code with proper typography
 */
export default function ChatMessage({ message, citations, isDark, onCitationClick }) {
  const [copiedCode, setCopiedCode] = useState(null);
  const blocks = parseMessage(message);

  const handleCopyCode = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const renderContent = (text) => {
    // Handle markdown bold, italic, and citations together
    const parts = [];
    let lastIndex = 0;

    // Pattern to match **bold**, *italic*, and [numbers]
    const regex = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[(\d+)\]/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }

      if (match[1]) {
        // **bold** text
        parts.push(
          <strong key={`bold-${match.index}`} className={isDark ? 'text-gray-100 font-bold' : 'text-gray-900 font-bold'}>
            {match[1]}
          </strong>
        );
      } else if (match[2]) {
        // *italic* text
        parts.push(
          <em key={`italic-${match.index}`} className={isDark ? 'text-gray-200 italic' : 'text-gray-800 italic'}>
            {match[2]}
          </em>
        );
      } else if (match[3]) {
        // [citation] number
        const citationNum = parseInt(match[3]);
        const citation = citations?.[citationNum - 1];

        // Only render valid citations that exist in the citations array
        if (citation) {
          parts.push(
            <sup
              key={`citation-${match.index}`}
              onClick={() => onCitationClick(citationNum)}
              className="ml-0.5 font-semibold text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 px-1 py-0.5 rounded cursor-pointer transition-all"
              title={`Click to view source [${citationNum}]`}
            >
              [{citationNum}]
            </sup>
          );
        }
        // Skip rendering invalid citations - don't show them at all
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className={`space-y-4 ${isDark ? "text-gray-100" : "text-gray-900"}`}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "section":
            return (
              <h2
                key={idx}
                className={`section-title font-bold mt-6 mb-3 ${
                  block.level === 1
                    ? "text-2xl"
                    : block.level === 2
                    ? "text-xl"
                    : "text-lg"
                } ${isDark ? "text-gray-50" : "text-gray-900"}`}
              >
                {renderContent(block.content)}
              </h2>
            );

          case "paragraph":
            return (
              <p
                key={idx}
                className={`paragraph leading-relaxed ${
                  isDark ? "text-gray-300" : "text-gray-700"
                } font-normal`}
              >
                {renderContent(block.content)}
              </p>
            );

          case "list":
            return (
              <ul
                key={idx}
                className={`bullet-list ml-5 space-y-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {block.items.map((item, jdx) => (
                  <li
                    key={jdx}
                    className="flex items-start gap-3"
                  >
                    <span className={`text-lg mt-0.5 flex-shrink-0 ${
                      isDark ? "text-blue-400" : "text-blue-600"
                    }`}>
                      •
                    </span>
                    <span className="flex-1">
                      {renderContent(item)}
                    </span>
                  </li>
                ))}
              </ul>
            );

          case "table":
            return (
              <div
                key={idx}
                className={`overflow-x-auto rounded-lg border ${
                  isDark
                    ? "border-gray-700 bg-gray-800"
                    : "border-gray-300 bg-gray-50"
                }`}
              >
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className={isDark ? "bg-gray-700" : "bg-gray-200"}>
                      {block.headers.map((header, hdx) => (
                        <th
                          key={hdx}
                          className={`px-4 py-3 text-left font-semibold border-b ${
                            isDark
                              ? "border-gray-600 text-gray-100"
                              : "border-gray-300 text-gray-900"
                          }`}
                        >
                          {renderContent(header)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, ridx) => (
                      <tr
                        key={ridx}
                        className={ridx % 2 === 0
                          ? (isDark ? "bg-gray-800" : "bg-white")
                          : (isDark ? "bg-gray-750" : "bg-gray-50")
                        }
                      >
                        {row.map((cell, cdx) => (
                          <td
                            key={cdx}
                            className={`px-4 py-3 border-b ${
                              isDark
                                ? "border-gray-700 text-gray-300"
                                : "border-gray-200 text-gray-700"
                            }`}
                          >
                            {renderContent(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "rule":
            return (
              <div
                key={idx}
                className={`my-6 ${isDark ? "border-gray-700" : "border-gray-300"}`}
                style={{ borderTop: `1px solid ${isDark ? "#374151" : "#d1d5db"}` }}
              />
            );

          case "code":
            return (
              <div
                key={idx}
                className={`code-block rounded-lg overflow-hidden border ${
                  isDark
                    ? "bg-gray-900 border-gray-700"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div
                  className={`flex items-center justify-between px-4 py-2 border-b ${
                    isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-100"
                  }`}
                >
                  <span className={`text-xs font-medium ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}>
                    Code
                  </span>
                  <button
                    onClick={() => handleCopyCode(block.content, idx)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                      copiedCode === idx
                        ? isDark
                          ? "bg-green-900 text-green-200"
                          : "bg-green-100 text-green-700"
                        : isDark
                        ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200"
                        : "hover:bg-gray-200 text-gray-600"
                    }`}
                  >
                    {copiedCode === idx ? (
                      <>
                        <Check size={14} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre
                  className={`p-4 overflow-x-auto text-sm font-mono ${
                    isDark ? "text-gray-300" : "text-gray-800"
                  }`}
                >
                  <code>{block.content}</code>
                </pre>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

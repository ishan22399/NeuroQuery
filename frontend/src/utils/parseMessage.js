/**
 * Intelligent message parser for ChatGPT-like rendering
 * Detects: sections, paragraphs, lists, code blocks, tables, rules, citations
 */

/**
 * Check if a line is a section heading (Title Case, short, no period)
 */
export function isSectionHeading(line) {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.length > 80) return false;
  if (trimmed.endsWith(".") || trimmed.endsWith(":")) return false;
  
  // Check if it's Title Case (not all caps, not all lowercase)
  const isAllCaps = trimmed === trimmed.toUpperCase();
  const isAllLower = trimmed === trimmed.toLowerCase();
  
  if (isAllCaps || isAllLower) return false;
  
  // Check first letter is capital
  return trimmed[0] === trimmed[0].toUpperCase();
}

/**
 * Check if line is a bullet point
 */
export function isBulletPoint(line) {
  const trimmed = line.trim();
  return trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ");
}

/**
 * Check if line is a code block marker
 */
export function isCodeBlock(line) {
  return line.trim().startsWith("```");
}

/**
 * Check if line is a horizontal rule
 */
export function isHorizontalRule(line) {
  const trimmed = line.trim();
  return /^(-{3,}|_{3,}|\*{3,})$/.test(trimmed);
}

/**
 * Check if line is a table
 */
export function isTableLine(line) {
  const trimmed = line.trim();
  return trimmed.includes("|");
}

/**
 * Check if line is a table separator
 */
export function isTableSeparator(line) {
  const trimmed = line.trim();
  return /^\|[\s-:|]+\|$/.test(trimmed);
}

/**
 * Check if line is empty/whitespace only
 */
export function isEmptyLine(line) {
  return line.trim().length === 0;
}

/**
 * Parse text with citations - keeps citations inline and small
 */
export function parseCitations(text) {
  return text.replace(/\[(\d+)\]/g, (match, num) => {
    return `[${num}]`; // Keep for later component rendering
  });
}

/**
 * Extract citations from text
 */
export function extractCitations(text) {
  const matches = text.match(/\[(\d+)\]/g) || [];
  return matches.map(m => parseInt(m.match(/\d+/)[0]));
}

/**
 * Parse table from lines
 */
export function parseTable(lines, startIndex) {
  const tableLines = [];
  let currentIndex = startIndex;
  let foundSeparator = false;

  // Collect header
  if (currentIndex < lines.length && isTableLine(lines[currentIndex])) {
    tableLines.push(lines[currentIndex]);
    currentIndex++;
  }

  // Look for separator
  if (currentIndex < lines.length && isTableSeparator(lines[currentIndex])) {
    foundSeparator = true;
    currentIndex++;
  }

  // Collect body rows
  while (currentIndex < lines.length && isTableLine(lines[currentIndex]) && !isTableSeparator(lines[currentIndex])) {
    tableLines.push(lines[currentIndex]);
    currentIndex++;
  }

  if (foundSeparator && tableLines.length >= 2) {
    // Parse table
    const headerRow = tableLines[0].split("|").map(cell => cell.trim()).filter(cell => cell);
    const bodyRows = tableLines.slice(1).map(row => 
      row.split("|").map(cell => cell.trim()).filter(cell => cell)
    );

    return {
      found: true,
      nextIndex: currentIndex,
      table: {
        type: "table",
        headers: headerRow,
        rows: bodyRows
      }
    };
  }

  return { found: false, nextIndex: startIndex };
}

/**
 * Main parser - converts raw text into semantic blocks
 */
export function parseMessage(content) {
  if (!content || typeof content !== "string") return [];

  const lines = content.split("\n");
  const blocks = [];
  let listBuffer = [];
  let codeBuffer = [];
  let inCodeBlock = false;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Handle code blocks
    if (isCodeBlock(line)) {
      if (inCodeBlock) {
        // End of code block
        blocks.push({
          type: "code",
          language: "",
          content: codeBuffer.join("\n")
        });
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        // Flush any pending lists
        if (listBuffer.length > 0) {
          blocks.push({
            type: "list",
            items: [...listBuffer]
          });
          listBuffer = [];
        }
        // Start code block
        inCodeBlock = true;
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      i++;
      continue;
    }

    // Handle horizontal rules
    if (isHorizontalRule(line)) {
      if (listBuffer.length > 0) {
        blocks.push({
          type: "list",
          items: [...listBuffer]
        });
        listBuffer = [];
      }
      blocks.push({
        type: "rule"
      });
      i++;
      continue;
    }

    // Handle tables
    if (isTableLine(line)) {
      if (listBuffer.length > 0) {
        blocks.push({
          type: "list",
          items: [...listBuffer]
        });
        listBuffer = [];
      }

      const tableResult = parseTable(lines, i);
      if (tableResult.found) {
        blocks.push(tableResult.table);
        i = tableResult.nextIndex;
        continue;
      }
    }

    // Handle bullet points
    if (isBulletPoint(line)) {
      const itemText = trimmed.slice(2).trim();
      listBuffer.push(itemText);
      i++;
      continue;
    }

    // If we were collecting bullets and now we're not
    if (listBuffer.length > 0 && !isBulletPoint(line)) {
      if (!isEmptyLine(line)) {
        blocks.push({
          type: "list",
          items: [...listBuffer]
        });
        listBuffer = [];
      }
    }

    // Handle empty lines - add spacing block
    if (isEmptyLine(line)) {
      i++;
      continue;
    }

    // Handle markdown headers (###, ##, #)
    if (trimmed.startsWith("###")) {
      blocks.push({
        type: "section",
        level: 3,
        content: trimmed.slice(3).trim()
      });
      i++;
      continue;
    }

    if (trimmed.startsWith("##")) {
      blocks.push({
        type: "section",
        level: 2,
        content: trimmed.slice(2).trim()
      });
      i++;
      continue;
    }

    if (trimmed.startsWith("#")) {
      blocks.push({
        type: "section",
        level: 1,
        content: trimmed.slice(1).trim()
      });
      i++;
      continue;
    }

    // Handle section headings (smart Title Case detection)
    if (isSectionHeading(trimmed)) {
      blocks.push({
        type: "section",
        level: 2,
        content: trimmed
      });
      i++;
      continue;
    }

    // Handle bold/italic markers from LLM (fallback)
    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      const content = trimmed.slice(2, -2).trim();
      if (content.length < 80) {
        blocks.push({
          type: "section",
          level: 2,
          content: content
        });
        i++;
        continue;
      }
    }

    // Regular paragraph
    if (trimmed.length > 0) {
      blocks.push({
        type: "paragraph",
        content: trimmed
      });
    }

    i++;
  }

  // Flush any remaining list
  if (listBuffer.length > 0) {
    blocks.push({
      type: "list",
      items: listBuffer
    });
  }


  // Flush any remaining code block
  if (codeBuffer.length > 0) {
    blocks.push({
      type: "code",
      language: "",
      content: codeBuffer.join("\n")
    });
  }

  return blocks;
}

/**
 * Parse markdown formatting in text (bold, italic)
 * Returns JSX-ready content with proper elements
 */
export function parseMarkdownFormatting(text) {
  if (!text) return text;

  // Split by markdown patterns while preserving them
  let parts = [];
  let lastIndex = 0;
  
  // Match **bold**, *italic*, and [citations]
  const patterns = [
    { regex: /\*\*([^*]+)\*\*/g, type: 'bold' },
    { regex: /\*([^*]+)\*/g, type: 'italic' },
  ];

  // Process bold and italic
  let result = text;
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\b_([^_]+)_\b/g, '<em>$1</em>');
  
  // But don't process single asterisk if it's part of a word
  result = result.replace(/(?<!\w)\*([^*]+)\*(?!\w)/g, '<em>$1</em>');

  return result;
}

/**
 * Convert text with HTML tags into React elements
 */
export function renderHTMLContent(html) {
  if (!html) return html;

  const parts = [];
  let lastIndex = 0;

  // Find all HTML tags
  const tagRegex = /<(strong|em)>([^<]+)<\/\1>/g;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    // Add text before tag
    if (match.index > lastIndex) {
      parts.push(html.substring(lastIndex, match.index));
    }

    // Add the tag with proper React handling
    if (match[1] === 'strong') {
      parts.push({ type: 'strong', content: match[2] });
    } else if (match[1] === 'em') {
      parts.push({ type: 'em', content: match[2] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < html.length) {
    parts.push(html.substring(lastIndex));
  }

  return parts;
}

const fs = require('fs')

const filePath = process.argv[2] || 'app/challenge/page.tsx'
const startLine = Number(process.argv[3] || 1)

const fullText = fs.readFileSync(filePath, 'utf8')
const fullLines = fullText.split(/\r?\n/)
const text = fullLines.slice(startLine - 1).join('\n')

const voidTags = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

function isIdentStart(ch) {
  return /[A-Za-z]/.test(ch)
}

function isIdent(ch) {
  return /[A-Za-z0-9:_-]/.test(ch)
}

function lineColAt(idx) {
  let line = startLine
  let col = 1
  for (let i = 0; i < idx; i++) {
    const c = text.charCodeAt(i)
    if (c === 10) {
      line++
      col = 1
    } else {
      col++
    }
  }
  return { line, col }
}

const stack = []

let i = 0
let inLineComment = false
let inBlockComment = false
let inString = false
let stringQuote = ''
let escape = false

function pushTag(name, pos) {
  stack.push({ name, pos })
}

function popTag(name, pos) {
  const top = stack[stack.length - 1]
  if (!top || top.name !== name) {
    const lc = lineColAt(pos)
    console.log(`MISMATCH ${lc.line}:${lc.col} closing </${name}> but top is <${top ? top.name : 'none'}>`)
    console.log('STACK_TAIL', stack.slice(-20).map((s) => s.name).join(' > '))
    process.exit(0)
  }
  stack.pop()
}

while (i < text.length) {
  const ch = text[i]
  const next = text[i + 1]

  if (inLineComment) {
    if (ch === '\n') inLineComment = false
    i++
    continue
  }
  if (inBlockComment) {
    if (ch === '*' && next === '/') {
      inBlockComment = false
      i += 2
      continue
    }
    i++
    continue
  }

  if (inString) {
    if (escape) {
      escape = false
      i++
      continue
    }
    if (ch === '\\') {
      escape = true
      i++
      continue
    }
    if (ch === stringQuote) {
      inString = false
      stringQuote = ''
      i++
      continue
    }
    i++
    continue
  }

  // start comments
  if (ch === '/' && next === '/') {
    inLineComment = true
    i += 2
    continue
  }
  if (ch === '/' && next === '*') {
    inBlockComment = true
    i += 2
    continue
  }

  // start strings
  if (ch === '"' || ch === "'" || ch === '`') {
    inString = true
    stringQuote = ch
    i++
    continue
  }

  // JSX tag start
  if (ch === '<') {
    const after = text[i + 1]
    if (after === '/') {
      // closing tag
      let j = i + 2
      while (j < text.length && /\s/.test(text[j])) j++
      let name = ''
      while (j < text.length && isIdent(text[j])) {
        name += text[j]
        j++
      }
      // advance to '>'
      while (j < text.length && text[j] !== '>') j++
      if (name) popTag(name, i)
      i = j + 1
      continue
    }

    // fragment <> (ignore)
    if (after === '>') {
      pushTag('<>', i)
      i += 2
      continue
    }

    if (!isIdentStart(after)) {
      i++
      continue
    }

    // opening or self-closing
    let j = i + 1
    let name = ''
    while (j < text.length && isIdent(text[j])) {
      name += text[j]
      j++
    }

    // scan until end of tag '>' while respecting strings and {...} blocks inside attrs
    let braceDepth = 0
    let q = ''
    let esc = false
    let selfClose = false

    for (; j < text.length; j++) {
      const c = text[j]
      const n = text[j + 1]

      if (q) {
        if (esc) {
          esc = false
          continue
        }
        if (c === '\\') {
          esc = true
          continue
        }
        if (c === q) {
          q = ''
          continue
        }
        continue
      }

      if (c === '"' || c === "'" || c === '`') {
        q = c
        continue
      }

      // ignore comments inside tag attrs (rare, but handle)
      if (c === '/' && n === '/') {
        // skip to line end
        j += 2
        while (j < text.length && text[j] !== '\n') j++
        continue
      }
      if (c === '/' && n === '*') {
        j += 2
        while (j < text.length && !(text[j] === '*' && text[j + 1] === '/')) j++
        j++
        continue
      }

      if (c === '{') {
        braceDepth++
        continue
      }
      if (c === '}') {
        if (braceDepth > 0) braceDepth--
        continue
      }

      if (c === '>' && braceDepth === 0) {
        // check if self-closing: look back for '/'
        let k = j - 1
        while (k > i && /\s/.test(text[k])) k--
        if (text[k] === '/') selfClose = true
        break
      }
    }

    const isHtml = name && name === name.toLowerCase()
    if (name && !selfClose && !(isHtml && voidTags.has(name))) {
      pushTag(name, i)
    }

    i = j + 1
    continue
  }

  if (ch === '<' && next === '/' && text[i + 2] === '>') {
    // fragment closing </>
    popTag('<>', i)
    i += 3
    continue
  }

  i++
}

if (stack.length) {
  console.log('UNCLOSED', stack.length)
  console.log('STACK_TAIL', stack.slice(-20).map((s) => s.name).join(' > '))
  const last = stack[stack.length - 1]
  const lc = lineColAt(last.pos)
  console.log(`LAST_OPENED ${lc.line}:${lc.col} <${last.name}>`)
} else {
  console.log('No mismatches detected')
}

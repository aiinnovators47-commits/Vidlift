const fs = require('fs')

const filePath = process.argv[2] || 'app/challenge/page.tsx'
const startLine = Number(process.argv[3] || 1)

const content = fs.readFileSync(filePath, 'utf8')
const lines = content.split(/\r?\n/)
const slice = lines.slice(startLine - 1).join('\n')

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

const tagRe = /<\s*(\/)?\s*([A-Za-z][\w:-]*)\b([^>]*?)(\/)?\s*>/g

function indexToLineCol(idx) {
  let line = startLine
  let lastNL = -1
  for (let i = 0; i < idx; i++) {
    if (slice.charCodeAt(i) === 10) {
      line++
      lastNL = i
    }
  }
  return { line, col: idx - lastNL }
}

const stack = []
let m
while ((m = tagRe.exec(slice))) {
  const isClose = Boolean(m[1])
  const name = m[2]
  const isHtmlTag = name === name.toLowerCase()
  const isSelf = Boolean(m[4]) || (isHtmlTag && voidTags.has(name))
  const pos = m.index

  if (isClose) {
    const top = stack[stack.length - 1]
    if (!top || top.name !== name) {
      const lc = indexToLineCol(pos)
      console.log(`MISMATCH ${lc.line}:${lc.col} closing </${name}> but top is <${top ? top.name : 'none'}>`)
      console.log('STACK_TAIL', stack.slice(-20).map((s) => s.name).join(' > '))
      process.exit(0)
    }
    stack.pop()
  } else if (!isSelf) {
    stack.push({ name, pos })
  }
}

if (stack.length) {
  console.log('UNCLOSED_TAGS', stack.length)
  console.log('STACK_TAIL', stack.slice(-20).map((s) => s.name).join(' > '))
  const last = stack[stack.length - 1]
  const lc = indexToLineCol(last.pos)
  console.log(`LAST_OPENED ${lc.line}:${lc.col} <${last.name}>`)
} else {
  console.log('No mismatches detected')
}

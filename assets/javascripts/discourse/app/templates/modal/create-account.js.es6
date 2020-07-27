function utf8StrBytes(str) {
  let count = 0
  for (let i = 0, len = str.length; i < len; ++i) {
    count += utf8CharBytes(str.charCodeAt(i))
  }
  return count
}

// FIXME: THIS IS WRONG
function utf8CharBytes(codepoint) {
  if ((codepoint & 0xFFFFFF80) === 0) {
    return 1
  } else if ((codepoint & 0xFFFFF800) === 0) {
    return 2
  } else if ((codepoint & 0xFFFF0000) === 0) {
    return 3
  } else if ((codepoint & 0xFFE00000) === 0) {
    return 4
  }
  return 1 // ???
}

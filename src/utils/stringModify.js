
function toSentenceCase(text) {
  return text.replace(/(^|[.!?]\s+)(\w)/g, (match, separator, char) => {
    return separator + char.toUpperCase();
  });
}


export { toSentenceCase };
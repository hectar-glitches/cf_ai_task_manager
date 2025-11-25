// Test the intent detection logic locally

const testMessages = [
  "give me papers on aphantasia",
  "find papers on quantum computing",
  "show me research about climate change",
  "papers on machine learning",
  "hello",
  "what is aphantasia?",
  "I need articles about neuroscience"
];

// Simulate the regex fallback (what runs when AI isn't available locally)
function detectPapersRequest(message) {
  const wantsPapers = /\b(papers?|articles?|research|studies|publications?|sources?)\b/i.test(message);
  
  // Simple topic extraction
  let topic = message
    .replace(/\b(find|search|get|show|give|look)\s+(me\s+)?(some\s+)?(papers?|articles?|research|studies|publications?|sources?)\s+(on|about|regarding|for)\s+/gi, '')
    .replace(/\b(papers?|articles?|research|studies|publications?|sources?)\s+(on|about|regarding|for)\s+/gi, '')
    .replace(/\b(find|search|get|show|give|look)\s+(me\s+)?(some\s+)?/gi, '')
    .trim();
  
  return { wantsPapers, topic };
}

console.log('Testing paper request detection:\n');
testMessages.forEach(msg => {
  const result = detectPapersRequest(msg);
  console.log(`"${msg}"`);
  console.log(`  → Wants papers: ${result.wantsPapers}`);
  console.log(`  → Topic: "${result.topic}"`);
  console.log();
});

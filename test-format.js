// Test paper formatting
const papers = [
  {
    "paperId": "0033b7f888bc04e49e5aeaa6ab331ef3b5e51c86",
    "title": "Lives without imagery - Congenital aphantasia",
    "authors": [{"name": "A. Zeman"}, {"name": "M. Dewar"}, {"name": "S. Della Sala"}],
    "year": 2015,
    "venue": "Cortex",
    "citationCount": 447,
    "abstract": "We report a detailed investigation..."
  },
  {
    "paperId": "abc123",
    "title": "Aphantasia: A Systematic Review",
    "authors": [{"name": "J. Smith"}, {"name": "K. Johnson"}],
    "year": 2020,
    "venue": "Journal of Cognitive Neuroscience",
    "citationCount": 128,
    "abstract": "A comprehensive review..."
  },
  {
    "paperId": "def456",
    "title": "Visual imagery and aphantasia",
    "authors": [{"name": "L. Brown"}],
    "year": 2018,
    "venue": "Brain and Cognition",
    "citationCount": 89
  }
];

function formatPapersForAI(papers) {
  if (!papers || papers.length === 0) return "No papers found.";
  
  return papers.map((paper) => {
    const authors = paper.authors?.map((a) => a.name).join(', ') || 'Unknown authors';
    const year = paper.year || 'n.d.';
    const title = paper.title || 'Untitled';
    const venue = paper.venue || 'Unknown venue';
    const citations = paper.citationCount || 0;
    const link = `https://www.semanticscholar.org/paper/${paper.paperId}`;
    
    return `${authors} (${year}). ${title}. ${venue}. Citations: ${citations}. Retrieved from ${link}`;
  }).join('\n\n');
}

const formatted = formatPapersForAI(papers);
const message = "find papers on aphantasia";
const fullMessage = `${message}\n\nI found these relevant papers from Semantic Scholar:\n\n${formatted}\n\n`;

console.log("Full message length:", fullMessage.length);
console.log("\nFull message:\n", fullMessage);

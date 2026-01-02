const { diffLines, diffWords, diffChars } = require('diff');

class CodeDiffController {
  compareCode = async (req, res) => {
    try {
      const { 
        originalCode, 
        modifiedCode, 
        language = 'text',
        comparisonType = 'lines' 
      } = req.body;

      if (!originalCode || !modifiedCode) {
        return res.status(400).json({ 
          error: 'Both original and modified code are required' 
        });
      }

      let diffResult;
      
      switch (comparisonType) {
        case 'words':
          diffResult = diffWords(originalCode, modifiedCode);
          break;
        case 'chars':
          diffResult = diffChars(originalCode, modifiedCode);
          break;
        case 'lines':
        default:
          diffResult = diffLines(originalCode, modifiedCode);
          break;
      }

      // Process diff result for frontend display
      const processedDiff = this.processDiffResult(diffResult, comparisonType);
      
      // Calculate statistics
      const stats = this.calculateDiffStats(diffResult);

      res.json({
        success: true,
        diff: processedDiff,
        stats: stats,
        language: language,
        comparisonType: comparisonType
      });
    } catch (error) {
      console.error('Code comparison error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Process diff result into structured format
  processDiffResult(diff, type) {
    let lineNumber = 1;
    const result = {
      added: [],
      removed: [],
      unchanged: []
    };

    diff.forEach(part => {
      const lines = part.value.split('\n');
      
      lines.forEach(line => {
        if (line === '') return; // Skip empty lines

        const lineObj = {
          lineNumber: lineNumber++,
          content: line,
          type: part.added ? 'added' : part.removed ? 'removed' : 'unchanged'
        };

        if (part.added) {
          result.added.push(lineObj);
        } else if (part.removed) {
          result.removed.push(lineObj);
        } else {
          result.unchanged.push(lineObj);
        }
      });
    });

    return result;
  }

  // Calculate diff statistics
  calculateDiffStats(diff) {
    let added = 0;
    let removed = 0;
    let unchanged = 0;

    diff.forEach(part => {
      const lines = part.value.split('\n').filter(line => line !== '');
      
      if (part.added) {
        added += lines.length;
      } else if (part.removed) {
        removed += lines.length;
      } else {
        unchanged += lines.length;
      }
    });

    const total = added + removed + unchanged;
    const changePercentage = total > 0 ? ((added + removed) / total * 100).toFixed(2) : 0;

    return {
      added,
      removed,
      unchanged,
      total,
      changePercentage,
      summary: `${added} added, ${removed} removed, ${unchanged} unchanged (${changePercentage}% changed)`
    };
  }

  // Get supported languages
  getSupportedLanguages = async (req, res) => {
    const languages = [
      { id: 'javascript', name: 'JavaScript' },
      { id: 'typescript', name: 'TypeScript' },
      { id: 'python', name: 'Python' },
      { id: 'java', name: 'Java' },
      { id: 'csharp', name: 'C#' },
      { id: 'php', name: 'PHP' },
      { id: 'html', name: 'HTML' },
      { id: 'css', name: 'CSS' },
      { id: 'json', name: 'JSON' },
      { id: 'xml', name: 'XML' },
      { id: 'sql', name: 'SQL' },
      { id: 'bash', name: 'Bash/Shell' },
      { id: 'markdown', name: 'Markdown' },
      { id: 'yaml', name: 'YAML' },
      { id: 'text', name: 'Plain Text' }
    ];

    res.json({
      success: true,
      languages
    });
  }
}

module.exports = new CodeDiffController();
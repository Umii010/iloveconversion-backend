const xml2js = require('xml2js');
const yaml = require('js-yaml');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const curlconverter = require('curlconverter');
const Logger = require('../services/logger');

class DeveloperController {
  // JSON to XML Converter
  jsonToXml = async (req, res) => {
    try {
      const { json } = req.body;
      
      if (!json) {
        return res.status(400).json({ error: 'JSON input is required' });
      }

      let parsedJson;
      try {
        parsedJson = JSON.parse(json);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid JSON format' });
      }

      const builder = new xml2js.Builder({
        rootName: 'root',
        xmldec: { version: '1.0', encoding: 'UTF-8' },
        renderOpts: { pretty: true, indent: '  ', newline: '\n' }
      });

      const xml = builder.buildObject(parsedJson);
      Logger.logUsage(req, 'json_to_xml', true).catch(() => {});

      res.json({
        success: true,
        xml: xml,
        message: 'JSON converted to XML successfully'
      });
    } catch (error) {
      console.error('JSON to XML error:', error);
          Logger.logUsage(req, 'json_to_xml', false).catch(() => {});
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // XML to JSON Converter
  xmlToJson = async (req, res) => {
    try {
      const { xml } = req.body;
      
      if (!xml) {
        return res.status(400).json({ error: 'XML input is required' });
      }

      const parser = new xml2js.Parser({
        explicitArray: false,
        trim: true,
        normalize: true
      });

      parser.parseString(xml, (error, result) => {
        if (error) {
          return res.status(400).json({ error: 'Invalid XML format' });
        }

        const jsonString = JSON.stringify(result.root || result, null, 2);
        
        res.json({
          success: true,
          json: jsonString,
          message: 'XML converted to JSON successfully'
        });
      });
    } catch (error) {
      console.error('XML to JSON error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // JSON to YAML Converter
  jsonToYaml = async (req, res) => {
    try {
      const { json } = req.body;
      
      if (!json) {
        return res.status(400).json({ error: 'JSON input is required' });
      }

      let parsedJson;
      try {
        parsedJson = JSON.parse(json);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid JSON format' });
      }

      const yamlString = yaml.dump(parsedJson, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        skipInvalid: true
      });

      res.json({
        success: true,
        yaml: yamlString,
        message: 'JSON converted to YAML successfully'
      });
    } catch (error) {
      console.error('JSON to YAML error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // YAML to JSON Converter
  yamlToJson = async (req, res) => {
    try {
      const { yaml: yamlInput } = req.body;
      
      if (!yamlInput) {
        return res.status(400).json({ error: 'YAML input is required' });
      }

      let parsedYaml;
      try {
        parsedYaml = yaml.load(yamlInput, {
          json: true,
          schema: yaml.JSON_SCHEMA
        });
      } catch (error) {
        return res.status(400).json({ error: 'Invalid YAML format' });
      }

      const jsonString = JSON.stringify(parsedYaml, null, 2);

      res.json({
        success: true,
        json: jsonString,
        message: 'YAML converted to JSON successfully'
      });
    } catch (error) {
      console.error('YAML to JSON error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // CSV to JSON Converter
  csvToJson = async (req, res) => {
    try {
      const { csv, delimiter = ',', hasHeaders = true } = req.body;
      
      if (!csv) {
        return res.status(400).json({ error: 'CSV input is required' });
      }

      let records;
      try {
        records = parse(csv, {
          delimiter: delimiter,
          columns: hasHeaders,
          skip_empty_lines: true,
          trim: true
        });
      } catch (error) {
        return res.status(400).json({ error: 'Invalid CSV format' });
      }

      const jsonString = JSON.stringify(records, null, 2);

      res.json({
        success: true,
        json: jsonString,
        message: 'CSV converted to JSON successfully'
      });
    } catch (error) {
      console.error('CSV to JSON error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // JSON to CSV Converter
  jsonToCsv = async (req, res) => {
    try {
      const { json, delimiter = ',' } = req.body;
      
      if (!json) {
        return res.status(400).json({ error: 'JSON input is required' });
      }

      let parsedJson;
      try {
        parsedJson = JSON.parse(json);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid JSON format' });
      }

      const isArray = Array.isArray(parsedJson);
      const data = isArray ? parsedJson : [parsedJson];

      if (data.length === 0) {
        return res.status(400).json({ error: 'JSON array is empty' });
      }

      stringify(data, {
        delimiter: delimiter,
        header: true,
        quoted: true,
        quoted_empty: true
      }, (error, csv) => {
        if (error) {
          return res.status(400).json({ error: 'Error converting to CSV' });
        }

        res.json({
          success: true,
          csv: csv,
          message: 'JSON converted to CSV successfully'
        });
      });
    } catch (error) {
      console.error('JSON to CSV error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // SQL to MongoDB Query Converter
  sqlToMongo = async (req, res) => {
    try {
      const { sql } = req.body;
      
      if (!sql) {
        return res.status(400).json({ error: 'SQL query is required' });
      }

      // Basic SQL to MongoDB conversion logic
      const sqlLower = sql.toLowerCase().trim();
      
      // Extract table name
      const fromMatch = sqlLower.match(/from\s+(\w+)/);
      if (!fromMatch) {
        return res.status(400).json({ error: 'Could not find table name in SQL query' });
      }
      const collectionName = fromMatch[1];

      // Build MongoDB query
      let mongoQuery = `db.${collectionName}.find({`;

      // Extract WHERE conditions
      const whereMatch = sqlLower.match(/where\s+(.+?)(?:\s+(?:order\s+by|limit|$))/i);
      if (whereMatch) {
        const conditions = whereMatch[1]
          .split(/\s+and\s+/i)
          .map(cond => {
            const parts = cond.trim().split(/\s+/);
            if (parts.length < 3) return null;

            const [field, operator, ...valueParts] = parts;
            const value = valueParts.join(' ').replace(/'/g, '"');

            const mongoOperators = {
              '=': '$eq',
              '>': '$gt',
              '<': '$lt',
              '>=': '$gte',
              '<=': '$lte',
              '!=': '$ne',
              '<>': '$ne'
            };

            const mongoOp = mongoOperators[operator.toLowerCase()] || '$eq';
            
            if (mongoOp === '$eq') {
              return `${field}: ${value}`;
            } else {
              return `${field}: { ${mongoOp}: ${value} }`;
            }
          })
          .filter(cond => cond !== null)
          .join(', ');

        if (conditions) {
          mongoQuery += conditions;
        }
      }

      mongoQuery += '})';

      // Add sort
      const orderMatch = sqlLower.match(/order\s+by\s+(\w+)(?:\s+(asc|desc))?/i);
      if (orderMatch) {
        const [, field, direction] = orderMatch;
        const sortOrder = direction && direction.toLowerCase() === 'desc' ? -1 : 1;
        mongoQuery += `.sort({ ${field}: ${sortOrder} })`;
      }

      // Add limit
      const limitMatch = sqlLower.match(/limit\s+(\d+)/i);
      if (limitMatch) {
        mongoQuery += `.limit(${limitMatch[1]})`;
      }

      res.json({
        success: true,
        mongo: mongoQuery,
        message: 'SQL converted to MongoDB query successfully'
      });
    } catch (error) {
      console.error('SQL to MongoDB error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Java to C# Converter
  javaToCSharp = async (req, res) => {
    try {
      const { java } = req.body;
      
      if (!java) {
        return res.status(400).json({ error: 'Java code is required' });
      }

      // Basic Java to C# conversion
      let csharpCode = java
        .replace(/public class/g, 'public class')
        .replace(/private String\b/g, 'private string')
        .replace(/private int\b/g, 'private int')
        .replace(/private boolean\b/g, 'private bool')
        .replace(/private double\b/g, 'private double')
        .replace(/private float\b/g, 'private float')
        .replace(/private char\b/g, 'private char')
        .replace(/public void\b/g, 'public void')
        .replace(/public int\b/g, 'public int')
        .replace(/public String\b/g, 'public string')
        .replace(/public boolean\b/g, 'public bool')
        .replace(/System\.out\.print(ln)?\(/g, 'Console.Write$1(')
        .replace(/\.length\(\)/g, '.Length')
        .replace(/\.equals\(/g, '.Equals(')
        .replace(/\.toString\(\)/g, '.ToString()')
        .replace(/\.toLowerCase\(\)/g, '.ToLower()')
        .replace(/\.toUpperCase\(\)/g, '.ToUpper()')
        .replace(/\.substring\(/g, '.Substring(')
        .replace(/\.indexOf\(/g, '.IndexOf(')
        .replace(/\.charAt\(/g, '[]')
        .replace(/import\s+.*;/g, '')
        .replace(/package\s+.*;/g, '')
        .replace(/\bArrayList\b/g, 'List')
        .replace(/\bHashMap\b/g, 'Dictionary')
        .replace(/\.add\(/g, '.Add(')
        .replace(/\.put\(/g, '.Add(')
        .replace(/\.get\(/g, '.GetValue(')
        .replace(/\btrue\b/g, 'true')
        .replace(/\bfalse\b/g, 'false')
        .replace(/\bnull\b/g, 'null');

      // Add using statements if needed
      if (csharpCode.includes('Console.')) {
        csharpCode = 'using System;\n\n' + csharpCode;
      }
      if (csharpCode.includes('List<') || csharpCode.includes('Dictionary<')) {
        csharpCode = 'using System.Collections.Generic;\n' + csharpCode;
      }

      res.json({
        success: true,
        csharp: csharpCode,
        message: 'Java converted to C# successfully'
      });
    } catch (error) {
      console.error('Java to C# error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Python to JavaScript Converter
  pythonToJs = async (req, res) => {
    try {
      const { python } = req.body;
      
      if (!python) {
        return res.status(400).json({ error: 'Python code is required' });
      }

      // Basic Python to JavaScript conversion
      let jsCode = python
        .replace(/def\s+(\w+)\s*\(([^)]*)\)\s*:/g, 'function $1($2) {')
        .replace(/#.*$/gm, match => `// ${match.substring(1)}`)
        .replace(/"""([\s\S]*?)"""/g, (match, content) => `/*${content}*/`)
        .replace(/'''([\s\S]*?)'''/g, (match, content) => `/*${content}*/`)
        .replace(/\bprint\s*\(/g, 'console.log(')
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/\bNone\b/g, 'null')
        .replace(/\bself\b/g, 'this')
        .replace(/\blen\s*\(/g, '.length')
        .replace(/\.append\(/g, '.push(')
        .replace(/\.pop\(/g, '.pop(')
        .replace(/\.sort\(/g, '.sort(')
        .replace(/\.reverse\(/g, '.reverse(')
        .replace(/\brange\s*\(/g, 'Array.from({length: ')
        .replace(/for\s+(\w+)\s+in\s+range\s*\(([^)]+)\)\s*:/g, 'for (let $1 = 0; $1 < $2; $1++) {')
        .replace(/for\s+(\w+)\s+in\s+(\w+)\s*:/g, 'for (let $1 of $2) {')
        .replace(/\bif\s+(.+?)\s*:/g, 'if ($1) {')
        .replace(/\belif\s+(.+?)\s*:/g, 'else if ($1) {')
        .replace(/\belse\s*:/g, 'else {')
        .replace(/\bwhile\s+(.+?)\s*:/g, 'while ($1) {')
        .replace(/\bdef\s+\w+\s*\(/g, 'function ')
        .replace(/return\s+(.+)/g, 'return $1;')
        .replace(/(\w+)\s*=\s*(.+)/g, (match, variable, value) => {
          if (!match.includes('function') && !match.includes('if') && !match.includes('for') && !match.includes('while')) {
            return `let ${variable} = ${value};`;
          }
          return match;
        });

      // Add closing braces for functions
      const lines = jsCode.split('\n');
      let indentLevel = 0;
      let result = [];
      
      for (let line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.endsWith('{')) {
          result.push('  '.repeat(indentLevel) + line);
          indentLevel++;
        } else if (trimmedLine === '}') {
          indentLevel--;
          result.push('  '.repeat(indentLevel) + '}');
        } else {
          result.push('  '.repeat(indentLevel) + line);
        }
      }

      jsCode = result.join('\n');

      res.json({
        success: true,
        javascript: jsCode,
        message: 'Python converted to JavaScript successfully'
      });
    } catch (error) {
      console.error('Python to JavaScript error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // cURL to Fetch/Axios Converter
  curlToFetch = async (req, res) => {
    try {
      const { curl, target = 'fetch' } = req.body;
      
      if (!curl) {
        return res.status(400).json({ error: 'cURL command is required' });
      }

      let result;
      try {
        if (target === 'fetch') {
          result = curlconverter.toFetch(curl);
        } else if (target === 'axios') {
          result = curlconverter.toNodeRequest(curl);
          // Convert to Axios format
          result = result.replace(/require\('request'\)/g, 'axios')
            .replace(/request\(/g, 'axios(')
            .replace(/, function \(error, response, body\) \{/g, ')')
            .replace(/if \(error\) throw error;/g, '')
            .replace(/console\.log\(body\);/g, '.then(response => console.log(response.data))')
            .replace(/\}\);/g, '.catch(error => console.error(error));');
        } else if (target === 'javascript') {
          result = curlconverter.toJavaScript(curl);
        } else if (target === 'python') {
          result = curlconverter.toPython(curl);
        } else if (target === 'php') {
          result = curlconverter.toPhp(curl);
        }
      } catch (error) {
        return res.status(400).json({ error: 'Invalid cURL command or unsupported format' });
      }

      res.json({
        success: true,
        code: result,
        message: `cURL converted to ${target.toUpperCase()} successfully`
      });
    } catch (error) {
      console.error('cURL conversion error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Format JSON
  formatJson = async (req, res) => {
    try {
      const { json } = req.body;
      
      if (!json) {
        return res.status(400).json({ error: 'JSON input is required' });
      }

      let parsedJson;
      try {
        parsedJson = JSON.parse(json);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid JSON format' });
      }

      const formattedJson = JSON.stringify(parsedJson, null, 2);

      res.json({
        success: true,
        formatted: formattedJson,
        message: 'JSON formatted successfully'
      });
    } catch (error) {
      console.error('JSON formatting error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Minify JSON
  minifyJson = async (req, res) => {
    try {
      const { json } = req.body;
      
      if (!json) {
        return res.status(400).json({ error: 'JSON input is required' });
      }

      let parsedJson;
      try {
        parsedJson = JSON.parse(json);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid JSON format' });
      }

      const minifiedJson = JSON.stringify(parsedJson);

      res.json({
        success: true,
        minified: minifiedJson,
        message: 'JSON minified successfully'
      });
    } catch (error) {
      console.error('JSON minify error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Validate JSON
  validateJson = async (req, res) => {
    try {
      const { json } = req.body;
      
      if (!json) {
        return res.status(400).json({ error: 'JSON input is required' });
      }

      try {
        JSON.parse(json);
        res.json({
          success: true,
          valid: true,
          message: 'JSON is valid'
        });
      } catch (error) {
        res.json({
          success: false,
          valid: false,
          message: error.message,
          position: error.position
        });
      }
    } catch (error) {
      console.error('JSON validation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

module.exports = new DeveloperController();
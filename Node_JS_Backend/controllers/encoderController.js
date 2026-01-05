const Logger = require('../services/logger');

class EncoderController {
  
  // URL Encode
  urlEncode = async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Text input is required' });
      }

      const encoded = encodeURIComponent(text);
      
      Logger.logUsage(req, 'url_encode', true).catch(() => {});

      res.json({
        success: true,
        original: text,
        encoded: encoded,
        message: 'URL encoded successfully'
      });

    } catch (error) {
      console.error('URL encode error:', error);
      Logger.logUsage(req, 'url_encode', false).catch(() => {});
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // URL Decode
  urlDecode = async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Encoded text is required' });
      }

      let decoded;
      try {
        decoded = decodeURIComponent(text);
      } catch (decodeError) {
        return res.status(400).json({ error: 'Invalid URL encoded string' });
      }

      Logger.logUsage(req, 'url_decode', true).catch(() => {});

      res.json({
        success: true,
        encoded: text,
        decoded: decoded,
        message: 'URL decoded successfully'
      });

    } catch (error) {
      console.error('URL decode error:', error);
      Logger.logUsage(req, 'url_decode', false).catch(() => {});
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Base64 Encode
  base64Encode = async (req, res) => {
    try {
      const { text, isBinary = false } = req.body;

      if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Text input is required' });
      }

      let encoded;
      if (isBinary) {
        const buffer = Buffer.from(text, 'binary');
        encoded = buffer.toString('base64');
      } else {
        encoded = Buffer.from(text, 'utf8').toString('base64');
      }

      Logger.logUsage(req, 'base64_encode', true).catch(() => {});

      res.json({
        success: true,
        original: text,
        encoded: encoded,
        isBinary: isBinary,
        message: 'Base64 encoded successfully'
      });

    } catch (error) {
      console.error('Base64 encode error:', error);
      Logger.logUsage(req, 'base64_encode', false).catch(() => {});
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Base64 Decode
  base64Decode = async (req, res) => {
    try {
      const { text, outputFormat = 'utf8' } = req.body;

      if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Base64 text is required' });
      }

      // Validate Base64 format
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(text)) {
        return res.status(400).json({ error: 'Invalid Base64 format' });
      }

      let decoded;
      try {
        const buffer = Buffer.from(text, 'base64');
        
        if (outputFormat === 'binary') {
          decoded = buffer.toString('binary');
        } else if (outputFormat === 'hex') {
          decoded = buffer.toString('hex');
        } else if (outputFormat === 'ascii') {
          decoded = buffer.toString('ascii');
        } else {
          decoded = buffer.toString('utf8');
        }
      } catch (decodeError) {
        return res.status(400).json({ error: 'Invalid Base64 data' });
      }

      Logger.logUsage(req, 'base64_decode', true).catch(() => {});

      res.json({
        success: true,
        encoded: text,
        decoded: decoded,
        outputFormat: outputFormat,
        message: 'Base64 decoded successfully'
      });

    } catch (error) {
      console.error('Base64 decode error:', error);
      Logger.logUsage(req, 'base64_decode', false).catch(() => {});
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // ASCII to Text
  asciiToText = async (req, res) => {
    try {
      const { ascii, format = 'decimal', delimiter = ' ' } = req.body;

      if (!ascii || ascii.trim() === '') {
        return res.status(400).json({ error: 'ASCII input is required' });
      }

      let text = '';
      let asciiArray = [];

      try {
        switch (format.toLowerCase()) {
          case 'decimal':
            asciiArray = ascii.split(delimiter).map(num => {
              const code = parseInt(num.trim(), 10);
              if (isNaN(code) || code < 0 || code > 255) {
                throw new Error(`Invalid ASCII code: ${num}`);
              }
              return code;
            });
            text = String.fromCharCode(...asciiArray);
            break;

          case 'hex':
            asciiArray = ascii.split(delimiter).map(hex => {
              const code = parseInt(hex.trim(), 16);
              if (isNaN(code) || code < 0 || code > 255) {
                throw new Error(`Invalid hex ASCII code: ${hex}`);
              }
              return code;
            });
            text = String.fromCharCode(...asciiArray);
            break;

          case 'binary':
            asciiArray = ascii.split(delimiter).map(bin => {
              const code = parseInt(bin.trim(), 2);
              if (isNaN(code) || code < 0 || code > 255) {
                throw new Error(`Invalid binary ASCII code: ${bin}`);
              }
              return code;
            });
            text = String.fromCharCode(...asciiArray);
            break;

          default:
            return res.status(400).json({ error: 'Invalid format. Use decimal, hex, or binary' });
        }
      } catch (parseError) {
        return res.status(400).json({ error: parseError.message });
      }

      Logger.logUsage(req, 'ascii_to_text', true).catch(() => {});

      res.json({
        success: true,
        ascii: ascii,
        text: text,
        format: format,
        delimiter: delimiter,
        asciiArray: asciiArray,
        message: 'ASCII converted to text successfully'
      });

    } catch (error) {
      console.error('ASCII to text error:', error);
      Logger.logUsage(req, 'ascii_to_text', false).catch(() => {});
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Text to ASCII
  textToAscii = async (req, res) => {
    try {
      const { text, format = 'decimal', delimiter = ' ' } = req.body;

      if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Text input is required' });
      }

      let asciiString = '';
      const asciiArray = [];

      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        asciiArray.push(charCode);

        switch (format.toLowerCase()) {
          case 'decimal':
            asciiString += charCode;
            break;
          case 'hex':
            asciiString += charCode.toString(16).padStart(2, '0');
            break;
          case 'binary':
            asciiString += charCode.toString(2).padStart(8, '0');
            break;
          default:
            return res.status(400).json({ error: 'Invalid format. Use decimal, hex, or binary' });
        }

        if (i < text.length - 1) {
          asciiString += delimiter;
        }
      }

      Logger.logUsage(req, 'text_to_ascii', true).catch(() => {});

      res.json({
        success: true,
        text: text,
        ascii: asciiString,
        format: format,
        delimiter: delimiter,
        asciiArray: asciiArray,
        message: 'Text converted to ASCII successfully'
      });

    } catch (error) {
      console.error('Text to ASCII error:', error);
      Logger.logUsage(req, 'text_to_ascii', false).catch(() => {});
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // HTML Encode
  htmlEncode = async (req, res) => {
    try {
      const { text, encodeAll = false } = req.body;

      if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Text input is required' });
      }

      let encoded = text;
      
      if (encodeAll) {
        // Encode all characters to HTML entities
        encoded = text.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
          return '&#' + i.charCodeAt(0) + ';';
        });
      } else {
        // Encode only special HTML characters
        const htmlEntities = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
          '/': '&#47;',
          '`': '&#96;',
          '=': '&#61;'
        };
        
        encoded = text.replace(/[&<>"'`=\/]/g, function(match) {
          return htmlEntities[match];
        });
      }

      Logger.logUsage(req, 'html_encode', true).catch(() => {});

      res.json({
        success: true,
        original: text,
        encoded: encoded,
        encodeAll: encodeAll,
        message: 'HTML encoded successfully'
      });

    } catch (error) {
      console.error('HTML encode error:', error);
      Logger.logUsage(req, 'html_encode', false).catch(() => {});
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // HTML Decode
  htmlDecode = async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'HTML encoded text is required' });
      }

      // Common HTML entities
      const htmlEntities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&#x27;': "'",
        '&#x2F;': '/',
        '&#96;': '`',
        '&#61;': '=',
        '&nbsp;': ' ',
        '&copy;': '©',
        '&reg;': '®',
        '&trade;': '™',
        '&euro;': '€',
        '&pound;': '£',
        '&yen;': '¥',
        '&cent;': '¢'
      };

      // First decode named entities
      let decoded = text.replace(/&[a-z]+;/gi, function(match) {
        return htmlEntities[match.toLowerCase()] || match;
      });

      // Then decode numeric entities (&#123; and &#x1F600;)
      decoded = decoded.replace(/&#(\d+);?/g, function(match, num) {
        return String.fromCharCode(parseInt(num, 10));
      });

      decoded = decoded.replace(/&#x([0-9a-f]+);?/gi, function(match, hex) {
        return String.fromCharCode(parseInt(hex, 16));
      });

      Logger.logUsage(req, 'html_decode', true).catch(() => {});

      res.json({
        success: true,
        encoded: text,
        decoded: decoded,
        message: 'HTML decoded successfully'
      });

    } catch (error) {
      console.error('HTML decode error:', error);
      Logger.logUsage(req, 'html_decode', false).catch(() => {});
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Additional encoding/decoding methods

  // Hex Encode
  hexEncode = async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Text input is required' });
      }

      const encoded = Buffer.from(text, 'utf8').toString('hex');

      res.json({
        success: true,
        original: text,
        encoded: encoded,
        message: 'Hex encoded successfully'
      });

    } catch (error) {
      console.error('Hex encode error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Hex Decode
  hexDecode = async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Hex string is required' });
      }

      // Validate hex format
      const hexRegex = /^[0-9a-fA-F]+$/;
      if (!hexRegex.test(text)) {
        return res.status(400).json({ error: 'Invalid hex format' });
      }

      let decoded;
      try {
        decoded = Buffer.from(text, 'hex').toString('utf8');
      } catch (decodeError) {
        return res.status(400).json({ error: 'Invalid hex data' });
      }

      res.json({
        success: true,
        encoded: text,
        decoded: decoded,
        message: 'Hex decoded successfully'
      });

    } catch (error) {
      console.error('Hex decode error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Binary Encode
  binaryEncode = async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Text input is required' });
      }

      let encoded = '';
      for (let i = 0; i < text.length; i++) {
        encoded += text.charCodeAt(i).toString(2).padStart(8, '0') + ' ';
      }
      encoded = encoded.trim();

      res.json({
        success: true,
        original: text,
        encoded: encoded,
        message: 'Binary encoded successfully'
      });

    } catch (error) {
      console.error('Binary encode error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Binary Decode
  binaryDecode = async (req, res) => {
    try {
      const { text, delimiter = ' ' } = req.body;

      if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Binary string is required' });
      }

      const binaryArray = text.split(delimiter);
      let decoded = '';

      try {
        for (const binary of binaryArray) {
          if (!/^[01]+$/.test(binary)) {
            throw new Error(`Invalid binary string: ${binary}`);
          }
          const charCode = parseInt(binary, 2);
          if (charCode > 255) {
            throw new Error(`Binary value too large: ${binary}`);
          }
          decoded += String.fromCharCode(charCode);
        }
      } catch (parseError) {
        return res.status(400).json({ error: parseError.message });
      }

      res.json({
        success: true,
        encoded: text,
        decoded: decoded,
        message: 'Binary decoded successfully'
      });

    } catch (error) {
      console.error('Binary decode error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // UTF-8 Encode/Decode
  utf8Encode = async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Text input is required' });
      }

      const encoded = Buffer.from(text, 'utf8').toString('hex');
      const bytes = [];
      for (let i = 0; i < text.length; i++) {
        bytes.push(text.charCodeAt(i).toString(16).padStart(2, '0'));
      }

      res.json({
        success: true,
        original: text,
        encoded: encoded,
        bytes: bytes,
        message: 'UTF-8 encoded successfully'
      });

    } catch (error) {
      console.error('UTF-8 encode error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Validate Encoding
  validateEncoding = async (req, res) => {
    try {
      const { text, encoding = 'utf8' } = req.body;

      if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Text input is required' });
      }

      let isValid = true;
      let errorMessage = '';

      try {
        // Try to encode/decode to validate
        const buffer = Buffer.from(text, encoding);
        const decoded = buffer.toString(encoding);
        
        // Check if round-trip preserves the data
        const reencoded = Buffer.from(decoded, encoding);
        isValid = buffer.equals(reencoded);
        
        if (!isValid) {
          errorMessage = 'Encoding round-trip failed';
        }
      } catch (error) {
        isValid = false;
        errorMessage = error.message;
      }

      res.json({
        success: true,
        text: text,
        encoding: encoding,
        valid: isValid,
        error: errorMessage,
        message: isValid ? 'Encoding is valid' : 'Invalid encoding'
      });

    } catch (error) {
      console.error('Validate encoding error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Batch Encode/Decode
  batchProcess = async (req, res) => {
    try {
      const { items, operation = 'encode', type = 'base64' } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items array is required' });
      }

      if (items.length > 100) {
        return res.status(400).json({ error: 'Maximum 100 items allowed per batch' });
      }

      const results = [];

      for (const item of items) {
        try {
          let result;
          let success = true;
          let error = '';

          switch (type) {
            case 'base64':
              if (operation === 'encode') {
                result = Buffer.from(item, 'utf8').toString('base64');
              } else {
                result = Buffer.from(item, 'base64').toString('utf8');
              }
              break;

            case 'url':
              if (operation === 'encode') {
                result = encodeURIComponent(item);
              } else {
                result = decodeURIComponent(item);
              }
              break;

            case 'html':
              if (operation === 'encode') {
                const htmlEntities = {
                  '&': '&amp;',
                  '<': '&lt;',
                  '>': '&gt;',
                  '"': '&quot;',
                  "'": '&#39;'
                };
                result = item.replace(/[&<>"']/g, function(match) {
                  return htmlEntities[match];
                });
              } else {
                const htmlEntities = {
                  '&amp;': '&',
                  '&lt;': '<',
                  '&gt;': '>',
                  '&quot;': '"',
                  '&#39;': "'"
                };
                result = item.replace(/&[a-z]+;/gi, function(match) {
                  return htmlEntities[match] || match;
                });
              }
              break;

            default:
              success = false;
              error = `Unsupported type: ${type}`;
          }

          results.push({
            original: item,
            result: result,
            success: success,
            error: error
          });

        } catch (itemError) {
          results.push({
            original: item,
            success: false,
            error: itemError.message
          });
        }
      }

      res.json({
        success: true,
        count: results.length,
        items: results,
        message: `Processed ${results.length} items`
      });

    } catch (error) {
      console.error('Batch process error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

module.exports = new EncoderController();
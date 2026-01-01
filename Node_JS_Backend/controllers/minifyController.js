// controllers/minifyController.js - SIMPLER VERSION
const UglifyJS = require("uglify-js");
const CleanCSS = require("clean-css");
const prettier = require("prettier");

exports.processCode = async (req, res) => {
  try {
    const { code, language, action, options } = req.body;

    if (!code || !language) {
      return res.status(400).json({ 
        error: "Code and language are required" 
      });
    }

    console.log(`Processing ${language} code - Action: ${action}`);

    let processedCode;
    
    if (language === "css") {
      processedCode = await processCSS(code, action, options);
    } else if (language === "js") {
      processedCode = await processJavaScript(code, action, options);
    } else {
      return res.status(400).json({ 
        error: "Unsupported language. Use 'css' or 'js'" 
      });
    }

    const originalSize = code.length;
    const processedSize = processedCode.length;
    const reduction = originalSize > 0 
      ? ((originalSize - processedSize) / originalSize * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      processedCode,
      originalSize,
      processedSize,
      reduction,
      language,
      action
    });

  } catch (error) {
    console.error("Processing error:", error);
    res.status(500).json({ 
      error: "Failed to process code",
      message: error.message
    });
  }
};

async function processCSS(code, action, options) {
  try {
    if (action === "minify") {
      // Minify CSS
      const minifyOptions = {
        level: 2,
        ...options
      };

      const minified = new CleanCSS(minifyOptions).minify(code);
      
      if (minified.errors && minified.errors.length > 0) {
        console.warn("CSS minification warnings:", minified.errors);
      }

      return minified.styles || code;
    } else if (action === "unminify") {
      // Beautify CSS using Prettier
      try {
        return await prettier.format(code, {
          parser: "css",
          tabWidth: 2,
          useTabs: false
        });
      } catch (prettierError) {
        console.warn("Prettier failed, using simple formatting");
        return simpleCSSFormat(code);
      }
    }
    return code;
  } catch (error) {
    console.error("CSS processing error:", error);
    return code;
  }
}

async function processJavaScript(code, action, options) {
  try {
    if (action === "minify") {
      // Minify JavaScript
      const minifyOptions = {
        compress: {
          sequences: true,
          dead_code: true,
          conditionals: true,
          booleans: true,
          unused: true,
          if_return: true,
          join_vars: true
        },
        mangle: false,
        output: {
          beautify: false,
          comments: options?.removeComments ? false : /@license|@preserve|^!/
        }
      };

      const result = UglifyJS.minify(code, minifyOptions);

      if (result.error) {
        console.error("JS minification error:", result.error);
        // Fallback to simple minification
        const simpleResult = UglifyJS.minify(code, {
          output: { 
            beautify: false,
            comments: options?.removeComments ? false : true
          }
        });
        if (simpleResult.error) {
          return code; // Return original if minification fails
        }
        return simpleResult.code;
      }

      return result.code;
    } else if (action === "unminify") {
      // Beautify JavaScript using Prettier
      try {
        return await prettier.format(code, {
          parser: "babel",
          tabWidth: 2,
          useTabs: false,
          semi: true,
          singleQuote: false
        });
      } catch (prettierError) {
        console.warn("Prettier failed, using simple formatting");
        return simpleJSFormat(code);
      }
    }
    return code;
  } catch (error) {
    console.error("JS processing error:", error);
    return code;
  }
}

function simpleCSSFormat(code) {
  try {
    let formatted = "";
    let depth = 0;
    
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      
      if (char === "{") {
        formatted += " {\n";
        depth++;
        formatted += "  ".repeat(depth);
      } else if (char === "}") {
        formatted = formatted.trimEnd();
        formatted += "\n";
        depth--;
        depth = Math.max(0, depth);
        formatted += "  ".repeat(depth);
        formatted += "}\n";
        if (depth > 0) formatted += "  ".repeat(depth);
      } else if (char === ";") {
        formatted += ";\n";
        if (depth > 0) formatted += "  ".repeat(depth);
      } else {
        formatted += char;
      }
    }
    
    return formatted.trim();
  } catch (error) {
    return code;
  }
}

function simpleJSFormat(code) {
  try {
    let formatted = "";
    let depth = 0;
    
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      
      if (char === "{" || char === "[") {
        formatted += char + "\n";
        depth++;
        formatted += "  ".repeat(depth);
      } else if (char === "}" || char === "]") {
        formatted = formatted.trimEnd();
        formatted += "\n";
        depth--;
        depth = Math.max(0, depth);
        formatted += "  ".repeat(depth);
        formatted += char + "\n";
        if (depth > 0) formatted += "  ".repeat(depth);
      } else if (char === ";") {
        formatted += ";\n";
        if (depth > 0) formatted += "  ".repeat(depth);
      } else {
        formatted += char;
      }
    }
    
    return formatted.split("\n").map(line => line.trimEnd()).join("\n").trim();
  } catch (error) {
    return code;
  }
}
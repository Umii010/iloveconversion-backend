<template>
  <div class="encoding-tools-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">
            <svg class="title-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM6.5 9L10 5.5 13.5 9H11v4H9V9H6.5zm11 6L14 18.5 10.5 15H13v-4h2v4h2.5z"/>
            </svg>
            Encoding & Decoding Tools
          </h1>
          <p class="page-subtitle">
            Convert between different encodings: URL, Base64, HTML, ASCII, Hex, Binary and more
          </p>
        </div>
        <div class="header-actions">
          <button class="action-button" @click="toggleTheme">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Tool Categories -->
      <div class="tool-categories">
        <button 
          v-for="category in categories" 
          :key="category.id"
          class="category-tab"
          :class="{ active: activeCategory === category.id }"
          @click="activeCategory = category.id"
        >
          <svg class="category-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path :d="category.icon"/>
          </svg>
          <span class="category-label">{{ category.label }}</span>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="page-content">
      <!-- URL Encoding/Decoding -->
      <div v-if="activeCategory === 'url'" class="tools-section">
        <div class="section-header">
          <h2 class="section-title">
            <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
            </svg>
            URL Encoding & Decoding
          </h2>
          <p class="section-description">
            Encode and decode URL components for safe transmission over the internet
          </p>
        </div>

        <div class="encoder-card">
          <div class="encoder-body">
            <div class="encoder-columns">
              <!-- Input Section -->
              <div class="input-section">
                <div class="input-header">
                  <h3 class="input-title">Input</h3>
                  <div class="input-actions">
                    <button class="input-action" @click="clearField('urlInput')">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                      Clear
                    </button>
                    <button class="input-action" @click="loadSample('url')">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                      </svg>
                      Sample
                    </button>
                  </div>
                </div>
                <div class="input-group">
                  <label class="input-label">Text to Encode/Decode</label>
                  <textarea 
                    v-model="urlInput.text"
                    class="code-editor"
                    placeholder="Enter text to encode or URL encoded string to decode"
                    rows="6"
                    spellcheck="false"
                  ></textarea>
                  <div class="input-info">
                    <span class="char-count">{{ urlInput.text.length }} characters</span>
                    <span class="char-count">{{ countSpaces(urlInput.text) }} spaces</span>
                  </div>
                </div>

                <div class="action-buttons">
                  <button class="encode-button" @click="urlEncode" :disabled="loading.urlEncode">
                    <span v-if="loading.urlEncode" class="loading-spinner"></span>
                    <span>{{ loading.urlEncode ? 'Encoding...' : 'URL Encode' }}</span>
                  </button>
                  <button class="decode-button" @click="urlDecode" :disabled="loading.urlDecode">
                    <span v-if="loading.urlDecode" class="loading-spinner"></span>
                    <span>{{ loading.urlDecode ? 'Decoding...' : 'URL Decode' }}</span>
                  </button>
                </div>

                <div v-if="error.url" class="error-message">
                  {{ error.url }}
                </div>
              </div>

              <!-- Output Section -->
              <div class="output-section">
                <div class="output-header">
                  <h3 class="output-title">Output</h3>
                  <div class="output-actions" v-if="urlOutput.result">
                    <button class="output-action" @click="copyToClipboard(urlOutput.result)">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                      Copy
                    </button>
                    <button class="output-action" @click="clearOutput('url')">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                      Clear
                    </button>
                  </div>
                </div>
                <div class="output-group">
                  <div class="output-content">
                    <pre class="output-text">{{ urlOutput.result || 'Your encoded/decoded result will appear here' }}</pre>
                  </div>
                  <div class="output-info">
                    <div class="info-row">
                      <span class="info-label">Operation:</span>
                      <span class="info-value">{{ urlOutput.operation || '--' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Result Length:</span>
                      <span class="info-value">{{ urlOutput.result?.length || 0 }} characters</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Encoding Change:</span>
                      <span class="info-value">{{ calculateEncodingChange(urlInput.text, urlOutput.result) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- URL Encoding Examples -->
            <div class="examples-section">
              <h3 class="examples-title">URL Encoding Examples</h3>
              <div class="examples-grid">
                <div class="example-item">
                  <div class="example-input">Hello World!</div>
                  <div class="example-arrow">→</div>
                  <div class="example-output">Hello%20World%21</div>
                </div>
                <div class="example-item">
                  <div class="example-input">email@example.com</div>
                  <div class="example-arrow">→</div>
                  <div class="example-output">email%40example.com</div>
                </div>
                <div class="example-item">
                  <div class="example-input">price=$100&discount=10%</div>
                  <div class="example-arrow">→</div>
                  <div class="example-output">price%3D%24100%26discount%3D10%25</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Base64 Encoding/Decoding -->
      <div v-if="activeCategory === 'base64'" class="tools-section">
        <div class="section-header">
          <h2 class="section-title">
            <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
            </svg>
            Base64 Encoding & Decoding
          </h2>
          <p class="section-description">
            Encode binary data to ASCII string format and decode Base64 strings back to original data
          </p>
        </div>

        <div class="encoder-card">
          <div class="encoder-body">
            <div class="encoder-columns">
              <!-- Input Section -->
              <div class="input-section">
                <div class="input-header">
                  <h3 class="input-title">Input</h3>
                  <div class="input-actions">
                    <button class="input-action" @click="clearField('base64Input')">
                      Clear
                    </button>
                    <button class="input-action" @click="loadSample('base64')">
                      Sample
                    </button>
                  </div>
                </div>
                <div class="input-group">
                  <label class="input-label">Text or Base64 String</label>
                  <textarea 
                    v-model="base64Input.text"
                    class="code-editor"
                    placeholder="Enter text to encode or Base64 string to decode"
                    rows="6"
                    spellcheck="false"
                  ></textarea>
                  <div class="input-info">
                    <span class="char-count">{{ base64Input.text.length }} characters</span>
                    <span class="char-count" v-if="isBase64(base64Input.text)">
                      ✓ Valid Base64
                    </span>
                  </div>
                </div>

                <!-- Base64 Options -->
                <div class="options-section">
                  <div class="option-group">
                    <label class="option-label">Encode Options</label>
                    <div class="option-checkboxes">
                      <label class="checkbox">
                        <input type="checkbox" v-model="base64Input.isBinary">
                        <span class="checkmark"></span>
                        Treat as binary data
                      </label>
                    </div>
                  </div>

                  <div class="option-group">
                    <label class="option-label">Decode Output Format</label>
                    <select v-model="base64Input.outputFormat" class="option-select">
                      <option value="utf8">UTF-8 Text</option>
                      <option value="ascii">ASCII</option>
                      <option value="hex">Hexadecimal</option>
                      <option value="binary">Binary</option>
                    </select>
                  </div>
                </div>

                <div class="action-buttons">
                  <button class="encode-button" @click="base64Encode" :disabled="loading.base64Encode">
                    <span v-if="loading.base64Encode" class="loading-spinner"></span>
                    <span>{{ loading.base64Encode ? 'Encoding...' : 'Base64 Encode' }}</span>
                  </button>
                  <button class="decode-button" @click="base64Decode" :disabled="loading.base64Decode">
                    <span v-if="loading.base64Decode" class="loading-spinner"></span>
                    <span>{{ loading.base64Decode ? 'Decoding...' : 'Base64 Decode' }}</span>
                  </button>
                </div>

                <div v-if="error.base64" class="error-message">
                  {{ error.base64 }}
                </div>
              </div>

              <!-- Output Section -->
              <div class="output-section">
                <div class="output-header">
                  <h3 class="output-title">Output</h3>
                  <div class="output-actions" v-if="base64Output.result">
                    <button class="output-action" @click="copyToClipboard(base64Output.result)">
                      Copy
                    </button>
                    <button class="output-action" @click="clearOutput('base64')">
                      Clear
                    </button>
                  </div>
                </div>
                <div class="output-group">
                  <div class="output-content">
                    <pre class="output-text">{{ base64Output.result || 'Your Base64 encoded/decoded result will appear here' }}</pre>
                  </div>
                  <div class="output-info">
                    <div class="info-row">
                      <span class="info-label">Operation:</span>
                      <span class="info-value">{{ base64Output.operation || '--' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Format:</span>
                      <span class="info-value">{{ base64Output.format || '--' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Size Change:</span>
                      <span class="info-value">{{ calculateSizeChange(base64Input.text, base64Output.result) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Base64 Examples -->
            <div class="examples-section">
              <h3 class="examples-title">Base64 Examples</h3>
              <div class="examples-grid">
                <div class="example-item">
                  <div class="example-input">Hello</div>
                  <div class="example-arrow">→</div>
                  <div class="example-output">SGVsbG8=</div>
                </div>
                <div class="example-item">
                  <div class="example-input">Base64</div>
                  <div class="example-arrow">→</div>
                  <div class="example-output">QmFzZTY0</div>
                </div>
                <div class="example-item">
                  <div class="example-input">Encode this!</div>
                  <div class="example-arrow">→</div>
                  <div class="example-output">RW5jb2RlIHRoaXMh</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ASCII Converter -->
      <div v-if="activeCategory === 'ascii'" class="tools-section">
        <div class="section-header">
          <h2 class="section-title">
            <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
            </svg>
            ASCII Converter
          </h2>
          <p class="section-description">
            Convert between text and ASCII codes (decimal, hexadecimal, binary)
          </p>
        </div>

        <div class="encoder-card">
          <div class="encoder-body">
            <div class="converter-grid">
              <!-- Text to ASCII -->
              <div class="converter-section">
                <div class="converter-header">
                  <h3 class="converter-title">Text to ASCII</h3>
                </div>
                <div class="input-group">
                  <label class="input-label">Text Input</label>
                  <textarea 
                    v-model="asciiInput.text"
                    class="code-editor"
                    placeholder="Enter text to convert to ASCII codes"
                    rows="4"
                    spellcheck="false"
                  ></textarea>
                </div>

                <div class="options-section">
                  <div class="option-group">
                    <label class="option-label">Output Format</label>
                    <div class="format-buttons">
                      <button 
                        class="format-button"
                        :class="{ active: asciiInput.textToAsciiFormat === 'decimal' }"
                        @click="asciiInput.textToAsciiFormat = 'decimal'"
                      >
                        Decimal
                      </button>
                      <button 
                        class="format-button"
                        :class="{ active: asciiInput.textToAsciiFormat === 'hex' }"
                        @click="asciiInput.textToAsciiFormat = 'hex'"
                      >
                        Hexadecimal
                      </button>
                      <button 
                        class="format-button"
                        :class="{ active: asciiInput.textToAsciiFormat === 'binary' }"
                        @click="asciiInput.textToAsciiFormat = 'binary'"
                      >
                        Binary
                      </button>
                    </div>
                  </div>

                  <div class="option-group">
                    <label class="option-label">Delimiter</label>
                    <select v-model="asciiInput.textToAsciiDelimiter" class="option-select">
                      <option value=" ">Space</option>
                      <option value=",">Comma</option>
                      <option value=";">Semicolon</option>
                      <option value="-">Dash</option>
                      <option value="|">Pipe</option>
                    </select>
                  </div>
                </div>

                <button class="convert-button" @click="textToAscii" :disabled="loading.textToAscii">
                  <span v-if="loading.textToAscii" class="loading-spinner"></span>
                  <span>{{ loading.textToAscii ? 'Converting...' : 'Convert to ASCII' }}</span>
                </button>

                <div class="output-preview" v-if="asciiOutput.textToAscii">
                  <label class="output-label">ASCII Codes:</label>
                  <div class="output-content">
                    <pre class="output-text">{{ asciiOutput.textToAscii }}</pre>
                  </div>
                  <button class="copy-button" @click="copyToClipboard(asciiOutput.textToAscii)">
                    Copy ASCII
                  </button>
                </div>
              </div>

              <!-- ASCII to Text -->
              <div class="converter-section">
                <div class="converter-header">
                  <h3 class="converter-title">ASCII to Text</h3>
                </div>
                <div class="input-group">
                  <label class="input-label">ASCII Codes</label>
                  <textarea 
                    v-model="asciiInput.ascii"
                    class="code-editor"
                    placeholder="Enter ASCII codes (e.g., 72 101 108 108 111)"
                    rows="4"
                    spellcheck="false"
                  ></textarea>
                </div>

                <div class="options-section">
                  <div class="option-group">
                    <label class="option-label">Input Format</label>
                    <div class="format-buttons">
                      <button 
                        class="format-button"
                        :class="{ active: asciiInput.asciiToTextFormat === 'decimal' }"
                        @click="asciiInput.asciiToTextFormat = 'decimal'"
                      >
                        Decimal
                      </button>
                      <button 
                        class="format-button"
                        :class="{ active: asciiInput.asciiToTextFormat === 'hex' }"
                        @click="asciiInput.asciiToTextFormat = 'hex'"
                      >
                        Hex
                      </button>
                      <button 
                        class="format-button"
                        :class="{ active: asciiInput.asciiToTextFormat === 'binary' }"
                        @click="asciiInput.asciiToTextFormat = 'binary'"
                      >
                        Binary
                      </button>
                    </div>
                  </div>

                  <div class="option-group">
                    <label class="option-label">Delimiter</label>
                    <input 
                      type="text" 
                      v-model="asciiInput.asciiToTextDelimiter"
                      class="delimiter-input"
                      placeholder="Space, comma, etc."
                    >
                  </div>
                </div>

                <button class="convert-button" @click="asciiToText" :disabled="loading.asciiToText">
                  <span v-if="loading.asciiToText" class="loading-spinner"></span>
                  <span>{{ loading.asciiToText ? 'Converting...' : 'Convert to Text' }}</span>
                </button>

                <div class="output-preview" v-if="asciiOutput.asciiToText">
                  <label class="output-label">Decoded Text:</label>
                  <div class="output-content">
                    <pre class="output-text">{{ asciiOutput.asciiToText }}</pre>
                  </div>
                  <button class="copy-button" @click="copyToClipboard(asciiOutput.asciiToText)">
                    Copy Text
                  </button>
                </div>
              </div>
            </div>

            <!-- ASCII Table -->
            <div class="ascii-table-section">
              <h3 class="table-title">ASCII Reference Table</h3>
              <div class="table-container">
                <table class="ascii-table">
                  <thead>
                    <tr>
                      <th>Char</th>
                      <th>Dec</th>
                      <th>Hex</th>
                      <th>Binary</th>
                      <th>Char</th>
                      <th>Dec</th>
                      <th>Hex</th>
                      <th>Binary</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in asciiTable" :key="row.char1">
                      <td>{{ row.char1 }}</td>
                      <td>{{ row.dec1 }}</td>
                      <td>{{ row.hex1 }}</td>
                      <td>{{ row.bin1 }}</td>
                      <td>{{ row.char2 }}</td>
                      <td>{{ row.dec2 }}</td>
                      <td>{{ row.hex2 }}</td>
                      <td>{{ row.bin2 }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- HTML Encoder/Decoder -->
      <div v-if="activeCategory === 'html'" class="tools-section">
        <div class="section-header">
          <h2 class="section-title">
            <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
            HTML Encoder & Decoder
          </h2>
          <p class="section-description">
            Encode special characters to HTML entities and decode HTML entities back to text
          </p>
        </div>

        <div class="encoder-card">
          <div class="encoder-body">
            <div class="encoder-columns">
              <!-- Input Section -->
              <div class="input-section">
                <div class="input-header">
                  <h3 class="input-title">Input</h3>
                  <div class="input-actions">
                    <button class="input-action" @click="clearField('htmlInput')">
                      Clear
                    </button>
                    <button class="input-action" @click="loadSample('html')">
                      Sample
                    </button>
                  </div>
                </div>
                <div class="input-group">
                  <label class="input-label">HTML or Text</label>
                  <textarea 
                    v-model="htmlInput.text"
                    class="code-editor"
                    placeholder="Enter text to encode or HTML entities to decode"
                    rows="6"
                    spellcheck="false"
                  ></textarea>
                  <div class="input-info">
                    <span class="char-count">{{ htmlInput.text.length }} characters</span>
                    <span class="char-count">{{ countHtmlEntities(htmlInput.text) }} HTML entities</span>
                  </div>
                </div>

                <!-- HTML Options -->
                <div class="options-section">
                  <div class="option-group">
                    <label class="option-label">Encoding Options</label>
                    <div class="option-checkboxes">
                      <label class="checkbox">
                        <input type="checkbox" v-model="htmlInput.encodeAll">
                        <span class="checkmark"></span>
                        Encode all characters (including letters and numbers)
                      </label>
                      <label class="checkbox">
                        <input type="checkbox" v-model="htmlInput.preserveWhitespace">
                        <span class="checkmark"></span>
                        Preserve whitespace
                      </label>
                    </div>
                  </div>
                </div>

                <div class="action-buttons">
                  <button class="encode-button" @click="htmlEncode" :disabled="loading.htmlEncode">
                    <span v-if="loading.htmlEncode" class="loading-spinner"></span>
                    <span>{{ loading.htmlEncode ? 'Encoding...' : 'HTML Encode' }}</span>
                  </button>
                  <button class="decode-button" @click="htmlDecode" :disabled="loading.htmlDecode">
                    <span v-if="loading.htmlDecode" class="loading-spinner"></span>
                    <span>{{ loading.htmlDecode ? 'Decoding...' : 'HTML Decode' }}</span>
                  </button>
                </div>

                <div v-if="error.html" class="error-message">
                  {{ error.html }}
                </div>
              </div>

              <!-- Output Section -->
              <div class="output-section">
                <div class="output-header">
                  <h3 class="output-title">Output</h3>
                  <div class="output-actions" v-if="htmlOutput.result">
                    <button class="output-action" @click="copyToClipboard(htmlOutput.result)">
                      Copy
                    </button>
                    <button class="output-action" @click="clearOutput('html')">
                      Clear
                    </button>
                    <button class="output-action" @click="previewHtml(htmlOutput.result)">
                      Preview
                    </button>
                  </div>
                </div>
                <div class="output-group">
                  <div class="output-content">
                    <pre class="output-text">{{ htmlOutput.result || 'Your HTML encoded/decoded result will appear here' }}</pre>
                  </div>
                  <div class="output-info">
                    <div class="info-row">
                      <span class="info-label">Operation:</span>
                      <span class="info-value">{{ htmlOutput.operation || '--' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Entities Found:</span>
                      <span class="info-value">{{ countHtmlEntities(htmlOutput.result) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- HTML Entities Reference -->
            <div class="entities-section">
              <h3 class="entities-title">Common HTML Entities</h3>
              <div class="entities-grid">
                <div class="entity-item" v-for="entity in htmlEntities" :key="entity.char">
                  <div class="entity-char">{{ entity.char }}</div>
                  <div class="entity-name">{{ entity.name }}</div>
                  <div class="entity-code">{{ entity.entity }}</div>
                  <div class="entity-desc">{{ entity.desc }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Tools -->
      <div v-if="activeCategory === 'additional'" class="tools-section">
        <div class="section-header">
          <h2 class="section-title">
            <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            Additional Encoding Tools
          </h2>
          <p class="section-description">
            More encoding formats: Hexadecimal, Binary, UTF-8, and validation tools
          </p>
        </div>

        <div class="tools-grid">
          <!-- Hex Encoder/Decoder -->
          <div class="tool-card">
            <div class="tool-header">
              <h3 class="tool-title">Hex Encoder/Decoder</h3>
              <p class="tool-description">Convert text to hexadecimal and vice versa</p>
            </div>
            <div class="tool-body">
              <textarea 
                v-model="hexInput.text"
                class="tool-textarea"
                placeholder="Enter text or hex string"
                rows="3"
              ></textarea>
              <div class="tool-buttons">
                <button class="tool-button" @click="hexEncode" :disabled="loading.hexEncode">
                  <span v-if="loading.hexEncode" class="loading-spinner"></span>
                  <span>Hex Encode</span>
                </button>
                <button class="tool-button" @click="hexDecode" :disabled="loading.hexDecode">
                  <span v-if="loading.hexDecode" class="loading-spinner"></span>
                  <span>Hex Decode</span>
                </button>
              </div>
              <div class="tool-output" v-if="hexOutput.result">
                <pre>{{ hexOutput.result }}</pre>
                <button class="copy-small" @click="copyToClipboard(hexOutput.result)">
                  Copy
                </button>
              </div>
            </div>
          </div>

          <!-- Binary Encoder/Decoder -->
          <div class="tool-card">
            <div class="tool-header">
              <h3 class="tool-title">Binary Encoder/Decoder</h3>
              <p class="tool-description">Convert text to binary and vice versa</p>
            </div>
            <div class="tool-body">
              <textarea 
                v-model="binaryInput.text"
                class="tool-textarea"
                placeholder="Enter text or binary string"
                rows="3"
              ></textarea>
              <div class="tool-buttons">
                <button class="tool-button" @click="binaryEncode" :disabled="loading.binaryEncode">
                  <span v-if="loading.binaryEncode" class="loading-spinner"></span>
                  <span>Binary Encode</span>
                </button>
                <button class="tool-button" @click="binaryDecode" :disabled="loading.binaryDecode">
                  <span v-if="loading.binaryDecode" class="loading-spinner"></span>
                  <span>Binary Decode</span>
                </button>
              </div>
              <div class="tool-output" v-if="binaryOutput.result">
                <pre>{{ binaryOutput.result }}</pre>
                <button class="copy-small" @click="copyToClipboard(binaryOutput.result)">
                  Copy
                </button>
              </div>
            </div>
          </div>

          <!-- UTF-8 Encoder -->
          <div class="tool-card">
            <div class="tool-header">
              <h3 class="tool-title">UTF-8 Encoder</h3>
              <p class="tool-description">Convert text to UTF-8 byte sequence</p>
            </div>
            <div class="tool-body">
              <textarea 
                v-model="utf8Input.text"
                class="tool-textarea"
                placeholder="Enter text to encode"
                rows="3"
              ></textarea>
              <button class="tool-button full" @click="utf8Encode" :disabled="loading.utf8Encode">
                <span v-if="loading.utf8Encode" class="loading-spinner"></span>
                <span>UTF-8 Encode</span>
              </button>
              <div class="tool-output" v-if="utf8Output.result">
                <pre>{{ utf8Output.result }}</pre>
                <button class="copy-small" @click="copyToClipboard(utf8Output.result)">
                  Copy
                </button>
              </div>
            </div>
          </div>

          <!-- Encoding Validator -->
          <div class="tool-card">
            <div class="tool-header">
              <h3 class="tool-title">Encoding Validator</h3>
              <p class="tool-description">Validate text encoding formats</p>
            </div>
            <div class="tool-body">
              <textarea 
                v-model="validatorInput.text"
                class="tool-textarea"
                placeholder="Enter text to validate"
                rows="3"
              ></textarea>
              <select v-model="validatorInput.encoding" class="tool-select">
                <option value="utf8">UTF-8</option>
                <option value="ascii">ASCII</option>
                <option value="base64">Base64</option>
                <option value="hex">Hexadecimal</option>
              </select>
              <button class="tool-button full" @click="validateEncoding" :disabled="loading.validate">
                <span v-if="loading.validate" class="loading-spinner"></span>
                <span>Validate Encoding</span>
              </button>
              <div class="validation-result" v-if="validatorOutput.result">
                <div class="valid-icon" :class="{ valid: validatorOutput.valid, invalid: !validatorOutput.valid }">
                  {{ validatorOutput.valid ? '✓' : '✗' }}
                </div>
                <div class="valid-text">{{ validatorOutput.message }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Features Grid -->
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
            </svg>
          </div>
          <h3 class="feature-title">Multiple Formats</h3>
          <p class="feature-description">
            Support for URL, Base64, HTML, ASCII, Hex, Binary and more
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h3 class="feature-title">Validation</h3>
          <p class="feature-description">
            Automatic validation and error checking for all encodings
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 11.01L3 11v2h18v-2zM3 16h12v2H3v-2zM21 6H3v2.01L21 8V6z"/>
            </svg>
          </div>
          <h3 class="feature-title">Real-time</h3>
          <p class="feature-description">
            Instant conversion with live preview and character counts
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <h3 class="feature-title">Batch Processing</h3>
          <p class="feature-description">
            Process multiple items at once with batch encoding/decoding
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.18.101:3000/api/encoder';

// State
const activeCategory = ref('url');
const categories = [
  { id: 'url', label: 'URL', icon: 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z' },
  { id: 'base64', label: 'Base64', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z' },
  { id: 'ascii', label: 'ASCII', icon: 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z' },
  { id: 'html', label: 'HTML', icon: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z' },
  { id: 'additional', label: 'More Tools', icon: 'M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z' },
];

// URL Encoding Data
const urlInput = reactive({ text: '' });
const urlOutput = reactive({ result: '', operation: '' });

// Base64 Encoding Data
const base64Input = reactive({ 
  text: '',
  isBinary: false,
  outputFormat: 'utf8'
});
const base64Output = reactive({ result: '', operation: '', format: '' });

// ASCII Converter Data
const asciiInput = reactive({
  text: '',
  ascii: '',
  textToAsciiFormat: 'decimal',
  textToAsciiDelimiter: ' ',
  asciiToTextFormat: 'decimal',
  asciiToTextDelimiter: ' '
});
const asciiOutput = reactive({
  textToAscii: '',
  asciiToText: ''
});

// HTML Encoder Data
const htmlInput = reactive({
  text: '',
  encodeAll: false,
  preserveWhitespace: false
});
const htmlOutput = reactive({ result: '', operation: '' });

// Additional Tools Data
const hexInput = reactive({ text: '' });
const hexOutput = reactive({ result: '' });
const binaryInput = reactive({ text: '' });
const binaryOutput = reactive({ result: '' });
const utf8Input = reactive({ text: '' });
const utf8Output = reactive({ result: '' });
const validatorInput = reactive({ text: '', encoding: 'utf8' });
const validatorOutput = reactive({ result: null, valid: false, message: '' });

// Loading states
const loading = reactive({
  urlEncode: false,
  urlDecode: false,
  base64Encode: false,
  base64Decode: false,
  textToAscii: false,
  asciiToText: false,
  htmlEncode: false,
  htmlDecode: false,
  hexEncode: false,
  hexDecode: false,
  binaryEncode: false,
  binaryDecode: false,
  utf8Encode: false,
  validate: false
});

// Error states
const error = reactive({
  url: '',
  base64: '',
  ascii: '',
  html: '',
  hex: '',
  binary: '',
  utf8: '',
  validator: ''
});

// ASCII Table Data
const asciiTable = ref([
  { char1: 'NUL', dec1: 0, hex1: '00', bin1: '00000000', char2: 'Space', dec2: 32, hex2: '20', bin2: '00100000' },
  { char1: 'SOH', dec1: 1, hex1: '01', bin1: '00000001', char2: '!', dec2: 33, hex2: '21', bin2: '00100001' },
  { char1: 'STX', dec1: 2, hex1: '02', bin1: '00000010', char2: '"', dec2: 34, hex2: '22', bin2: '00100010' },
  { char1: 'ETX', dec1: 3, hex1: '03', bin1: '00000011', char2: '#', dec2: 35, hex2: '23', bin2: '00100011' },
  { char1: 'EOT', dec1: 4, hex1: '04', bin1: '00000100', char2: '$', dec2: 36, hex2: '24', bin2: '00100100' },
  { char1: 'ENQ', dec1: 5, hex1: '05', bin1: '00000101', char2: '%', dec2: 37, hex2: '25', bin2: '00100101' },
  { char1: 'ACK', dec1: 6, hex1: '06', bin1: '00000110', char2: '&', dec2: 38, hex2: '26', bin2: '00100110' },
  { char1: 'BEL', dec1: 7, hex1: '07', bin1: '00000111', char2: "'", dec2: 39, hex2: '27', bin2: '00100111' },
  { char1: 'BS', dec1: 8, hex1: '08', bin1: '00001000', char2: '(', dec2: 40, hex2: '28', bin2: '00101000' },
  { char1: 'HT', dec1: 9, hex1: '09', bin1: '00001001', char2: ')', dec2: 41, hex2: '29', bin2: '00101001' },
  { char1: 'LF', dec1: 10, hex1: '0A', bin1: '00001010', char2: '*', dec2: 42, hex2: '2A', bin2: '00101010' },
  { char1: 'VT', dec1: 11, hex1: '0B', bin1: '00001011', char2: '+', dec2: 43, hex2: '2B', bin2: '00101011' },
  { char1: 'FF', dec1: 12, hex1: '0C', bin1: '00001100', char2: ',', dec2: 44, hex2: '2C', bin2: '00101100' },
  { char1: 'CR', dec1: 13, hex1: '0D', bin1: '00001101', char2: '-', dec2: 45, hex2: '2D', bin2: '00101101' },
  { char1: 'SO', dec1: 14, hex1: '0E', bin1: '00001110', char2: '.', dec2: 46, hex2: '2E', bin2: '00101110' },
  { char1: 'SI', dec1: 15, hex1: '0F', bin1: '00001111', char2: '/', dec2: 47, hex2: '2F', bin2: '00101111' },
  { char1: 'DLE', dec1: 16, hex1: '10', bin1: '00010000', char2: '0', dec2: 48, hex2: '30', bin2: '00110000' },
  { char1: 'DC1', dec1: 17, hex1: '11', bin1: '00010001', char2: '1', dec2: 49, hex2: '31', bin2: '00110001' },
  { char1: 'DC2', dec1: 18, hex1: '12', bin1: '00010010', char2: '2', dec2: 50, hex2: '32', bin2: '00110010' },
  { char1: 'DC3', dec1: 19, hex1: '13', bin1: '00010011', char2: '3', dec2: 51, hex2: '33', bin2: '00110011' },
  { char1: 'DC4', dec1: 20, hex1: '14', bin1: '00010100', char2: '4', dec2: 52, hex2: '34', bin2: '00110100' },
  { char1: 'NAK', dec1: 21, hex1: '15', bin1: '00010101', char2: '5', dec2: 53, hex2: '35', bin2: '00110101' },
  { char1: 'SYN', dec1: 22, hex1: '16', bin1: '00010110', char2: '6', dec2: 54, hex2: '36', bin2: '00110110' },
  { char1: 'ETB', dec1: 23, hex1: '17', bin1: '00010111', char2: '7', dec2: 55, hex2: '37', bin2: '00110111' },
  { char1: 'CAN', dec1: 24, hex1: '18', bin1: '00011000', char2: '8', dec2: 56, hex2: '38', bin2: '00111000' },
  { char1: 'EM', dec1: 25, hex1: '19', bin1: '00011001', char2: '9', dec2: 57, hex2: '39', bin2: '00111001' },
  { char1: 'SUB', dec1: 26, hex1: '1A', bin1: '00011010', char2: ':', dec2: 58, hex2: '3A', bin2: '00111010' },
  { char1: 'ESC', dec1: 27, hex1: '1B', bin1: '00011011', char2: ';', dec2: 59, hex2: '3B', bin2: '00111011' },
  { char1: 'FS', dec1: 28, hex1: '1C', bin1: '00011100', char2: '<', dec2: 60, hex2: '3C', bin2: '00111100' },
  { char1: 'GS', dec1: 29, hex1: '1D', bin1: '00011101', char2: '=', dec2: 61, hex2: '3D', bin2: '00111101' },
  { char1: 'RS', dec1: 30, hex1: '1E', bin1: '00011110', char2: '>', dec2: 62, hex2: '3E', bin2: '00111110' },
  { char1: 'US', dec1: 31, hex1: '1F', bin1: '00011111', char2: '?', dec2: 63, hex2: '3F', bin2: '00111111' }
]);

// HTML Entities Reference
const htmlEntities = ref([
  { char: '<', name: 'Less Than', entity: '&lt;', desc: 'Opening angle bracket' },
  { char: '>', name: 'Greater Than', entity: '&gt;', desc: 'Closing angle bracket' },
  { char: '&', name: 'Ampersand', entity: '&amp;', desc: 'And symbol' },
  { char: '"', name: 'Quote', entity: '&quot;', desc: 'Double quotation mark' },
  { char: "'", name: 'Apostrophe', entity: '&#39;', desc: 'Single quotation mark' },
  { char: '©', name: 'Copyright', entity: '&copy;', desc: 'Copyright symbol' },
  { char: '®', name: 'Registered', entity: '&reg;', desc: 'Registered trademark' },
  { char: '™', name: 'Trademark', entity: '&trade;', desc: 'Trademark symbol' },
  { char: '€', name: 'Euro', entity: '&euro;', desc: 'Euro currency' },
  { char: '£', name: 'Pound', entity: '&pound;', desc: 'British pound' },
  { char: '¥', name: 'Yen', entity: '&yen;', desc: 'Japanese yen' },
  { char: '¢', name: 'Cent', entity: '&cent;', desc: 'Cent symbol' },
  { char: ' ', name: 'Space', entity: '&nbsp;', desc: 'Non-breaking space' },
  { char: '•', name: 'Bullet', entity: '&bull;', desc: 'Bullet point' },
  { char: '…', name: 'Ellipsis', entity: '&hellip;', desc: 'Horizontal ellipsis' }
]);

// Helper Functions
const countSpaces = (text) => {
  return (text.match(/ /g) || []).length;
};

const countHtmlEntities = (text) => {
  if (!text) return 0;
  return (text.match(/&[a-z]+;|&#\d+;|&#x[0-9a-f]+;/gi) || []).length;
};

const isBase64 = (text) => {
  if (!text) return false;
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(text);
};

const calculateEncodingChange = (original, result) => {
  if (!original || !result) return '--';
  const change = ((result.length - original.length) / original.length * 100).toFixed(1);
  return `${change}% ${change >= 0 ? 'increase' : 'decrease'}`;
};

const calculateSizeChange = (original, result) => {
  if (!original || !result) return '--';
  const originalBytes = new Blob([original]).size;
  const resultBytes = new Blob([result]).size;
  const change = ((resultBytes - originalBytes) / originalBytes * 100).toFixed(1);
  return `${change}% ${change >= 0 ? 'larger' : 'smaller'}`;
};

// Theme toggle
const toggleTheme = () => {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
};

// Clear field
const clearField = (field) => {
  eval(`${field} = ''`);
  if (field.includes('Input')) {
    const outputField = field.replace('Input', 'Output');
    if (eval(`typeof ${outputField}`) === 'object') {
      eval(`${outputField}.result = ''`);
      eval(`${outputField}.operation = ''`);
    }
  }
};

// Clear output
const clearOutput = (type) => {
  switch(type) {
    case 'url':
      urlOutput.result = '';
      urlOutput.operation = '';
      break;
    case 'base64':
      base64Output.result = '';
      base64Output.operation = '';
      base64Output.format = '';
      break;
    case 'html':
      htmlOutput.result = '';
      htmlOutput.operation = '';
      break;
  }
};

// Load sample data
const loadSample = (type) => {
  switch(type) {
    case 'url':
      urlInput.text = 'Hello World! This is a sample & test=value';
      break;
    case 'base64':
      base64Input.text = 'Hello Base64 Encoding!';
      break;
    case 'html':
      htmlInput.text = '<div class="test">Hello & Welcome!</div>';
      break;
    case 'ascii':
      asciiInput.text = 'Hello ASCII';
      asciiInput.ascii = '72 101 108 108 111 32 87 111 114 108 100';
      break;
  }
};

// Copy to clipboard
const copyToClipboard = async (text) => {
  if (!text || !text.trim()) {
    showNotification('No text to copy');
    return;
  }
  
  try {
    await navigator.clipboard.writeText(text);
    showNotification('Copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy:', err);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showNotification('Copied to clipboard!');
  }
};

// Show notification
const showNotification = (message) => {
  const notification = document.createElement('div');
  notification.className = 'copy-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      document.body.removeChild(notification);
      document.head.removeChild(style);
    }, 300);
  }, 2000);
};

// Preview HTML
const previewHtml = (html) => {
  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>HTML Preview</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .preview { border: 1px solid #ccc; padding: 20px; margin: 20px 0; }
        .source { background: #f5f5f5; padding: 10px; font-family: monospace; }
      </style>
    </head>
    <body>
      <h1>HTML Preview</h1>
      <div class="preview">${html}</div>
      <h3>Source Code:</h3>
      <div class="source">${html.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </body>
    </html>
  `);
  win.document.close();
};

// API Functions
const urlEncode = async () => {
  if (!urlInput.text.trim()) {
    error.url = 'Please enter text to encode';
    return;
  }

  loading.urlEncode = true;
  error.url = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/url-encode`, {
      text: urlInput.text
    });

    if (response.data.success) {
      urlOutput.result = response.data.encoded;
      urlOutput.operation = 'URL Encoded';
    } else {
      error.url = response.data.error || 'Encoding failed';
    }
  } catch (err) {
    error.url = err.response?.data?.error || 'Server error. Please try again.';
    console.error('URL encode error:', err);
  } finally {
    loading.urlEncode = false;
  }
};

const urlDecode = async () => {
  if (!urlInput.text.trim()) {
    error.url = 'Please enter URL encoded text';
    return;
  }

  loading.urlDecode = true;
  error.url = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/url-decode`, {
      text: urlInput.text
    });

    if (response.data.success) {
      urlOutput.result = response.data.decoded;
      urlOutput.operation = 'URL Decoded';
    } else {
      error.url = response.data.error || 'Decoding failed';
    }
  } catch (err) {
    error.url = err.response?.data?.error || 'Server error. Please try again.';
    console.error('URL decode error:', err);
  } finally {
    loading.urlDecode = false;
  }
};

const base64Encode = async () => {
  if (!base64Input.text.trim()) {
    error.base64 = 'Please enter text to encode';
    return;
  }

  loading.base64Encode = true;
  error.base64 = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/base64-encode`, {
      text: base64Input.text,
      isBinary: base64Input.isBinary
    });

    if (response.data.success) {
      base64Output.result = response.data.encoded;
      base64Output.operation = 'Base64 Encoded';
      base64Output.format = response.data.isBinary ? 'Binary' : 'Text';
    } else {
      error.base64 = response.data.error || 'Encoding failed';
    }
  } catch (err) {
    error.base64 = err.response?.data?.error || 'Server error. Please try again.';
    console.error('Base64 encode error:', err);
  } finally {
    loading.base64Encode = false;
  }
};

const base64Decode = async () => {
  if (!base64Input.text.trim()) {
    error.base64 = 'Please enter Base64 string';
    return;
  }

  loading.base64Decode = true;
  error.base64 = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/base64-decode`, {
      text: base64Input.text,
      outputFormat: base64Input.outputFormat
    });

    if (response.data.success) {
      base64Output.result = response.data.decoded;
      base64Output.operation = 'Base64 Decoded';
      base64Output.format = response.data.outputFormat;
    } else {
      error.base64 = response.data.error || 'Decoding failed';
    }
  } catch (err) {
    error.base64 = err.response?.data?.error || 'Server error. Please try again.';
    console.error('Base64 decode error:', err);
  } finally {
    loading.base64Decode = false;
  }
};

const textToAscii = async () => {
  if (!asciiInput.text.trim()) {
    error.ascii = 'Please enter text to convert';
    return;
  }

  loading.textToAscii = true;
  error.ascii = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/text-to-ascii`, {
      text: asciiInput.text,
      format: asciiInput.textToAsciiFormat,
      delimiter: asciiInput.textToAsciiDelimiter
    });

    if (response.data.success) {
      asciiOutput.textToAscii = response.data.ascii;
    } else {
      error.ascii = response.data.error || 'Conversion failed';
    }
  } catch (err) {
    error.ascii = err.response?.data?.error || 'Server error. Please try again.';
    console.error('Text to ASCII error:', err);
  } finally {
    loading.textToAscii = false;
  }
};

const asciiToText = async () => {
  if (!asciiInput.ascii.trim()) {
    error.ascii = 'Please enter ASCII codes';
    return;
  }

  loading.asciiToText = true;
  error.ascii = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/ascii-to-text`, {
      ascii: asciiInput.ascii,
      format: asciiInput.asciiToTextFormat,
      delimiter: asciiInput.asciiToTextDelimiter
    });

    if (response.data.success) {
      asciiOutput.asciiToText = response.data.text;
    } else {
      error.ascii = response.data.error || 'Conversion failed';
    }
  } catch (err) {
    error.ascii = err.response?.data?.error || 'Server error. Please try again.';
    console.error('ASCII to text error:', err);
  } finally {
    loading.asciiToText = false;
  }
};

const htmlEncode = async () => {
  if (!htmlInput.text.trim()) {
    error.html = 'Please enter text to encode';
    return;
  }

  loading.htmlEncode = true;
  error.html = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/html-encode`, {
      text: htmlInput.text,
      encodeAll: htmlInput.encodeAll
    });

    if (response.data.success) {
      htmlOutput.result = response.data.encoded;
      htmlOutput.operation = 'HTML Encoded';
    } else {
      error.html = response.data.error || 'Encoding failed';
    }
  } catch (err) {
    error.html = err.response?.data?.error || 'Server error. Please try again.';
    console.error('HTML encode error:', err);
  } finally {
    loading.htmlEncode = false;
  }
};

const htmlDecode = async () => {
  if (!htmlInput.text.trim()) {
    error.html = 'Please enter HTML encoded text';
    return;
  }

  loading.htmlDecode = true;
  error.html = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/html-decode`, {
      text: htmlInput.text
    });

    if (response.data.success) {
      htmlOutput.result = response.data.decoded;
      htmlOutput.operation = 'HTML Decoded';
    } else {
      error.html = response.data.error || 'Decoding failed';
    }
  } catch (err) {
    error.html = err.response?.data?.error || 'Server error. Please try again.';
    console.error('HTML decode error:', err);
  } finally {
    loading.htmlDecode = false;
  }
};

const hexEncode = async () => {
  if (!hexInput.text.trim()) {
    error.hex = 'Please enter text to encode';
    return;
  }

  loading.hexEncode = true;
  error.hex = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/hex-encode`, {
      text: hexInput.text
    });

    if (response.data.success) {
      hexOutput.result = response.data.encoded;
    } else {
      error.hex = response.data.error || 'Encoding failed';
    }
  } catch (err) {
    error.hex = err.response?.data?.error || 'Server error. Please try again.';
    console.error('Hex encode error:', err);
  } finally {
    loading.hexEncode = false;
  }
};

const hexDecode = async () => {
  if (!hexInput.text.trim()) {
    error.hex = 'Please enter hex string';
    return;
  }

  loading.hexDecode = true;
  error.hex = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/hex-decode`, {
      text: hexInput.text
    });

    if (response.data.success) {
      hexOutput.result = response.data.decoded;
    } else {
      error.hex = response.data.error || 'Decoding failed';
    }
  } catch (err) {
    error.hex = err.response?.data?.error || 'Server error. Please try again.';
    console.error('Hex decode error:', err);
  } finally {
    loading.hexDecode = false;
  }
};

const binaryEncode = async () => {
  if (!binaryInput.text.trim()) {
    error.binary = 'Please enter text to encode';
    return;
  }

  loading.binaryEncode = true;
  error.binary = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/binary-encode`, {
      text: binaryInput.text
    });

    if (response.data.success) {
      binaryOutput.result = response.data.encoded;
    } else {
      error.binary = response.data.error || 'Encoding failed';
    }
  } catch (err) {
    error.binary = err.response?.data?.error || 'Server error. Please try again.';
    console.error('Binary encode error:', err);
  } finally {
    loading.binaryEncode = false;
  }
};

const binaryDecode = async () => {
  if (!binaryInput.text.trim()) {
    error.binary = 'Please enter binary string';
    return;
  }

  loading.binaryDecode = true;
  error.binary = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/binary-decode`, {
      text: binaryInput.text,
      delimiter: ' '
    });

    if (response.data.success) {
      binaryOutput.result = response.data.decoded;
    } else {
      error.binary = response.data.error || 'Decoding failed';
    }
  } catch (err) {
    error.binary = err.response?.data?.error || 'Server error. Please try again.';
    console.error('Binary decode error:', err);
  } finally {
    loading.binaryDecode = false;
  }
};

const utf8Encode = async () => {
  if (!utf8Input.text.trim()) {
    error.utf8 = 'Please enter text to encode';
    return;
  }

  loading.utf8Encode = true;
  error.utf8 = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/utf8-encode`, {
      text: utf8Input.text
    });

    if (response.data.success) {
      utf8Output.result = response.data.encoded;
    } else {
      error.utf8 = response.data.error || 'Encoding failed';
    }
  } catch (err) {
    error.utf8 = err.response?.data?.error || 'Server error. Please try again.';
    console.error('UTF-8 encode error:', err);
  } finally {
    loading.utf8Encode = false;
  }
};

const validateEncoding = async () => {
  if (!validatorInput.text.trim()) {
    error.validator = 'Please enter text to validate';
    return;
  }

  loading.validate = true;
  error.validator = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/validate-encoding`, {
      text: validatorInput.text,
      encoding: validatorInput.encoding
    });

    if (response.data.success) {
      validatorOutput.result = response.data;
      validatorOutput.valid = response.data.valid;
      validatorOutput.message = response.data.message;
    } else {
      error.validator = response.data.error || 'Validation failed';
    }
  } catch (err) {
    error.validator = err.response?.data?.error || 'Server error. Please try again.';
    console.error('Validate encoding error:', err);
  } finally {
    loading.validate = false;
  }
};

// Initialize
onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
});
</script>

<style scoped>
/* Base Styles */
.encoding-tools-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  transition: background 0.3s ease;
}

[data-theme="dark"] .encoding-tools-page {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}

/* Header */
.page-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 24px 0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] .page-header {
  background: #1e293b;
  border-bottom-color: #334155;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.header-info {
  flex: 1;
  min-width: 0;
}

.page-title {
  font-size: 1.7rem;
  font-weight: 300;
  color: #1e293b;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

[data-theme="dark"] .page-title {
  color: #f1f5f9;
  -webkit-text-fill-color: #f1f5f9;
}

.title-icon {
  width: 28px;
  height: 28px;
  color: #4f46e5;
}

.page-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

[data-theme="dark"] .page-subtitle {
  color: #94a3b8;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-button {
  width: 44px;
  height: 44px;
  background: #f1f5f9;
  border: none;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #475569;
}

[data-theme="dark"] .action-button {
  background: #334155;
  color: #cbd5e1;
}

.action-button:hover {
  background: #e2e8f0;
  transform: translateY(-2px);
}

[data-theme="dark"] .action-button:hover {
  background: #475569;
}

.action-button svg {
  width: 20px;
  height: 20px;
}

/* Tool Categories */
.tool-categories {
  max-width: 1200px;
  margin: 24px auto 0;
  padding: 0 24px;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}

.tool-categories::-webkit-scrollbar {
  display: none;
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

[data-theme="dark"] .category-tab {
  background: #334155;
  border-color: #475569;
  color: #94a3b8;
}

.category-tab:hover {
  border-color: #c7d2fe;
  color: #4f46e5;
}

[data-theme="dark"] .category-tab:hover {
  border-color: #6366f1;
  color: #c7d2fe;
}

.category-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.category-icon {
  width: 18px;
  height: 18px;
}

.category-tab.active .category-icon {
  color: white;
}

.category-label {
  font-weight: 500;
}

/* Main Content */
.page-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 60px;
}

/* Section Header */
.tools-section {
  margin-bottom: 48px;
}

.section-header {
  margin-bottom: 32px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 500;
  color: #1e293b;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

[data-theme="dark"] .section-title {
  color: #f1f5f9;
}

.section-icon {
  width: 24px;
  height: 24px;
  color: #4f46e5;
}

.section-description {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

[data-theme="dark"] .section-description {
  color: #94a3b8;
}

/* Encoder Card */
.encoder-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin-bottom: 32px;
}

[data-theme="dark"] .encoder-card {
  background: #1e293b;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.encoder-body {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Encoder Columns */
.encoder-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

@media (max-width: 1024px) {
  .encoder-columns {
    grid-template-columns: 1fr;
  }
}

/* Input Section */
.input-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

[data-theme="dark"] .input-title {
  color: #f1f5f9;
}

.input-actions {
  display: flex;
  gap: 8px;
}

.input-action {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.3s ease;
}

[data-theme="dark"] .input-action {
  background: #334155;
  border-color: #475569;
  color: #cbd5e1;
}

.input-action:hover {
  background: #e2e8f0;
}

[data-theme="dark"] .input-action:hover {
  background: #475569;
}

.input-action svg {
  width: 16px;
  height: 16px;
}

/* Input Group */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: #475569;
}

[data-theme="dark"] .input-label {
  color: #cbd5e1;
}

.code-editor {
  width: 97%;
  padding: 16px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
  transition: all 0.3s ease;
  color: #1e293b;
}

[data-theme="dark"] .code-editor {
  background: #0f172a;
  border-color: #334155;
  color: #cbd5e1;
}

.code-editor:focus {
  outline: none;
  border-color: #4f46e5;
  background: white;
}

[data-theme="dark"] .code-editor:focus {
  background: #1e293b;
  border-color: #6366f1;
}

.input-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #64748b;
}

.char-count {
  font-size: 0.8rem;
  color: #64748b;
}

/* Options Section */
.options-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

[data-theme="dark"] .options-section {
  background: #0f172a;
  border-color: #334155;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #475569;
}

[data-theme="dark"] .option-label {
  color: #cbd5e1;
}

.option-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #475569;
}

[data-theme="dark"] .checkbox {
  color: #cbd5e1;
}

.checkbox input {
  display: none;
}

.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid #cbd5e1;
  border-radius: 4px;
  position: relative;
  transition: all 0.3s ease;
}

.checkbox input:checked + .checkmark {
  background: #4f46e5;
  border-color: #4f46e5;
}

.checkbox input:checked + .checkmark::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.option-select {
  padding: 10px 12px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1e293b;
  transition: all 0.3s ease;
}

[data-theme="dark"] .option-select {
  background: #0f172a;
  border-color: #334155;
  color: #cbd5e1;
}

.option-select:focus {
  outline: none;
  border-color: #4f46e5;
}

/* Format Buttons */
.format-buttons {
  display: flex;
  gap: 8px;
}

.format-button {
  flex: 1;
  padding: 8px 12px;
  background: #f1f5f9;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.3s ease;
}

[data-theme="dark"] .format-button {
  background: #334155;
  border-color: #475569;
  color: #cbd5e1;
}

.format-button:hover {
  border-color: #c7d2fe;
  color: #4f46e5;
}

.format-button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.delimiter-input {
  padding: 8px 12px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #1e293b;
}

[data-theme="dark"] .delimiter-input {
  background: #0f172a;
  border-color: #334155;
  color: #cbd5e1;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 12px;
}

.encode-button,
.decode-button,
.convert-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  font-size: 0.95rem;
  font-weight: 500;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.encode-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.encode-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.decode-button {
  background: #10b981;
  color: white;
}

.decode-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
}

.convert-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.convert-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.encode-button:disabled,
.decode-button:disabled,
.convert-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Output Section */
.output-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.output-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

[data-theme="dark"] .output-title {
  color: #f1f5f9;
}

.output-actions {
  display: flex;
  gap: 8px;
}

.output-action {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.output-action:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.output-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.output-content {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
}

[data-theme="dark"] .output-content {
  background: #0f172a;
}

.output-text {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #1e293b;
  white-space: pre-wrap;
  word-wrap: break-word;
}

[data-theme="dark"] .output-text {
  color: #cbd5e1;
}

.output-info {
  background: #f1f5f9;
  border-radius: 8px;
  padding: 12px 16px;
}

[data-theme="dark"] .output-info {
  background: #0f172a;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 0.85rem;
}

.info-label {
  font-weight: 500;
  color: #475569;
}

[data-theme="dark"] .info-label {
  color: #cbd5e1;
}

.info-value {
  color: #1e293b;
  font-family: 'Monaco', 'Menlo', monospace;
}

[data-theme="dark"] .info-value {
  color: #f1f5f9;
}

/* Examples Section */
.examples-section {
  padding-top: 24px;
  border-top: 2px solid #e2e8f0;
}

[data-theme="dark"] .examples-section {
  border-top-color: #334155;
}

.examples-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 16px 0;
}

[data-theme="dark"] .examples-title {
  color: #f1f5f9;
}

.example-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 0.85rem;
}

[data-theme="dark"] .example-item {
  background: #0f172a;
}

.example-input,
.example-output {
  flex: 1;
  font-family: 'Monaco', 'Menlo', monospace;
  color: #475569;
}

[data-theme="dark"] .example-input,
[data-theme="dark"] .example-output {
  color: #cbd5e1;
}

.example-arrow {
  color: #64748b;
  font-weight: bold;
}

/* Converter Grid */
.converter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

@media (max-width: 1024px) {
  .converter-grid {
    grid-template-columns: 1fr;
  }
}

.converter-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.converter-header {
  margin-bottom: 8px;
}

.converter-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

[data-theme="dark"] .converter-title {
  color: #f1f5f9;
}

/* Output Preview */
.output-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

[data-theme="dark"] .output-preview {
  background: #0f172a;
  border-color: #334155;
}

.output-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #475569;
}

[data-theme="dark"] .output-label {
  color: #cbd5e1;
}

.copy-button {
  align-self: flex-start;
  padding: 6px 12px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.copy-button:hover {
  background: #0da271;
  transform: translateY(-1px);
}

/* ASCII Table Section */
.ascii-table-section {
  padding-top: 24px;
  border-top: 2px solid #e2e8f0;
}

[data-theme="dark"] .ascii-table-section {
  border-top-color: #334155;
}

.table-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 16px 0;
}

[data-theme="dark"] .table-title {
  color: #f1f5f9;
}

.table-container {
  overflow-x: auto;
}

.ascii-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.ascii-table th {
  background: #f1f5f9;
  padding: 10px 8px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border: 1px solid #e2e8f0;
}

[data-theme="dark"] .ascii-table th {
  background: #334155;
  color: #cbd5e1;
  border-color: #475569;
}

.ascii-table td {
  padding: 8px;
  border: 1px solid #e2e8f0;
  color: #475569;
}

[data-theme="dark"] .ascii-table td {
  border-color: #475569;
  color: #cbd5e1;
}

.ascii-table tr:nth-child(even) {
  background: #f8fafc;
}

[data-theme="dark"] .ascii-table tr:nth-child(even) {
  background: #0f172a;
}

/* HTML Entities Section */
.entities-section {
  padding-top: 24px;
  border-top: 2px solid #e2e8f0;
}

[data-theme="dark"] .entities-section {
  border-top-color: #334155;
}

.entities-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 16px 0;
}

[data-theme="dark"] .entities-title {
  color: #f1f5f9;
}

.entities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.entity-item {
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

[data-theme="dark"] .entity-item {
  background: #0f172a;
  border-color: #334155;
}

.entity-char {
  font-size: 1.2rem;
  font-weight: bold;
  color: #4f46e5;
  margin-bottom: 4px;
}

.entity-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #475569;
}

[data-theme="dark"] .entity-name {
  color: #cbd5e1;
}

.entity-code {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.85rem;
  color: #10b981;
  margin: 4px 0;
}

.entity-desc {
  font-size: 0.8rem;
  color: #64748b;
}

/* Additional Tools Grid */
.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.tool-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] .tool-card {
  background: #1e293b;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.tool-header {
  margin-bottom: 16px;
}

.tool-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
}

[data-theme="dark"] .tool-title {
  color: #f1f5f9;
}

.tool-description {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}

.tool-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tool-textarea {
  width: 95%;
  min-height: 100px;
  padding: 12px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.9rem;
  resize: vertical;
  color: #1e293b;
}

[data-theme="dark"] .tool-textarea {
  background: #0f172a;
  border-color: #334155;
  color: #cbd5e1;
}

.tool-buttons {
  display: flex;
  gap: 8px;
}

.tool-button {
  flex: 1;
  padding: 10px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tool-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.tool-button.full {
  width: 100%;
}

.tool-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.tool-select {
  padding: 10px 12px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1e293b;
}

[data-theme="dark"] .tool-select {
  background: #0f172a;
  border-color: #334155;
  color: #cbd5e1;
}

.tool-output {
  position: relative;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  min-height: 60px;
  max-height: 150px;
  overflow-y: auto;
}

[data-theme="dark"] .tool-output {
  background: #0f172a;
  border-color: #334155;
}

.tool-output pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #1e293b;
}

[data-theme="dark"] .tool-output pre {
  color: #cbd5e1;
}

.copy-small {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
}

.copy-small:hover {
  background: #0da271;
}

/* Validation Result */
.validation-result {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

[data-theme="dark"] .validation-result {
  background: #0f172a;
  border-color: #334155;
}

.valid-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 1.2rem;
  font-weight: bold;
}

.valid-icon.valid {
  background: #10b981;
  color: white;
}

.valid-icon.invalid {
  background: #ef4444;
  color: white;
}

.valid-text {
  flex: 1;
  font-size: 0.9rem;
  color: #475569;
}

[data-theme="dark"] .valid-text {
  color: #cbd5e1;
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-top: 60px;
}

.feature-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

[data-theme="dark"] .feature-card {
  background: #1e293b;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.1);
}

.feature-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.feature-icon svg {
  width: 28px;
  height: 28px;
  color: white;
}

.feature-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
}

[data-theme="dark"] .feature-title {
  color: #f1f5f9;
}

.feature-description {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

[data-theme="dark"] .feature-description {
  color: #94a3b8;
}

/* Loading Spinner */
.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error Message */
.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin: 8px 0 0 0;
  padding: 12px 16px;
  background: #fef2f2;
  border-radius: 8px;
  border-left: 4px solid #ef4444;
}

[data-theme="dark"] .error-message {
  background: #7f1d1d;
  color: #fecaca;
  border-left-color: #ef4444;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .tool-categories {
    flex-wrap: wrap;
  }
  
  .encoder-card {
    padding: 20px;
  }
  
  .converter-grid {
    gap: 20px;
  }
  
  .tools-grid {
    grid-template-columns: 1fr;
  }
  
  .entities-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .tool-buttons {
    flex-direction: column;
  }
  
  .format-buttons {
    flex-direction: column;
  }
  
  .output-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .output-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .encoder-columns {
    gap: 20px;
  }
  
  .page-title {
    font-size: 1.4rem;
  }
  
  .section-title {
    font-size: 1.3rem;
  }
  
  .examples-grid {
    grid-template-columns: 1fr;
  }
}

/* Utility Classes for Theme Switching */
[data-theme="dark"] {
  --bg-primary: #1e293b;
  --bg-secondary: #0f172a;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --border-color: #334155;
  --shadow-color: rgba(0, 0, 0, 0.2);
}

[data-theme="light"] {
  --bg-primary: white;
  --bg-secondary: #f8fafc;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
  --shadow-color: rgba(0, 0, 0, 0.05);
}

/* Smooth Transitions */
* {
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}

/* Scrollbar Styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

[data-theme="dark"] ::-webkit-scrollbar-track {
  background: #334155;
}

</style>
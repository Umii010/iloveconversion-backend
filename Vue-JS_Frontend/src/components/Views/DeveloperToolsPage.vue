<template>
  <div class="developer-tools-page">
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">Developer Tools</h1>
          <p class="page-subtitle">
            Convert between formats, transpile code, and test APIs with our collection of developer utilities
          </p>
        </div>
        <div class="header-actions">
          <button class="action-button" aria-label="moon" @click="toggleTheme">
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
      <!-- Data Converters -->
      <div v-if="activeCategory === 'converters'" class="tools-section">
        <div class="section-header">
          <h2 class="section-title">
            <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
            Data Format Converters
          </h2>
          <p class="section-description">
            Convert between JSON, XML, YAML, and CSV formats instantly
          </p>
        </div>

        <div class="converter-grid">
          <!-- JSON ↔ XML Converter -->
          <div class="converter-card">
            <div class="converter-header">
              <h3 class="converter-title">JSON ↔ XML</h3>
              <div class="converter-badges">
                <span class="badge popular">Most Popular</span>
              </div>
            </div>
            <div class="converter-body">
              <!-- JSON Input Section -->
              <div class="input-group">
                <div class="input-header">
                  <label class="input-label">JSON Input</label>
                  <div class="input-buttons">
                    <button class="input-action" @click="clearField('jsonInput')">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                      Clear
                    </button>
                    <button class="input-action" @click="formatJson('jsonInput')">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
                      </svg>
                      Format
                    </button>
                  </div>
                </div>
                <textarea 
                  v-model="jsonInput"  aria-label="json input"
                  class="code-editor" 
                  rows="6"
                  spellcheck="false"
                ></textarea>
              </div>

              <!-- Conversion Controls -->
              <div class="conversion-controls">
                <button class="convert-button" @click="convertJsonToXml" :disabled="loading.jsonToXml">
                  <span v-if="loading.jsonToXml" class="loading-spinner"></span>
                  <span v-else>JSON → XML</span>
                </button>
                <button class="convert-button reverse" @click="convertXmlToJson" :disabled="loading.xmlToJson">
                  <span v-if="loading.xmlToJson" class="loading-spinner"></span>
                  <span v-else>XML → JSON</span>
                </button>
              </div>

              <!-- XML Input Section -->
              <div class="input-group">
                <div class="input-header">
                  <label class="input-label">XML Input</label>
                  <div class="input-buttons">
                    <button class="input-action" @click="clearField('xmlInput')">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                      Clear
                    </button>
                    <button class="input-action" @click="formatXml">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
                      </svg>
                      Format
                    </button>
                  </div>
                </div>
                <textarea 
                  v-model="xmlInput" aria-label="xml input"
                  class="code-editor" 
                  rows="6"
                  spellcheck="false"
                ></textarea>
              </div>

              <!-- Output Section -->
              <div class="output-section">
                <div class="output-header">
                  <h4 class="output-title">Output</h4>
                  <div class="output-buttons">
                    <button class="output-action" @click="copyOutput" v-if="outputText">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                      Copy
                    </button>
                    <button class="output-action" @click="clearOutput">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                      Clear
                    </button>
                  </div>
                </div>
                <div class="output-content">
                  <pre class="output-text">{{ outputText }}</pre>
                </div>
                <div v-if="error.jsonToXml || error.xmlToJson" class="error-message">
                  {{ error.jsonToXml || error.xmlToJson }}
                </div>
              </div>
            </div>
          </div>

          <!-- JSON ↔ YAML Converter -->
          <div class="converter-card">
            <div class="converter-header">
              <h3 class="converter-title">JSON ↔ YAML</h3>
            </div>
            <div class="converter-body">
              <!-- JSON Input Section -->
              <div class="input-group">
                <div class="input-header">
                  <label class="input-label">JSON Input</label>
                  <div class="input-buttons">
                    <button class="input-action" @click="clearField('jsonYamlInput.json')">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                      Clear
                    </button>
                    <button class="input-action" @click="formatJson('jsonYamlInput.json')">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
                      </svg>
                      Format
                    </button>
                  </div>
                </div>
                <textarea 
                  v-model="jsonYamlInput.json" 
                  class="code-editor" aria-label="json to yaml"
                  rows="6"
                  spellcheck="false"
                ></textarea>
              </div>

              <!-- Conversion Controls -->
              <div class="conversion-controls">
                <button class="convert-button" @click="convertJsonToYaml" :disabled="loading.jsonToYaml">
                  <span v-if="loading.jsonToYaml" class="loading-spinner"></span>
                  <span v-else>JSON → YAML</span>
                </button>
                <button class="convert-button reverse" @click="convertYamlToJson" :disabled="loading.yamlToJson">
                  <span v-if="loading.yamlToJson" class="loading-spinner"></span>
                  <span v-else>YAML → JSON</span>
                </button>
              </div>

              <!-- YAML Input Section -->
              <div class="input-group">
                <div class="input-header">
                  <label class="input-label">YAML Input</label>
                  <div class="input-buttons">
                    <button class="input-action" @click="clearField('yamlInput')">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                      Clear
                    </button>
                  </div>
                </div>
                <textarea 
                  v-model="yamlInput" 
                  class="code-editor" 
                  rows="6" aria-label="yml input"
                  spellcheck="false"
                ></textarea>
              </div>

              <!-- YAML Output Section -->
              <div class="output-section">
                <div class="output-header">
                  <h4 class="output-title">Output</h4>
                  <div class="output-buttons">
                    <button class="output-action" @click="copyYamlOutput" v-if="yamlOutput">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                      Copy
                    </button>
                    <button class="output-action" @click="clearYamlOutput">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                      Clear
                    </button>
                  </div>
                </div>
                <div class="output-content">
                  <pre class="output-text">{{ yamlOutput }}</pre>
                </div>
                <div v-if="error.jsonToYaml || error.yamlToJson" class="error-message">
                  {{ error.jsonToYaml || error.yamlToJson }}
                </div>
              </div>
            </div>
          </div>

          <!-- CSV ↔ JSON Converter -->
          <div class="converter-card">
            <div class="converter-header">
              <h3 class="converter-title">CSV ↔ JSON</h3>
            </div>
            <div class="converter-body">
              <!-- CSV Input Section -->
              <div class="input-group">
                <div class="input-header">
                  <label class="input-label">CSV Input</label>
                  <div class="input-buttons">
                    <button class="input-action" @click="clearField('csvJsonInput.csv')">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                      Clear
                    </button>
                  </div>
                </div>
                <textarea 
                  v-model="csvJsonInput.csv" 
                  class="code-editor" 
                  rows="6" aria-label="csv input"
                  spellcheck="false"
                ></textarea>
              </div>

              <!-- Conversion Controls -->
              <div class="conversion-controls">
                <button class="convert-button" @click="convertCsvToJson" :disabled="loading.csvToJson">
                  <span v-if="loading.csvToJson" class="loading-spinner"></span>
                  <span v-else>CSV → JSON</span>
                </button>
                <button class="convert-button reverse" @click="convertJsonToCsv" :disabled="loading.jsonToCsv">
                  <span v-if="loading.jsonToCsv" class="loading-spinner"></span>
                  <span v-else>JSON → CSV</span>
                </button>
              </div>

              <!-- JSON Input Section -->
              <div class="input-group">
                <div class="input-header">
                  <label class="input-label">JSON Input</label>
                  <div class="input-buttons">
                    <button class="input-action" @click="clearField('csvJsonOutput.json')">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                      Clear
                    </button>
                    <button class="input-action" @click="formatJson('csvJsonOutput.json')">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
                      </svg>
                      Format
                    </button>
                  </div>
                </div>
                <textarea 
                  v-model="csvJsonOutput.json" 
                  class="code-editor" 
                  rows="6" aria-label="json ontput"
                  spellcheck="false"
                ></textarea>
              </div>

              <!-- CSV/JSON Output Section -->
              <div class="output-section">
                <div class="output-header">
                  <h4 class="output-title">Output</h4>
                  <div class="output-buttons">
                    <button class="output-action" @click="copyCsvOutput" v-if="csvOutput">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                      Copy
                    </button>
                    <button class="output-action" @click="clearCsvOutput">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                      Clear
                    </button>
                  </div>
                </div>
                <div class="output-content">
                  <pre class="output-text">{{ csvOutput }}</pre>
                </div>
                <div v-if="error.csvToJson || error.jsonToCsv" class="error-message">
                  {{ error.csvToJson || error.jsonToCsv }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Code Transpilers Section -->
      <div v-if="activeCategory === 'transpilers'" class="tools-section">
        <div class="section-header">
          <h2 class="section-title">
            <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
            </svg>
            Code Transpilers
          </h2>
          <p class="section-description">
            Convert code between different programming languages and query languages
          </p>
        </div>

        <div class="transpiler-grid">
          <!-- SQL → MongoDB -->
          <div class="transpiler-card">
            <div class="transpiler-header">
              <div class="language-icons">
                <span class="language-icon sql">SQL</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                </svg>
                <span class="language-icon mongodb">MongoDB</span>
              </div>
              <h3 class="transpiler-title">SQL → MongoDB Query</h3>
            </div>
            <div class="transpiler-body">
              <div class="input-group">
                <label class="input-label">SQL Query</label>
                <div class="code-editor-wrapper">
                  <textarea 
                    v-model="sqlMongoInput.sql" 
                    class="code-editor" aria-label="sql input"
                    placeholder="SELECT * FROM users WHERE age > 25 AND city = 'NYC' ORDER BY name LIMIT 10"
                    rows="6"
                    spellcheck="false"
                  ></textarea>
                  <div class="editor-actions">
                    <button class="editor-action" @click="clearField('sqlMongoInput.sql')">
                      Clear
                    </button>
                  </div>
                </div>
              </div>
              <div class="transpiler-actions">
                <button class="transpile-button" @click="convertSqlToMongo" :disabled="loading.sqlToMongo">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                  <span v-if="loading.sqlToMongo">Converting...</span>
                  <span v-else>Convert to MongoDB</span>
                </button>
              </div>
              
              <div v-if="error.sqlToMongo" class="error-message">
                {{ error.sqlToMongo }}
              </div>
              
              <div class="output-section">
                <div class="output-header">
                  <h4 class="output-title">MongoDB Query Output</h4>
                  <div class="output-buttons">
                    <button class="output-action" @click="copyToClipboard(sqlMongoOutput.mongo)" v-if="sqlMongoOutput.mongo">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                      Copy
                    </button>
                    <button class="output-action" @click="clearField('sqlMongoOutput.mongo')">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                      Clear
                    </button>
                  </div>
                </div>
                <div class="output-content">
                  <pre class="output-text">{{ sqlMongoOutput.mongo }}</pre>
                </div>
              </div>
            </div>
          </div>

          <!-- Java → C# -->
          <div class="transpiler-card">
            <div class="transpiler-header">
              <div class="language-icons">
                <span class="language-icon java">Java</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                </svg>
                <span class="language-icon csharp">C#</span>
              </div>
              <h3 class="transpiler-title">Java → C#</h3>
            </div>
            <div class="transpiler-body">
              <div class="input-group">
                <label class="input-label">Java Code</label>
                <div class="code-editor-wrapper">
                  <textarea 
                    v-model="javaCsharpInput.java" 
                    class="code-editor"  aria-label="java input"
                    placeholder='public class User {
  private String name;
  private int age;
  
  public User(String name, int age) {
    this.name = name;
    this.age = age;
  }
}'
                    rows="6"
                    spellcheck="false"
                  ></textarea>
                  <div class="editor-actions">
                    <button class="editor-action" @click="clearField('javaCsharpInput.java')">
                      
                      Clear
                    </button>
                  </div>
                </div>
              </div>
              <div class="transpiler-actions">
                <button class="transpile-button" @click="convertJavaToCSharp" :disabled="loading.javaToCSharp">
                  <span v-if="loading.javaToCSharp">Converting...</span>
                  <span v-else>Convert to C#</span>
                </button>
              </div>
              
              <div v-if="error.javaToCSharp" class="error-message">
                {{ error.javaToCSharp }}
              </div>
              
              <div class="output-section">
                <div class="output-header">
                  <h4 class="output-title">C# Code Output</h4>
                  <div class="output-buttons">
                    <button class="output-action" @click="copyToClipboard(javaCsharpOutput.csharp)" v-if="javaCsharpOutput.csharp">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                      Copy
                    </button>
                    <button class="output-action" @click="clearField('javaCsharpOutput.csharp')">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                      Clear
                    </button>
                  </div>
                </div>
                <div class="output-content">
                  <pre class="output-text">{{ javaCsharpOutput.csharp }}</pre>
                </div>
              </div>
            </div>
          </div>

          <!-- Python → JavaScript -->
          <div class="transpiler-card">
            <div class="transpiler-header">
              <div class="language-icons">
                <span class="language-icon python">Python</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                </svg>
                <span class="language-icon javascript">JavaScript</span>
              </div>
              <h3 class="transpiler-title">Python → JavaScript</h3>
            </div>
            <div class="transpiler-body">
              <div class="input-group">
                <label class="input-label">Python Code</label>
                <div class="code-editor-wrapper">
                  <textarea 
                    v-model="pythonJsInput.python" 
                    class="code-editor" aria-label="python input"
                    placeholder='def calculate_sum(numbers):
    total = 0
    for num in numbers:
        total += num
    return total'
                    rows="6"
                    spellcheck="false"
                  ></textarea>
                  <div class="editor-actions">
                    <button class="editor-action" @click="clearField('pythonJsInput.python')">
                     
                      Clear
                    </button>
                  </div>
                </div>
              </div>
              <div class="transpiler-actions">
                <button class="transpile-button" @click="convertPythonToJs" :disabled="loading.pythonToJs">
                  <span v-if="loading.pythonToJs">Converting...</span>
                  <span v-else>Convert to JavaScript</span>
                </button>
              </div>
              
              <div v-if="error.pythonToJs" class="error-message">
                {{ error.pythonToJs }}
              </div>
              
              <div class="output-section">
                <div class="output-header">
                  <h4 class="output-title">JavaScript Code Output</h4>
                  <div class="output-buttons">
                    <button class="output-action" @click="copyToClipboard(pythonJsOutput.javascript)" v-if="pythonJsOutput.javascript">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                      Copy
                    </button>
                    <button class="output-action" @click="clearField('pythonJsOutput.javascript')">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                      Clear
                    </button>
                  </div>
                </div>
                <div class="output-content">
                  <pre class="output-text">{{ pythonJsOutput.javascript }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- API Tools Section -->
      <div v-if="activeCategory === 'api'" class="tools-section">
        <div class="section-header">
          <h2 class="section-title">
            <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
            </svg>
            API Tools
          </h2>
          <p class="section-description">
            Convert API requests between different clients and formats
          </p>
        </div>

        <div class="api-tools">
          <!-- cURL Converter -->
          <div class="api-card">
            <div class="api-header">
              <h3 class="api-title">cURL Converter</h3>
              <p class="api-description">Convert cURL commands to JavaScript Fetch/Axios</p>
            </div>
            <div class="api-body">
              <div class="input-group">
                <label class="input-label">cURL Command</label>
                <div class="code-editor-wrapper">
                  <textarea 
                    v-model="curlInput.curl" 
                    class="code-editor" aria-label="curl input"
                    placeholder='curl -X GET "https://api.example.com/users" -H "Authorization: Bearer token"'
                    rows="4"
                    spellcheck="false"
                  ></textarea>
                  <div class="editor-actions">
                    <button class="editor-action" @click="clearField('curlInput.curl')">
                     
                      Clear
                    </button>
                  </div>
                </div>
              </div>
              
              <div class="conversion-options">
                <div class="option-group">
                  <label class="option-label">Convert to:</label>
                  <div class="option-buttons">
                    <button 
                      class="option-button" 
                      :class="{ active: curlOutput.type === 'fetch' }"
                      @click="curlOutput.type = 'fetch'"
                    >
                      Fetch API
                    </button>
                    <button 
                      class="option-button" 
                      :class="{ active: curlOutput.type === 'axios' }"
                      @click="curlOutput.type = 'axios'"
                    >
                      Axios
                    </button>
                    <button 
                      class="option-button" 
                      :class="{ active: curlOutput.type === 'javascript' }"
                      @click="curlOutput.type = 'javascript'"
                    >
                      JavaScript
                    </button>
                  </div>
                </div>
              </div>

              <button class="convert-api-button" @click="convertCurl" :disabled="loading.curlConvert">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                <span v-if="loading.curlConvert">Converting...</span>
                <span v-else>Convert cURL</span>
              </button>

              <div v-if="error.curlConvert" class="error-message">
                {{ error.curlConvert }}
              </div>

              <div class="output-section">
                <div class="output-header">
                  <h4 class="output-title">{{ getCurlOutputLabel() }}</h4>
                  <div class="output-buttons">
                    <button class="output-action" @click="copyToClipboard(curlOutput.code)" v-if="curlOutput.code">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                      Copy
                    </button>
                    <button class="output-action" @click="clearField('curlOutput.code')">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                      Clear
                    </button>
                  </div>
                </div>
                <div class="output-content">
                  <pre class="output-text">{{ curlOutput.code }}</pre>
                </div>
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
          <h3 class="feature-title">Real-time Conversion</h3>
          <p class="feature-description">
            See results instantly as you type or paste your code
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 11.01L3 11v2h18v-2zM3 16h12v2H3v-2zM21 6H3v2.01L21 8V6z"/>
            </svg>
          </div>
          <h3 class="feature-title">Clipboard Support</h3>
          <p class="feature-description">
            Easily copy results to clipboard with one click
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
          </div>
          <h3 class="feature-title">No Installation</h3>
          <p class="feature-description">
            Works directly in your browser, no setup required
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
            </svg>
          </div>
          <h3 class="feature-title">Free Forever</h3>
          <p class="feature-description">
            All tools are completely free with no limits
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.18.101:3000/api/developer';

// State
const activeCategory = ref('converters');
const categories = [
  { id: 'converters', label: 'Converters', icon: 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4z' },
  { id: 'transpilers', label: 'Transpilers', icon: 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4z' },
  { id: 'api', label: 'API Tools', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z' },
];

// JSON ↔ XML Converter - SEPARATE INPUTS
const jsonInput = ref('');
const xmlInput = ref('');
const outputText = ref('');

// JSON ↔ YAML Converter
const jsonYamlInput = reactive({ json: '' });
const yamlInput = ref('');
const yamlOutput = ref('');

// CSV ↔ JSON Converter
const csvJsonInput = reactive({ csv: '' });
const csvJsonOutput = reactive({ json: '' });
const csvOutput = ref('');

// Transpiler data - SEPARATE INPUTS/OUTPUTS
const sqlMongoInput = reactive({ sql: '' });
const sqlMongoOutput = reactive({ mongo: '' });
const javaCsharpInput = reactive({ java: '' });
const javaCsharpOutput = reactive({ csharp: '' });
const pythonJsInput = reactive({ python: '' });
const pythonJsOutput = reactive({ javascript: '' });

// API tools data - SEPARATE INPUTS/OUTPUTS
const curlInput = reactive({ curl: '' });
const curlOutput = reactive({ 
  type: 'fetch',
  code: ''
});

// Loading states
const loading = reactive({
  jsonToXml: false,
  xmlToJson: false,
  jsonToYaml: false,
  yamlToJson: false,
  csvToJson: false,
  jsonToCsv: false,
  sqlToMongo: false,
  javaToCSharp: false,
  pythonToJs: false,
  curlConvert: false
});

// Error states
const error = reactive({
  jsonToXml: '',
  xmlToJson: '',
  jsonToYaml: '',
  yamlToJson: '',
  csvToJson: '',
  jsonToCsv: '',
  sqlToMongo: '',
  javaToCSharp: '',
  pythonToJs: '',
  curlConvert: ''
});

// Helper function to get cURL output label
const getCurlOutputLabel = () => {
  const labels = {
    'fetch': 'Fetch API Code',
    'axios': 'Axios Code',
    'javascript': 'JavaScript Code'
  };
  return labels[curlOutput.type] || 'Code Output';
};

// Theme toggle
const toggleTheme = () => {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
};

// Format JSON
const formatJson = (field) => {
  try {
    const obj = JSON.parse(eval(field));
    eval(`${field} = JSON.stringify(obj, null, 2)`);
  } catch (error) {
    alert('Invalid JSON: ' + error.message);
  }
};

// Format XML
const formatXml = () => {
  if (xmlInput.value) {
    const formatted = xmlInput.value
      .replace(/>\s*</g, '>\n<')
      .replace(/^\s*/gm, '');
    xmlInput.value = formatted;
  }
};

// Clear field
const clearField = (field) => {
  eval(`${field} = ''`);
};

// Clear outputs
const clearOutput = () => {
  outputText.value = '';
  error.jsonToXml = '';
  error.xmlToJson = '';
};

const clearYamlOutput = () => {
  yamlOutput.value = '';
  error.jsonToYaml = '';
  error.yamlToJson = '';
};

const clearCsvOutput = () => {
  csvOutput.value = '';
  error.csvToJson = '';
  error.jsonToCsv = '';
};

// Copy to clipboard
const copyToClipboard = async (text) => {
  if (!text || !text.trim()) {
    alert('No text to copy');
    return;
  }
  
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (!successful) {
          throw new Error('Copy command failed');
        }
      } finally {
        document.body.removeChild(textArea);
      }
    }
    
    showNotification('Copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy:', err);
    alert('Failed to copy to clipboard. Please try again.');
  }
};

// Copy functions
const copyOutput = () => copyToClipboard(outputText.value);
const copyYamlOutput = () => copyToClipboard(yamlOutput.value);
const copyCsvOutput = () => copyToClipboard(csvOutput.value);

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

// API Functions for Converters
const convertJsonToXml = async () => {
  if (!jsonInput.value.trim()) {
    error.jsonToXml = 'Please enter JSON input';
    return;
  }

  loading.jsonToXml = true;
  error.jsonToXml = '';
  error.xmlToJson = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/json-to-xml`, {
      json: jsonInput.value
    });

    if (response.data.success) {
      outputText.value = response.data.xml;
    } else {
      error.jsonToXml = response.data.error || 'Conversion failed';
    }
  } catch (err) {
    error.jsonToXml = err.response?.data?.error || 'Server error. Please try again.';
    console.error('JSON to XML error:', err);
  } finally {
    loading.jsonToXml = false;
  }
};

const convertXmlToJson = async () => {
  if (!xmlInput.value.trim()) {
    error.xmlToJson = 'Please enter XML input';
    return;
  }

  loading.xmlToJson = true;
  error.xmlToJson = '';
  error.jsonToXml = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/xml-to-json`, {
      xml: xmlInput.value
    });

    if (response.data.success) {
      outputText.value = response.data.json;
    } else {
      error.xmlToJson = response.data.error || 'Conversion failed';
    }
  } catch (err) {
    error.xmlToJson = err.response?.data?.error || 'Server error. Please try again.';
    console.error('XML to JSON error:', err);
  } finally {
    loading.xmlToJson = false;
  }
};

const convertJsonToYaml = async () => {
  if (!jsonYamlInput.json.trim()) {
    error.jsonToYaml = 'Please enter JSON input';
    return;
  }

  loading.jsonToYaml = true;
  error.jsonToYaml = '';
  error.yamlToJson = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/json-to-yaml`, {
      json: jsonYamlInput.json
    });

    if (response.data.success) {
      yamlOutput.value = response.data.yaml;
    } else {
      error.jsonToYaml = response.data.error || 'Conversion failed';
    }
  } catch (err) {
    error.jsonToYaml = err.response?.data?.error || 'Server error. Please try again.';
    console.error('JSON to YAML error:', err);
  } finally {
    loading.jsonToYaml = false;
  }
};

const convertYamlToJson = async () => {
  if (!yamlInput.value.trim()) {
    error.yamlToJson = 'Please enter YAML input';
    return;
  }

  loading.yamlToJson = true;
  error.yamlToJson = '';
  error.jsonToYaml = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/yaml-to-json`, {
      yaml: yamlInput.value
    });

    if (response.data.success) {
      yamlOutput.value = response.data.json;
    } else {
      error.yamlToJson = response.data.error || 'Conversion failed';
    }
  } catch (err) {
    error.yamlToJson = err.response?.data?.error || 'Server error. Please try again.';
    console.error('YAML to JSON error:', err);
  } finally {
    loading.yamlToJson = false;
  }
};

const convertCsvToJson = async () => {
  if (!csvJsonInput.csv.trim()) {
    error.csvToJson = 'Please enter CSV input';
    return;
  }

  loading.csvToJson = true;
  error.csvToJson = '';
  error.jsonToCsv = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/csv-to-json`, {
      csv: csvJsonInput.csv,
      delimiter: ',',
      hasHeaders: true
    });

    if (response.data.success) {
      csvOutput.value = response.data.json;
    } else {
      error.csvToJson = response.data.error || 'Conversion failed';
    }
  } catch (err) {
    error.csvToJson = err.response?.data?.error || 'Server error. Please try again.';
    console.error('CSV to JSON error:', err);
  } finally {
    loading.csvToJson = false;
  }
};

const convertJsonToCsv = async () => {
  if (!csvJsonOutput.json.trim()) {
    error.jsonToCsv = 'Please enter JSON input';
    return;
  }

  loading.jsonToCsv = true;
  error.jsonToCsv = '';
  error.csvToJson = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/json-to-csv`, {
      json: csvJsonOutput.json,
      delimiter: ','
    });

    if (response.data.success) {
      csvOutput.value = response.data.csv;
    } else {
      error.jsonToCsv = response.data.error || 'Conversion failed';
    }
  } catch (err) {
    error.jsonToCsv = err.response?.data?.error || 'Server error. Please try again.';
    console.error('JSON to CSV error:', err);
  } finally {
    loading.jsonToCsv = false;
  }
};

// API Functions for Transpilers
const convertSqlToMongo = async () => {
  if (!sqlMongoInput.sql.trim()) {
    error.sqlToMongo = 'Please enter SQL query';
    return;
  }

  loading.sqlToMongo = true;
  error.sqlToMongo = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/sql-to-mongo`, {
      sql: sqlMongoInput.sql
    });

    if (response.data.success) {
      sqlMongoOutput.mongo = response.data.mongo;
    } else {
      error.sqlToMongo = response.data.error || 'Conversion failed';
    }
  } catch (err) {
    error.sqlToMongo = err.response?.data?.error || 'Server error. Please try again.';
    console.error('SQL to MongoDB error:', err);
  } finally {
    loading.sqlToMongo = false;
  }
};

const convertJavaToCSharp = async () => {
  if (!javaCsharpInput.java.trim()) {
    error.javaToCSharp = 'Please enter Java code';
    return;
  }

  loading.javaToCSharp = true;
  error.javaToCSharp = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/java-to-csharp`, {
      java: javaCsharpInput.java
    });

    if (response.data.success) {
      javaCsharpOutput.csharp = response.data.csharp;
    } else {
      error.javaToCSharp = response.data.error || 'Conversion failed';
    }
  } catch (err) {
    error.javaToCSharp = err.response?.data?.error || 'Server error. Please try again.';
    console.error('Java to C# error:', err);
  } finally {
    loading.javaToCSharp = false;
  }
};

const convertPythonToJs = async () => {
  if (!pythonJsInput.python.trim()) {
    error.pythonToJs = 'Please enter Python code';
    return;
  }

  loading.pythonToJs = true;
  error.pythonToJs = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/python-to-javascript`, {
      python: pythonJsInput.python
    });

    if (response.data.success) {
      pythonJsOutput.javascript = response.data.javascript;
    } else {
      error.pythonToJs = response.data.error || 'Conversion failed';
    }
  } catch (err) {
    error.pythonToJs = err.response?.data?.error || 'Server error. Please try again.';
    console.error('Python to JavaScript error:', err);
  } finally {
    loading.pythonToJs = false;
  }
};

const convertCurl = async () => {
  if (!curlInput.curl.trim()) {
    error.curlConvert = 'Please enter cURL command';
    return;
  }

  loading.curlConvert = true;
  error.curlConvert = '';

  try {
    const response = await axios.post(`${API_BASE_URL}/curl-convert`, {
      curl: curlInput.curl,
      target: curlOutput.type
    });

    if (response.data.success) {
      curlOutput.code = response.data.code;
    } else {
      error.curlConvert = response.data.error || 'Conversion failed';
      curlOutput.code = '';
    }
  } catch (err) {
    error.curlConvert = err.response?.data?.error || 'Server error. Please try again.';
    curlOutput.code = '';
    console.error('cURL conversion error:', err);
  } finally {
    loading.curlConvert = false;
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
.developer-tools-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  transition: background 0.3s ease;
  border-radius: 20px;
}

[data-theme="dark"] .developer-tools-page {
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

[data-theme="dark"] .page-title {
  color: #f1f5f9;
  -webkit-text-fill-color: #f1f5f9;
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

/* Converter Grid */
.converter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
}

@media (max-width: 768px) {
  .converter-grid {
    grid-template-columns: 1fr;
  }
  .tool-categories{
    flex-wrap: wrap;
  }
}

/* Converter Card */
.converter-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

[data-theme="dark"] .converter-card {
  background: #1e293b;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.converter-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.1);
}

.converter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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

.converter-badges {
  display: flex;
  gap: 8px;
}

.badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge.popular {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

/* Input Group */
.input-group {
  margin-bottom: 20px;
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.input-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: #475569;
}

[data-theme="dark"] .input-label {
  color: #cbd5e1;
}

.input-buttons {
  display: flex;
  gap: 8px;
}

.input-action {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
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
  width: 12px;
  height: 12px;
}

/* Code Editor */
.code-editor {
  width: 90%;
  padding: 12px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
  transition: all 0.3s ease;
  color: #1e293b;
  min-height: 120px;
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

/* Conversion Controls */
.conversion-controls {
  display: flex;
  gap: 12px;
  margin: 20px 0;
}

.convert-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.convert-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.convert-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.convert-button.reverse {
  flex-direction: row-reverse;
}

/* Output Section */
.output-section {
  margin-top: 24px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
}

[data-theme="dark"] .output-section {
  background: #0f172a;
  border-color: #334155;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.output-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

[data-theme="dark"] .output-title {
  color: #f1f5f9;
}

.output-buttons {
  display: flex;
  gap: 8px;
}

.output-action {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.output-action:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.output-action svg {
  width: 12px;
  height: 12px;
}

.output-content {
  background: white;
  border-radius: 6px;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
}

[data-theme="dark"] .output-content {
  background: #1e293b;
}

.output-text {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  color: #1e293b;
  white-space: pre-wrap;
  word-wrap: break-word;
}

[data-theme="dark"] .output-text {
  color: #cbd5e1;
}

/* Loading Spinner */
.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error Message */
.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin: 8px 0 0 0;
  padding: 8px 12px;
  background: #fef2f2;
  border-radius: 6px;
  border-left: 3px solid #ef4444;
}

[data-theme="dark"] .error-message {
  background: #7f1d1d;
  color: #fecaca;
  border-left-color: #ef4444;
}

/* Transpiler Grid */
.transpiler-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
}

@media (max-width: 768px) {
  .transpiler-grid {
    grid-template-columns: 1fr;
  }
}

/* Transpiler Card */
.transpiler-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] .transpiler-card {
  background: #1e293b;
}

.transpiler-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.language-icons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.language-icon {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  color: white;
}

.language-icon.sql {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.language-icon.mongodb {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.language-icon.java {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.language-icon.csharp {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.language-icon.python {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}

.language-icon.javascript {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.language-icons svg {
  width: 20px;
  height: 20px;
  color: #64748b;
}

.transpiler-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

[data-theme="dark"] .transpiler-title {
  color: #f1f5f9;
}

.transpiler-actions {
  margin: 20px 0;
}

.transpile-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.transpile-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.transpile-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.transpile-button svg {
  width: 18px;
  height: 18px;
}

/* API Tools */
.api-tools {
  margin-bottom: 48px;
}

.api-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] .api-card {
  background: #1e293b;
}

.api-header {
  margin-bottom: 32px;
}

.api-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

[data-theme="dark"] .api-title {
  color: #f1f5f9;
}

.api-description {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
}

[data-theme="dark"] .api-description {
  color: #94a3b8;
}

.conversion-options {
  margin: 20px 0;
}

.option-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.option-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: #475569;
  white-space: nowrap;
}

[data-theme="dark"] .option-label {
  color: #cbd5e1;
}

.option-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.option-button {
  padding: 8px 16px;
  background: #f1f5f9;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

[data-theme="dark"] .option-button {
  background: #334155;
  border-color: #475569;
  color: #94a3b8;
}

.option-button:hover {
  border-color: #c7d2fe;
  color: #4f46e5;
}

.option-button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.convert-api-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px 20px;
  margin: 20px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.convert-api-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.editor-action{
    gap: 4px;
    padding: 7px 8px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s ease;
}
.convert-api-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.convert-api-button svg {
  width: 20px;
  height: 20px;
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

/* Responsive Design */
@media (max-width: 768px) {

  .header-content{
    align-items: flex-start;
  }
  .page-title {
    font-size: 1.5rem;
  }
  
  .tool-categories {
    padding: 0 16px;
  }
  
  .converter-card,
  .transpiler-card,
  .api-card {
    padding: 20px;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .conversion-controls {
    flex-direction: column;
  }
  
  .input-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .input-buttons {
    width: 100%;
    justify-content: flex-start;
  }
  
  .option-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .option-buttons {
    width: 100%;
  }
  
  .option-button {
    flex: 1;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .code-editor {
    width: 90%;
  }
}
</style>
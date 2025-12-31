<script setup>
import { ref, computed, onMounted } from 'vue'

const loading = ref(false)
const progress = ref(0)
const statusText = ref('')

// Conversion modes
const conversionMode = ref('html') // 'html', 'url', 'text'
const pageSize = ref('A4') // 'A4', 'Letter', 'Legal', 'A3'
const orientation = ref('portrait') // 'portrait', 'landscape'
const margins = ref('normal') // 'none', 'small', 'normal', 'large'
const includeHeader = ref(false)
const includeFooter = ref(false)
const showPageNumbers = ref(true)

// Content inputs
const htmlContent = ref(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Sample HTML Document</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .content { max-width: 800px; margin: 0 auto; }
        .highlight { background: #fff8e1; padding: 15px; border-left: 4px solid #ffc107; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #f8f9fa; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="content">
        <div class="header">
            <h1>HTML to PDF Conversion</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <h2>Introduction</h2>
        <p>This is a sample HTML document that can be converted to PDF. You can edit this HTML code in the editor to customize your PDF output.</p>
        
        <div class="highlight">
            <strong>Tip:</strong> Use CSS styles to control the appearance of your PDF. All standard CSS properties are supported.
        </div>
        
        <h2>Sample Table</h2>
        <table>
            <tr>
                <th>Feature</th>
                <th>Description</th>
                <th>Status</th>
            </tr>
            <tr>
                <td>Custom CSS</td>
                <td>Full CSS support including flexbox and grid</td>
                <td>✅ Supported</td>
            </tr>
            <tr>
                <td>Images</td>
                <td>Local and remote image embedding</td>
                <td>✅ Supported</td>
            </tr>
            <tr>
                <td>Fonts</td>
                <td>Custom font families and Google Fonts</td>
                <td>✅ Supported</td>
            </tr>
            <tr>
                <td>Page Breaks</td>
                <td>Control page breaks with CSS</td>
                <td>✅ Supported</td>
            </tr>
        </table>
        
        <h2>Features</h2>
        <ul>
            <li>Convert HTML code to PDF</li>
            <li>Convert URLs to PDF</li>
            <li>Convert plain text to formatted PDF</li>
            <li>Multiple page sizes (A4, Letter, Legal, A3)</li>
            <li>Portrait and landscape orientations</li>
            <li>Customizable margins</li>
            <li>Headers and footers</li>
            <li>Page numbering</li>
        </ul>
        
        <div class="footer">
            <p>Generated using HTML to PDF Converter | Page 1 of 1</p>
        </div>
    </div>
</body>
</html>`)

const urlContent = ref('https://example.com')
const textContent = ref(`Document Title: Sample Text Document
Date: ${new Date().toLocaleDateString()}
Author: PDF Converter

INTRODUCTION
This is a plain text document that will be converted to a nicely formatted PDF. The converter will automatically add proper formatting, margins, and styling.

MAIN CONTENT
HTML to PDF conversion is useful for:
1. Generating reports and invoices
2. Creating printable documentation
3. Archiving web content
4. Generating receipts and statements
5. Creating printable forms

KEY FEATURES:
• Automatic text formatting
• Support for bullet points and numbering
• Proper paragraph spacing
• Header and footer options
• Multiple page size options
• Customizable margins

TECHNICAL DETAILS:
The converter uses advanced PDF generation technology to ensure high-quality output. It preserves formatting and creates professional-looking documents.

CONCLUSION
This text will be converted into a well-structured PDF document with proper formatting and layout.`)

// Preview content
const previewContent = computed(() => {
  if (conversionMode.value === 'html') return htmlContent.value
  if (conversionMode.value === 'url') return `<iframe src="${urlContent.value}" style="width:100%; height:400px; border:none;"></iframe>`
  return textContent.value
})

// Templates
const templates = ref([
  { id: 'invoice', name: 'Invoice Template', category: 'business', icon: '🧾' },
  { id: 'report', name: 'Report Template', category: 'business', icon: '📊' },
  { id: 'resume', name: 'Resume Template', category: 'personal', icon: '📄' },
  { id: 'letter', name: 'Business Letter', category: 'business', icon: '✉️' },
  { id: 'receipt', name: 'Receipt Template', category: 'business', icon: '🧾' },
  { id: 'contract', name: 'Contract Template', category: 'legal', icon: '⚖️' },
  { id: 'newsletter', name: 'Newsletter', category: 'marketing', icon: '📰' },
  { id: 'manual', name: 'User Manual', category: 'documentation', icon: '📖' }
])

const selectedTemplate = ref(null)

// Page sizes with dimensions
const pageSizes = ref([
  { id: 'A4', name: 'A4', dimensions: '210 × 297 mm', common: true },
  { id: 'Letter', name: 'Letter', dimensions: '216 × 279 mm', common: true },
  { id: 'Legal', name: 'Legal', dimensions: '216 × 356 mm', common: true },
  { id: 'A3', name: 'A3', dimensions: '297 × 420 mm', common: false },
  { id: 'A5', name: 'A5', dimensions: '148 × 210 mm', common: false },
  { id: 'Executive', name: 'Executive', dimensions: '184 × 267 mm', common: false }
])

// Margin options
const marginOptions = ref([
  { id: 'none', name: 'No Margins', value: '0mm' },
  { id: 'small', name: 'Small (10mm)', value: '10mm' },
  { id: 'normal', name: 'Normal (20mm)', value: '20mm' },
  { id: 'large', name: 'Large (30mm)', value: '30mm' },
  { id: 'custom', name: 'Custom', value: 'custom' }
])

const customMargins = ref({
  top: '20',
  right: '20',
  bottom: '20',
  left: '20'
})

// Apply template
const applyTemplate = (templateId) => {
  selectedTemplate.value = templateId
  const template = templates.value.find(t => t.id === templateId)
  
  if (template) {
    // In a real app, you would load template content from a database or file
    // For demo, we'll update the HTML content with template-specific code
    switch(templateId) {
      case 'invoice':
        htmlContent.value = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice - ${new Date().getFullYear()}</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; color: #333; }
        .invoice-container { max-width: 800px; margin: 0 auto; border: 2px solid #2c3e50; border-radius: 10px; padding: 30px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .company-info h1 { color: #2c3e50; margin: 0; font-size: 28px; }
        .invoice-details { text-align: right; }
        .invoice-title { font-size: 32px; font-weight: bold; color: #3498db; margin: 0 0 10px 0; }
        .invoice-number { font-size: 18px; color: #7f8c8d; }
        .client-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
        .items-table th { background: #2c3e50; color: white; padding: 15px; text-align: left; }
        .items-table td { padding: 12px 15px; border-bottom: 1px solid #ddd; }
        .items-table tr:nth-child(even) { background: #f8f9fa; }
        .total-section { text-align: right; margin-top: 30px; }
        .total-row { display: inline-block; text-align: left; min-width: 300px; }
        .total-row div { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 16px; }
        .grand-total { font-size: 24px; font-weight: bold; color: #2c3e50; border-top: 2px solid #2c3e50; padding-top: 10px; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #7f8c8d; }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="company-info">
                <h1>Your Company Name</h1>
                <p>123 Business Street<br>City, State 12345<br>Phone: (123) 456-7890<br>Email: info@company.com</p>
            </div>
            <div class="invoice-details">
                <h2 class="invoice-title">INVOICE</h2>
                <p class="invoice-number">Invoice #: INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}001</p>
                <p>Date: ${new Date().toLocaleDateString()}<br>Due Date: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
            </div>
        </div>
        
        <div class="client-info">
            <h3>Bill To:</h3>
            <p><strong>Client Name</strong><br>Client Address<br>City, State, ZIP<br>Email: client@example.com</p>
        </div>
        
        <table class="items-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Web Development Services</td>
                    <td>10</td>
                    <td>$75.00</td>
                    <td>$750.00</td>
                </tr>
                <tr>
                    <td>Design Consultation</td>
                    <td>5</td>
                    <td>$50.00</td>
                    <td>$250.00</td>
                </tr>
                <tr>
                    <td>Hosting Setup</td>
                    <td>1</td>
                    <td>$100.00</td>
                    <td>$100.00</td>
                </tr>
            </tbody>
        </table>
        
        <div class="total-section">
            <div class="total-row">
                <div>
                    <span>Subtotal:</span>
                    <span>$1,100.00</span>
                </div>
                <div>
                    <span>Tax (10%):</span>
                    <span>$110.00</span>
                </div>
                <div class="grand-total">
                    <span>Total:</span>
                    <span>$1,210.00</span>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Thank you for your business! Please make payment within 30 days.</p>
            <p>Payment methods: Bank Transfer, Credit Card, PayPal</p>
        </div>
    </div>
</body>
</html>`
        break
      
      case 'resume':
        htmlContent.value = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Professional Resume</title>
    <style>
        body { font-family: 'Georgia', serif; margin: 0; padding: 40px; color: #333; background: #fff; }
        .resume-container { max-width: 800px; margin: 0 auto; }
        .header { border-bottom: 3px solid #2c3e50; padding-bottom: 20px; margin-bottom: 30px; }
        .name { font-size: 36px; color: #2c3e50; margin: 0; font-weight: normal; }
        .title { font-size: 20px; color: #7f8c8d; margin: 5px 0 20px 0; }
        .contact-info { display: flex; flex-wrap: wrap; gap: 20px; font-size: 14px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 22px; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; margin-bottom: 15px; }
        .job, .education { margin-bottom: 20px; }
        .job-title { font-size: 18px; font-weight: bold; color: #2c3e50; margin: 0; }
        .company { font-size: 16px; color: #7f8c8d; margin: 5px 0; }
        .duration { font-size: 14px; color: #95a5a6; font-style: italic; }
        .description { margin-top: 10px; line-height: 1.6; }
        .skills { display: flex; flex-wrap: wrap; gap: 10px; }
        .skill-tag { background: #ecf0f1; padding: 5px 15px; border-radius: 20px; font-size: 14px; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #7f8c8d; text-align: center; }
    </style>
</head>
<body>
    <div class="resume-container">
        <div class="header">
            <h1 class="name">John A. Doe</h1>
            <p class="title">Senior Web Developer & UI/UX Designer</p>
            <div class="contact-info">
                <span>📧 john.doe@example.com</span>
                <span>📱 (123) 456-7890</span>
                <span>📍 New York, NY</span>
                <span>🔗 linkedin.com/in/johndoe</span>
                <span>🐙 github.com/johndoe</span>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">Professional Summary</h2>
            <p>Experienced web developer with 8+ years of expertise in front-end development, UI/UX design, and full-stack solutions. Proven ability to lead development teams and deliver high-quality web applications. Passionate about creating user-friendly interfaces and optimizing performance.</p>
        </div>
        
        <div class="section">
            <h2 class="section-title">Work Experience</h2>
            
            <div class="job">
                <h3 class="job-title">Senior Web Developer</h3>
                <p class="company">Tech Solutions Inc. | New York, NY</p>
                <p class="duration">March 2020 - Present</p>
                <div class="description">
                    <p>Led a team of 5 developers in creating responsive web applications using Vue.js, React, and Node.js. Improved website performance by 40% through optimization techniques. Implemented CI/CD pipelines reducing deployment time by 60%.</p>
                </div>
            </div>
            
            <div class="job">
                <h3 class="job-title">Frontend Developer</h3>
                <p class="company">Creative Digital Agency | Boston, MA</p>
                <p class="duration">June 2017 - February 2020</p>
                <div class="description">
                    <p>Developed and maintained client websites using modern JavaScript frameworks. Collaborated with designers to implement pixel-perfect UI components. Conducted code reviews and mentored junior developers.</p>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">Education</h2>
            <div class="education">
                <h3 class="job-title">Master of Science in Computer Science</h3>
                <p class="company">University of Technology | Boston, MA</p>
                <p class="duration">Graduated: May 2017 | GPA: 3.8/4.0</p>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">Technical Skills</h2>
            <div class="skills">
                <span class="skill-tag">JavaScript/ES6+</span>
                <span class="skill-tag">Vue.js</span>
                <span class="skill-tag">React</span>
                <span class="skill-tag">Node.js</span>
                <span class="skill-tag">HTML5/CSS3</span>
                <span class="skill-tag">TypeScript</span>
                <span class="skill-tag">Git</span>
                <span class="skill-tag">Webpack</span>
                <span class="skill-tag">REST APIs</span>
                <span class="skill-tag">MongoDB</span>
                <span class="skill-tag">Docker</span>
                <span class="skill-tag">AWS</span>
            </div>
        </div>
        
        <div class="footer">
            <p>References available upon request</p>
        </div>
    </div>
</body>
</html>`
        break
        
      default:
        // Reset to default sample
        htmlContent.value = `<!DOCTYPE html>
<html>
<head>
    <title>${template.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #2c3e50; }
        .template-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>${template.name}</h1>
    <div class="template-info">
        <p>This is the ${template.name} template. Customize this content as needed.</p>
        <p>Category: ${template.category} ${template.icon}</p>
    </div>
    <p>Generated on: ${new Date().toLocaleDateString()}</p>
</body>
</html>`
    }
  }
}

// Convert HTML to PDF
const convertToPdf = async () => {
  if (!htmlContent.value.trim() && conversionMode.value === 'html') {
    alert('Please enter HTML content')
    return
  }
  
  if (!urlContent.value.trim() && conversionMode.value === 'url') {
    alert('Please enter a URL')
    return
  }
  
  if (!textContent.value.trim() && conversionMode.value === 'text') {
    alert('Please enter text content')
    return
  }

  loading.value = true
  progress.value = 0
  statusText.value = 'Preparing conversion...'

  // Prepare conversion data
  const conversionData = {
    mode: conversionMode.value,
    content: conversionMode.value === 'html' ? htmlContent.value : 
             conversionMode.value === 'url' ? urlContent.value : textContent.value,
    settings: {
      pageSize: pageSize.value,
      orientation: orientation.value,
      margins: margins.value === 'custom' ? customMargins.value : margins.value,
      includeHeader: includeHeader.value,
      includeFooter: includeFooter.value,
      showPageNumbers: showPageNumbers.value,
      template: selectedTemplate.value
    }
  }

  let fakeProgress = null

  try {
    fakeProgress = setInterval(() => {
      if (progress.value < 90) {
        progress.value += Math.random() * 15
        updateStatusText(progress.value)
      }
    }, 300)

    // Call conversion API
    const res = await fetch('http://192.168.18.101:3000/api/html-to-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(conversionData)
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Server error: ${res.status} - ${errorText}`)
    }

    clearInterval(fakeProgress)
    progress.value = 100
    statusText.value = 'Downloading PDF...'

    // Get filename
    const contentDisposition = res.headers.get('content-disposition')
    let fileName = 'converted_document.pdf'
    
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename="(.+)"/)
      if (matches && matches[1]) {
        fileName = matches[1]
      } else {
        // Generate filename based on content
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-')
        fileName = `html_to_pdf_${timestamp}.pdf`
      }
    }

    // Download the PDF
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    statusText.value = 'Conversion completed!'

  } catch (err) {
    statusText.value = 'Conversion failed'
    alert('Conversion failed: ' + err.message)
    console.error('Conversion error:', err)
  } finally {
    if (fakeProgress) clearInterval(fakeProgress)
    loading.value = false
    setTimeout(() => {
      progress.value = 0
      statusText.value = ''
    }, 2000)
  }
}

const updateStatusText = (progressValue) => {
  if (progressValue < 20) {
    statusText.value = 'Processing content...'
  } else if (progressValue < 40) {
    statusText.value = 'Applying styles and formatting...'
  } else if (progressValue < 60) {
    statusText.value = 'Generating PDF structure...'
  } else if (progressValue < 80) {
    statusText.value = 'Rendering pages...'
  } else {
    statusText.value = 'Finalizing document...'
  }
}

const clearContent = () => {
  if (conversionMode.value === 'html') htmlContent.value = ''
  if (conversionMode.value === 'url') urlContent.value = ''
  if (conversionMode.value === 'text') textContent.value = ''
  selectedTemplate.value = null
}

const downloadHtml = () => {
  const blob = new Blob([htmlContent.value], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'document.html'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const previewInNewWindow = () => {
  if (conversionMode.value === 'html') {
    const newWindow = window.open()
    newWindow.document.write(htmlContent.value)
    newWindow.document.close()
  } else if (conversionMode.value === 'url') {
    window.open(urlContent.value, '_blank')
  }
}

// Initialize with default content
onMounted(() => {
  // Set default values
  conversionMode.value = 'html'
})
</script>

<template>
  <div class="converter">
    <h2>HTML to PDF Converter</h2>
    <p class="subtitle">Convert HTML code, URLs, or text to professional PDF documents with custom formatting</p>

    <!-- Conversion Mode Selector -->
    <div class="mode-selector">
      <div class="mode-buttons">
        <button 
          v-for="mode in ['html', 'url', 'text']" 
          :key="mode"
          @click="conversionMode = mode"
          :class="['mode-btn', { active: conversionMode === mode }]"
        >
          <span class="mode-icon">
            {{ mode === 'html' ? '📝' : mode === 'url' ? '🌐' : '📄' }}
          </span>
          <span class="mode-text">
            {{ mode === 'html' ? 'HTML Code' : mode === 'url' ? 'Web URL' : 'Plain Text' }}
          </span>
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="content-area">
      <!-- HTML Editor -->
      <div v-if="conversionMode === 'html'" class="html-editor">
        <div class="editor-header">
          <h3>HTML Editor</h3>
          <div class="editor-actions">
            <button @click="downloadHtml" class="editor-btn" title="Download HTML">
              ⬇️ Download
            </button>
            <button @click="previewInNewWindow" class="editor-btn" title="Preview in new window">
              👁️ Preview
            </button>
            <button @click="clearContent" class="editor-btn" title="Clear editor">
              🗑️ Clear
            </button>
          </div>
        </div>
        <textarea 
          v-model="htmlContent" 
          class="html-input"
          placeholder="Enter your HTML code here..."
          spellcheck="false"
        ></textarea>
        <div class="editor-info">
          <span>Lines: {{ htmlContent.split('\n').length }}</span>
          <span>Characters: {{ htmlContent.length }}</span>
          <span>Word Count: {{ htmlContent.split(/\s+/).filter(w => w).length }}</span>
        </div>
      </div>

      <!-- URL Input -->
      <div v-if="conversionMode === 'url'" class="url-input">
        <h3>Convert Web Page to PDF</h3>
        <div class="url-wrapper">
          <input 
            type="url" 
            v-model="urlContent" 
            class="url-field"
            placeholder="https://example.com"
            pattern="https?://.+"
          />
          <button @click="previewInNewWindow" class="url-preview-btn" title="Open URL">
            🔗 Open
          </button>
        </div>
        <div class="url-tips">
          <p><strong>Tips:</strong> Enter a valid URL starting with http:// or https://</p>
          <p>The converter will fetch the web page and convert it to PDF</p>
        </div>
      </div>

      <!-- Text Input -->
      <div v-if="conversionMode === 'text'" class="text-input">
        <h3>Convert Text to PDF</h3>
        <textarea 
          v-model="textContent" 
          class="text-field"
          placeholder="Enter your text here..."
          rows="10"
        ></textarea>
        <div class="text-tips">
          <p><strong>Formatting tips:</strong></p>
          <ul>
            <li>Blank lines create paragraph breaks</li>
            <li>Lines starting with • or - create bullet points</li>
            <li>Numbered lines (1., 2., etc.) create numbered lists</li>
            <li>Lines in ALL CAPS become headings</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Templates -->
    <div class="templates-section">
      <h3>Quick Templates</h3>
      <p class="section-subtitle">Start with a pre-designed template</p>
      <div class="templates-grid">
        <button 
          v-for="template in templates" 
          :key="template.id"
          @click="applyTemplate(template.id)"
          :class="['template-btn', { selected: selectedTemplate === template.id }]"
        >
          <span class="template-icon">{{ template.icon }}</span>
          <span class="template-name">{{ template.name }}</span>
          <span class="template-category">{{ template.category }}</span>
        </button>
      </div>
    </div>

    <!-- PDF Settings -->
    <div class="settings-section">
      <h3>PDF Settings</h3>
      <div class="settings-grid">
        <!-- Page Size -->
        <div class="setting-group">
          <label for="pageSize">Page Size</label>
          <select id="pageSize" v-model="pageSize" class="setting-select">
            <option v-for="size in pageSizes.filter(s => s.common)" :key="size.id" :value="size.id">
              {{ size.name }} ({{ size.dimensions }})
            </option>
            <optgroup label="Other Sizes">
              <option v-for="size in pageSizes.filter(s => !s.common)" :key="size.id" :value="size.id">
                {{ size.name }} ({{ size.dimensions }})
              </option>
            </optgroup>
          </select>
        </div>

        <!-- Orientation -->
        <div class="setting-group">
          <label for="orientation">Orientation</label>
          <select id="orientation" v-model="orientation" class="setting-select">
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>

        <!-- Margins -->
        <div class="setting-group">
          <label for="margins">Margins</label>
          <select id="margins" v-model="margins" class="setting-select">
            <option v-for="margin in marginOptions" :key="margin.id" :value="margin.id">
              {{ margin.name }}
            </option>
          </select>
        </div>

        <!-- Custom Margins (shown when custom is selected) -->
        <div v-if="margins === 'custom'" class="custom-margins">
          <div class="margin-input">
            <label>Top</label>
            <input type="number" v-model.number="customMargins.top" min="0" max="100" /> mm
          </div>
          <div class="margin-input">
            <label>Right</label>
            <input type="number" v-model.number="customMargins.right" min="0" max="100" /> mm
          </div>
          <div class="margin-input">
            <label>Bottom</label>
            <input type="number" v-model.number="customMargins.bottom" min="0" max="100" /> mm
          </div>
          <div class="margin-input">
            <label>Left</label>
            <input type="number" v-model.number="customMargins.left" min="0" max="100" /> mm
          </div>
        </div>
      </div>

      <!-- Additional Options -->
      <div class="additional-options">
        <div class="option-group">
          <label class="option-label">
            <input type="checkbox" v-model="includeHeader" />
            <span>Include Header</span>
          </label>
          <label class="option-label">
            <input type="checkbox" v-model="includeFooter" />
            <span>Include Footer</span>
          </label>
          <label class="option-label">
            <input type="checkbox" v-model="showPageNumbers" />
            <span>Show Page Numbers</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <button @click="clearContent" class="secondary-btn">
        Clear Content
      </button>
      <button 
        class="convert-btn" 
        @click="convertToPdf" 
        :disabled="loading || 
          (conversionMode === 'html' && !htmlContent.trim()) || 
          (conversionMode === 'url' && !urlContent.trim()) || 
          (conversionMode === 'text' && !textContent.trim())"
      >
        <span v-if="loading">🔄 Converting to PDF...</span>
        <span v-else>🚀 Convert to PDF</span>
      </button>
    </div>

    <!-- Status & Progress -->
    <p v-if="loading" class="status-text">{{ statusText }}</p>
    <div v-if="loading" class="progress-wrapper">
      <div class="progress-bar" :style="{ width: progress + '%' }"></div>
    </div>

    <!-- Tips Section -->
    <div class="tips-section">
      <h4>💡 Tips for Best Results</h4>
      <div class="tips-grid">
        <div class="tip">
          <div class="tip-icon">📏</div>
          <h5>Page Size</h5>
          <p>Choose A4 for international documents or Letter for US documents.</p>
        </div>
        <div class="tip">
          <div class="tip-icon">🎨</div>
          <h5>CSS Styling</h5>
          <p>Use print CSS for better PDF results: @media print { ... }</p>
        </div>
        <div class="tip">
          <div class="tip-icon">📄</div>
          <h5>Page Breaks</h5>
          <p>Control page breaks with CSS: page-break-before: always;</p>
        </div>
        <div class="tip">
          <div class="tip-icon">🖼️</div>
          <h5>Images</h5>
          <p>Use absolute URLs for images or embed them as base64 data.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.converter {
  text-align: center;
  max-width: 1200px;
  margin: 0 auto;
}

.converter h2 {
  font-size: 24px;
  margin-bottom: 8px;
  color: #333;
}

.subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 30px;
  line-height: 1.5;
}

/* Mode Selector */
.mode-selector {
  margin-bottom: 30px;
}

.mode-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.mode-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 30px;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.mode-btn:hover {
  border-color: #8FBC5D;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(143, 188, 93, 0.1);
}

.mode-btn.active {
  border-color: #8FBC5D;
  background: #f5f9f0;
}

.mode-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.mode-text {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

/* Content Area */
.content-area {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 30px;
  text-align: left;
}

.content-area h3 {
  font-size: 18px;
  color: #333;
  margin: 0 0 20px 0;
}

/* HTML Editor */
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.editor-actions {
  display: flex;
  gap: 10px;
}

.editor-btn {
  padding: 8px 16px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.editor-btn:hover {
  background: #e9ecef;
  border-color: #8FBC5D;
}

.html-input {
  width: 100%;
  height: 400px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
  margin-bottom: 10px;
}

.html-input:focus {
  outline: none;
  border-color: #8FBC5D;
  box-shadow: 0 0 0 3px rgba(143, 188, 93, 0.1);
}

.editor-info {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #666;
}

/* URL Input */
.url-wrapper {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.url-field {
  flex: 1;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.url-field:focus {
  outline: none;
  border-color: #8FBC5D;
}

.url-preview-btn {
  padding: 12px 20px;
  background: #8FBC5D;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.url-preview-btn:hover {
  background: #7CAF4D;
}

.url-tips {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  font-size: 13px;
  color: #666;
}

.url-tips p {
  margin: 5px 0;
}

/* Text Input */
.text-field {
  width: 100%;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  margin-bottom: 20px;
}

.text-field:focus {
  outline: none;
  border-color: #8FBC5D;
}

.text-tips {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  font-size: 13px;
  color: #666;
}

.text-tips ul {
  margin: 10px 0 0 20px;
  padding: 0;
}

.text-tips li {
  margin-bottom: 5px;
}

/* Templates Section */
.templates-section {
  margin-bottom: 30px;
}

.section-subtitle {
  font-size: 13px;
  color: #666;
  margin-bottom: 20px;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.template-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 15px;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.template-btn:hover {
  border-color: #8FBC5D;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(143, 188, 93, 0.1);
}

.template-btn.selected {
  border-color: #8FBC5D;
  background: #f5f9f0;
}

.template-icon {
  font-size: 28px;
  margin-bottom: 10px;
}

.template-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.template-category {
  font-size: 11px;
  color: #666;
  background: #f8f9fa;
  padding: 3px 8px;
  border-radius: 10px;
}

/* Settings Section */
.settings-section {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 30px;
  border: 1px solid #e9ecef;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.setting-group {
  text-align: left;
}

.setting-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.setting-select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.setting-select:focus {
  outline: none;
  border-color: #8FBC5D;
}

/* Custom Margins */
.custom-margins {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.margin-input {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.margin-input label {
  font-size: 13px;
  color: #666;
}

.margin-input input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.margin-input input:focus {
  outline: none;
  border-color: #8FBC5D;
}

/* Additional Options */
.additional-options {
  border-top: 1px solid #e9ecef;
  padding-top: 20px;
}

.option-group {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.option-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #8FBC5D;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin: 30px 0;
}

.convert-btn {
  flex: 1;
  max-width: 300px;
  padding: 16px 30px;
  font-size: 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #8FBC5D, #7CAF4D);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(143, 188, 93, 0.2);
}

.convert-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(143, 188, 93, 0.3);
  background: linear-gradient(135deg, #7CAF4D, #6BA23D);
}

.convert-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.secondary-btn {
  padding: 16px 25px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 10px;
  color: #666;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-btn:hover {
  background: #f8f9fa;
  border-color: #999;
}

/* Status & Progress */
.status-text {
  margin-top: 15px;
  font-size: 14px;
  color: #8FBC5D;
  font-weight: 500;
}

.progress-wrapper {
  margin: 15px auto 30px;
  height: 10px;
  width: 100%;
  max-width: 400px;
  background: #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #8FBC5D, #A3D47A);
  transition: width 0.3s ease;
}

/* Tips Section */
.tips-section {
  background: #fff8e1;
  padding: 25px;
  border-radius: 12px;
  border: 1px solid #ffecb3;
  margin-top: 30px;
}

.tips-section h4 {
  font-size: 16px;
  color: #333;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.tip {
  text-align: center;
  padding: 15px;
}

.tip-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.tip h5 {
  font-size: 14px;
  color: #333;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.tip p {
  font-size: 13px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}
</style>
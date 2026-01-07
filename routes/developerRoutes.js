const express = require('express');
const router = express.Router();
const developerController = require('../controllers/developerController');

// Data Format Converters
router.post('/json-to-xml', developerController.jsonToXml);
router.post('/xml-to-json', developerController.xmlToJson);
router.post('/json-to-yaml', developerController.jsonToYaml);
router.post('/yaml-to-json', developerController.yamlToJson);
router.post('/csv-to-json', developerController.csvToJson);
router.post('/json-to-csv', developerController.jsonToCsv);

// Code Transpilers
router.post('/sql-to-mongo', developerController.sqlToMongo);
router.post('/java-to-csharp', developerController.javaToCSharp);
router.post('/python-to-javascript', developerController.pythonToJs);

// API Tools
router.post('/curl-convert', developerController.curlToFetch);

// JSON Utilities
router.post('/format-json', developerController.formatJson);
router.post('/minify-json', developerController.minifyJson);
router.post('/validate-json', developerController.validateJson);

// router.get('/test', (req, res) => {
//     console.log('Test endpoint hit!');
//     res.json({ 
//         success: true, 
//         message: 'API is working!',
//         timestamp: new Date().toISOString()
//     });
// });

module.exports = router;
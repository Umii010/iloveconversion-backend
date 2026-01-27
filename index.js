const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); 
const pool = require("./db");
const cookieParser = require('cookie-parser');
const userTracker = require('./middleware/userTracker');
const barcodeRoutes = require('./routes/barcodeRoutes');
const encoderRoutes = require('./routes/encoderRoutes');
const heicConverterRoutes = require('./routes/heicConverter');


const app = express();

app.use(cookieParser());
app.use(cors());
app.use(express.json());
// app.use(userTracker);

app.use(morgan(':date[clf] ":method :url" :status :response-time ms'));

const userRoutes = require('./routes/userRoutes');
const developerRoutes = require('./routes/developerRoutes');
const codeDiffRoutes = require('./routes/codeDiffRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const designRoutes = require('./routes/designRoutes');
const colorRoutes = require('./routes/colorRoutes');




app.use('/api', userRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/code-diff', codeDiffRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/barcode', barcodeRoutes);
app.use('/api/encoder', encoderRoutes);
app.use('/api/colors', colorRoutes);   
app.use('/api/design', designRoutes); 
app.use('/api/heic', heicConverterRoutes);





app.use((req, res, next) => {
  if (req.path.startsWith('/api/analytics')) {
    return next();
  }
    next();
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});


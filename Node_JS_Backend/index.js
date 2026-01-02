const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); 

const app = express();

app.use(cors());
app.use(express.json());

app.use(morgan(':date[clf] ":method :url" :status :response-time ms'));

const userRoutes = require('./routes/userRoutes');
const developerRoutes = require('./routes/developerRoutes');
const codeDiffRoutes = require('./routes/codeDiffRoutes');


app.use('/api', userRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/code-diff', codeDiffRoutes);


const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});


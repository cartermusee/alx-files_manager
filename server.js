const express = require('express');

const app = express();

const port = process.env.PORT || 5000;

const index = require('./routes/index');

app.use(express.json());
app.use('/', index);

app.listen(port, () => console.log(`My app listening on port ${port}!`));

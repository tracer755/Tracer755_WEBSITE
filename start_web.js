const express = require("express");
const helmet = require('helmet');

const app = express();
const port = 80;

app.use(helmet());
app.disable('x-powered-by');
app.use(express.static('Website'));

app.use((req, res, next) => {
  res.status(404).send("404 Sorry can't find that!")
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('500 Something broke! Sorry :(')
})

app.listen(port)
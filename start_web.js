const express = require("express");
const helmet = require('helmet');
const winston = require('winston');
const { combine, timestamp, json, printf } = winston.format;


const app = express();
const port = 8080;

const logger = winston.createLogger({
  level: 'info',
  format: combine(timestamp(), json()),
  transports: [
    new winston.transports.Console({
      format: combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.timestamp(),
        winston.format.cli()
      ),
    }),
    new winston.transports.File({
      filename: 'logs/log.txt',
      datePattern: 'YYYY-MM-DD',
      format: json(), // Use only JSON format for file logging
    }),
  ],
});

app.use((req, res, next) => {
  if(!req.url.endsWith(".jpg") && !req.url.endsWith(".png") && !req.url.endsWith(".jpeg") && !req.url.endsWith(".ico")){
    if(req.get('User-Agent') != "Statping-ng"){
      var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress 
      logger.info(`Received request for: ${req.url} | Client ${req.get('User-Agent')} | IP: ${ip}`);
    }
  }
  next();
});

app.use(helmet());
app.disable('x-powered-by');

app.use((req, res, next) => {
  res.status(404).send("404 Sorry can't find that!")
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('500 Something broke! Sorry :(')
})

app.use(express.static('Website'));

app.listen(port)
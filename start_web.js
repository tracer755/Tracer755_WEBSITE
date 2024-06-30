const express = require("express");
const helmet = require('helmet');
const winston = require('winston');
const { combine, timestamp, json, printf } = winston.format;
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 8080;
const logging = false;

const httpsServer = https.createServer({
  key: fs.readFileSync(__dirname + '/privkey.pem'),
  cert: fs.readFileSync(__dirname + '/cert.pem'),
}, app);

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
  if(logging){
    if(!req.url.endsWith(".jpg") && !req.url.endsWith(".png") && !req.url.endsWith(".jpeg") && !req.url.endsWith(".ico")){
      if(req.get('User-Agent') != "Statping-ng"){
        var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress 
        logger.info(`Received request for: ${req.url} | Client ${req.get('User-Agent')} | IP: ${ip}`);
      }
    }
  }
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);
app.disable('x-powered-by');
app.use(require('sanitize').middleware);

app.use((req, res, next) => {
  //console.log(req.url);
  const url = decodeURIComponent(req.url.replace(/^(\.\.[\/\\])+/, ''));
  //try to find the file, if not found continue if it is found serve it. Thank fuck sherlock
  let filepath = "";

  if(fs.existsSync(__dirname + "/Website" + url)){
    filepath = __dirname + "/Website" + url;
  }
  else if(fs.existsSync(__dirname + "/Website" + url + ".html")){
    filepath = __dirname + "/Website" + url + ".html";
  }
  else if(fs.existsSync(__dirname + "/Website" + url + "/index.html")){
    filepath = __dirname + "/Website" + url + "/index.html";
  }

  if(filepath != "" && filepath.includes("/Website/")){
    res.status(200).sendFile(filepath);
  }
  else{
    next();
  }
});


app.use((req, res, next) => {
  res.status(404).send("404 Sorry can't find that!")
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('500 Something broke! Sorry :(')
})



//app.listen(port)

httpsServer.listen(443, () => {console.log('HTTPS Server running on port 443');});

http.createServer(app).listen(80);
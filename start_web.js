const express = require("express");
const helmet = require('helmet');
const winston = require('winston');
const { combine, timestamp, json, printf } = winston.format;
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 8080;
const logging = false;


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

//app.use(helmet());
app.disable('x-powered-by');

async function checkFileInFolder(folder, filename) {
  const filePath = path.join(folder, filename);
  try {
    await fs.access(filePath);
    console.log('File exists');
    return true;
  } catch (error) {
    console.log('File does not exist' + filename);
    return false;
  }
}

app.use((req, res, next) => {
  console.log(req.url);
  //try to find the file, if not found continue if it is found serve it. Thank fuck sherlock
  let filepath = "";
  if(fs.existsSync(__dirname + "/Website" + req.url)){
    filepath = __dirname + "/Website" + req.url;
  }
  else{
    if(fs.existsSync(__dirname + "/Website" + req.url + ".html")){
      filepath = __dirname + "/Website" + req.url + ".html";
    }
  }

  if(filepath != ""){
    if(checkFileInFolder("./Website", filepath)){
      res.sendFile(filepath);
    }
  }
  else{
    //next();
  }
});


app.use((req, res, next) => {
  res.status(404).send("404 Sorry can't find that!")
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('500 Something broke! Sorry :(')
})



app.listen(port)

http.createServer(app).listen(80);
const cluster = require('cluster');
const http = require('http');
const cpus = require('os').cpus().length;

if (cluster.isMaster) {

  console.log('Master cluster setting up ' + cpus + ' workers...');

  for (var i = 0; i < cpus; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });

  cluster.on('online', function(worker) {
    console.log('Worker ' + worker.process.pid + ' is online');
  });

  cluster.on('exit', (worker, code, pid) => {
    console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
    console.log('Starting a new worker');
    cluster.fork();
  });
} else {
  const express = require('express');
  const bodyParser = require('body-parser');
  const app = express();
  const pubnub = require('pubnub')({
    ssl: true,
    publish_key: 'pub-c-b3952788-270c-4a33-9ba9-e13373eb99b8',
    subscribe_key: 'sub-c-eef2dadc-0f4c-11e6-a8fd-02ee2ddab7fe'
  });

  app.use(bodyParser.json());

  app.post('/', (req, res) => {
    var matches = req.body;

    publish(matches[0].id_user, matches[1]);
    publish(matches[1].id_user, matches[0]);

    res.sendStatus(200).send();
  });

  const server = app.listen(8080, () => {
    console.log('Process ' + process.pid + ' is listening to all incoming requests on ' + server.address().port);
  });

  const publish = (chnl, msg) => {
    pubnub.publish({
      channel: 'us-' + chnl,
      message: msg,
      callback: (m) => {
        //console.log(m);
      }
    });
  };
}

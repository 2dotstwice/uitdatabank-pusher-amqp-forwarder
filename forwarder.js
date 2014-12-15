var config = require(__dirname + '/config.json');

var jsonlite = require(__dirname + '/jsonlite.js');

var Pusher = require('pusher-client');
var pusher = new Pusher(config['pusher']['application_key']);

var connect = require('amqp').createConnection(config['amqp']['connection']);

console.log("subscribing to Pusher channel " + config['pusher']['channel']);
var pusher_channel = pusher.subscribe(config['pusher']['channel']);

connect.on('ready', function () {
  console.log('connect ready');
  var exchange = connect.exchange(
      config['amqp']['exchange'],
      {
        type: 'direct',
        durable: true,
        autoDelete: false
      }
  );
  console.log('declaring queue ' + config['amqp']['queue']);

  var q = connect.queue(config['amqp']['queue'], {
    passive: false,
    durable: true,
    autoDelete: false,
    exclusive: false
  });

  q.on('queueDeclareOk', function (args) {
    console.log('queue declared');
    console.log('binding queue to exchange ' + config['amqp']['exchange'] + ' with routing key solr_update');
    q.bind(config['amqp']['exchange'], 'solr_update', function() {
      pusher_channel.bind('solr_update', function (data) {
        var message = jsonlite.parse(data);

        console.log(message);

        exchange.publish('solr_update', JSON.stringify(message));
      });
    });
  });
});

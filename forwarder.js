var config = require(__dirname + '/config.json');

var jsonlite = require(__dirname + '/jsonlite.js');

var Pusher = require('pusher-client');
var pusher = new Pusher(config['pusher']['application_key']);

var connect = require('amqp').createConnection(config['amqp_connection']);

var pusher_channel = pusher.subscribe(config['pusher']['channel']);

connect.on('ready', function () {
  console.log('connect ready');
  var exchange = connect.exchange(
      'sapi2',
      {
        type: 'direct',
        durable: true,
        autoDelete: false
      }
  );
  var q = connect.queue('udb3-sapi2', {
    passive: false,
    durable: true,
    autoDelete: false,
    exclusive: false
  });
  q.on('queueDeclareOk', function (args) {
    console.log('queue declared');
    // our udb3-sapi2 queue will only receive 'solr_update' messages from
    // the 'sapi2' exchange
    q.bind('sapi2', 'solr_update');
    q.on('queueBindOk', function () {
      pusher_channel.bind('solr_update', function (data) {
        var message = jsonlite.parse(data);

        console.log(message);

        exchange.publish('solr_update', JSON.stringify(message));
      });
    });
  });
});

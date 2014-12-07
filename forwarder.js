var config = require(__dirname + '/config.json');

var Pusher = require('pusher-client');
var pusher = new Pusher(config['pusher']['application_key']);

var connect = require('amqp').createConnection(config['amqp_connection']);

var pusher_channel = pusher.subscribe('test_channel');

connect.on('ready', function() {
  console.log('connect ready');
  var exchange = connect.exchange();
  var q = connect.queue('hello');
  q.on('queueDeclareOk', function(args) {
    console.log('queue declared');
    q.bind('#');
    q.on('queueBindOk', function() {
      pusher_channel.bind('solr_update', function(data) {
        // type, e.g. 'event'
        var type = data.type;
        var cdbid = data.cdbid;
        // action performed, e.g. "CREATE_UPDATE"
        var action = data.action;

        console.log(data);
        exchange.publish('solr_update', data);
      });
    });
  });
});

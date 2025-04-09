const WebSocket = require('ws');
const net = require('net');
const fs = require('fs');

// Создаем поток для записи логов
const logStream = fs.createWriteStream('proxy.log', { flags: 'a' });

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(logMessage.trim());
    logStream.write(logMessage);
}

const wss = new WebSocket.Server({ port: 8081 });
log('WebSocket прокси запущен на порту 8081');

wss.on('connection', function connection(ws, req) {
    const clientIp = req.socket.remoteAddress;
    log(`Новое WebSocket подключение от ${clientIp}`);

    const tcpClient = new net.Socket();
    tcpClient.connect(8080, '89.169.153.146', function() {
        log(`Подключено к TCP серверу от ${clientIp}`);
    });

    ws.on('message', function incoming(message) {
        log(`Получено сообщение от клиента ${clientIp}: ${message}`);
        tcpClient.write(message);
    });

    tcpClient.on('data', function(data) {
        log(`Получены данные от TCP сервера для ${clientIp}: ${data.toString()}`);
        ws.send(data.toString());
    });

    ws.on('close', function() {
        log(`WebSocket соединение закрыто для ${clientIp}`);
        tcpClient.end();
    });

    tcpClient.on('close', function() {
        log(`TCP соединение закрыто для ${clientIp}`);
        ws.close();
    });

    tcpClient.on('error', function(error) {
        log(`Ошибка TCP соединения для ${clientIp}: ${error.message}`);
        ws.close();
    });

    ws.on('error', function(error) {
        log(`Ошибка WebSocket соединения для ${clientIp}: ${error.message}`);
        tcpClient.end();
    });
}); 
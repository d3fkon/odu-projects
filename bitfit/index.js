const express = require('express');
const app = express();
const PORT = 3939;
const expressWs = require('express-ws')(app);
const bodyParser = require('body-parser');
var aWss = expressWs.getWss('/');
const { Parser, AsyncParser } = require('json2csv');
const fs = require('fs');

const fields = ['Gx', 'Gy', 'Gz', 'Gt', 'Ax', 'Ay', 'Az', 'At'];
const opts = { fields };
const transformOpts = { highWaterMark: 8192 };

let accelCSV = '';
let gyroCSV = '';
const asyncParser = new AsyncParser(opts, transformOpts);
app.use(bodyParser.json());
app.ws('/echo', (ws, req) => {
    const parser = new Parser(opts)
    ws.on('message', (message) => {
        console.log(message.toString());
        console.log('----------')
        const data = JSON.parse(message.toString());
        if(data.accel) {
            accelCSV += data.accel.x + ',' + data.accel.y + ',' + data.accel.z + ',' + data.accel.ts + '\n';
        }
        if(data.gyro) {
            gyroCSV += data.gyro.x + ',' + data.gyro.y + ',' + data.gyro.z + ',' +  data.gyro.ts + '\n'
        }
    })
})

app.get('/', (req, res) => {
    console.log('Requeste`')
    fs.writeFile('ACCEL.csv', accelCSV, (err) => {
        console.log('Error writing Accel File')
    })
    fs.writeFile('GYRO.csv', gyroCSV, (err) => {
        console.log('Error writing Gyro File')
    })
    res.send("BRUH")
    
})

app.post('/data', (req, res) => {
    console.log(req.body)
    res.send('');
})

app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
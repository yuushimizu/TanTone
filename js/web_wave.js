(function() {
    var base64Encode = function(bytes) {
        var base64Characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        var bytesLength = bytes.length;
        var encoded = '';
        var paddingLength = 3 - bytesLength % 3;
        if (paddingLength == 3) paddingLength = 0;
        var rest = 0;
        for (var i = 0; i < bytesLength; ++i) {
            var shiftLength = (i % 3) * 2 + 2;
            encoded += base64Characters.charAt((rest << (8 - shiftLength)) | (bytes.charCodeAt(i) >> shiftLength));
            rest = bytes.charCodeAt(i) & (0xff >> (8 - shiftLength));
            if (i % 3 == 2) {
                encoded += base64Characters.charAt(rest);
                rest = 0;
            }
        }
        if (bytesLength % 3 != 0) encoded += base64Characters.charAt(rest << (paddingLength % 3 * 2));
        for (var i = 0; i < paddingLength; ++i) encoded += '=';
        return encoded;
    };
    var readOutputSettings = function() {
        var samplesPerSecond = document.getElementById('samples-per-second-field').value || 44100;
        var channels = document.getElementById('channels-field').value || 2;
        var bytesPerSample = document.getElementById('bytes-per-sample-field').value || 2;
        var milliseconds = document.getElementById('milliseconds-field').value || 1000;
        var sampleCount = Math.floor(samplesPerSecond * milliseconds / 1000);
        return {
            samplesPerSecond: samplesPerSecond,
            channels: channels,
            bytesPerSample: bytesPerSample,
            milliseconds: milliseconds,
            sampleCount: sampleCount,
            dataLength: sampleCount * bytesPerSample * channels,
            maxValue: Math.pow(255, bytesPerSample) / 2
        };
    };
    var waveFunctions = {
        'sin': function(timeRate) {
            return Math.sin(timeRate * Math.PI * 2);
        },
        'rect': function(timeRate) {
            return timeRate < 0.5 ? 1 : -1;
        },
        'saw': function(timeRate) {
            return timeRate * 2 - 1;
        }
    };
    var readWaveType = function() {
        for (var type in waveFunctions) if (document.getElementById('wave-type-' + type).checked) return type;
        return null;
    };
    var readWaveSettings = function() {
        var type = readWaveType();
        return {
            type: type,
            waveFunction: waveFunctions[type],
            rate: document.getElementById('wave-rate-field').value || 440,
            volume: document.getElementById('wave-volume-field').value || 50
        };
    };
    var bytesFromInt = function(value, bytes) {
        if (value == undefined || bytes == undefined || isNaN(value) || value == Infinity) throw 'Invalid value: ' + value + ' or bytes: ' + bytes;
        var intValue = Math.floor(value);
        var result = '';
        for (var i = 0; i < bytes; ++i) {
            byte = (intValue & (0xFF << (i * 8))) >> (i * 8);
            result += String.fromCharCode(byte);
        }
        return result;
    };
    var makeDataValues = function(outputSettings, waveSettings) {
        var values = [];
        for (var channel = 0; channel < outputSettings.channels; ++channel) values[channel] = [];
        for (var sample = 0; sample < outputSettings.sampleCount; ++sample) {
            var currentTimeForWave = sample / (outputSettings.samplesPerSecond / waveSettings.rate);
            var value = waveSettings.waveFunction(currentTimeForWave - Math.floor(currentTimeForWave)) * (outputSettings.maxValue * waveSettings.volume / 100);
            for (var channel = 0; channel < outputSettings.channels; ++channel) {
                values[channel][sample] = value;
            }
        }
        return values;
    };
    var makeDataBytes = function(outputSettings, values) {
        var bytes = '';
        for (var sample = 0; sample < outputSettings.sampleCount; ++sample) {
            for (var channel = 0; channel < outputSettings.channels; ++channel) {
                bytes += bytesFromInt(values[channel][sample], outputSettings.bytesPerSample);
            }
        }
        return bytes;
    };
    var makeWaveBytes = function(outputSettings, dataValues) {
        var bytes = '';
        var formatPartLength = 16;
        bytes += 'RIFF';
        bytes += bytesFromInt(4 + 4 + 4 + formatPartLength + 4 + outputSettings.dataLength, 4);
        bytes += 'WAVE';
        bytes += 'fmt ';
        bytes += bytesFromInt(formatPartLength, 4);
        bytes += bytesFromInt(1, 2); // format id: Linear PCM
        bytes += bytesFromInt(outputSettings.channels, 2);
        bytes += bytesFromInt(outputSettings.samplesPerSecond, 4);
        bytes += bytesFromInt(outputSettings.samplesPerSecond * outputSettings.bytesPerSample * 8 * outputSettings.channels, 4); // speed
        bytes += bytesFromInt(outputSettings.bytesPerSample * 8 * outputSettings.channels, 2); // block size
        bytes += bytesFromInt(outputSettings.bytesPerSample * 8, 2);
        bytes += 'data';
        bytes += bytesFromInt(outputSettings.dataLength, 4);
        bytes += makeDataBytes(outputSettings, dataValues);
        return bytes;
    };
    var resetContext = function(context, width, height) {
        context.beginPath();
        context.fillStyle = 'rgba(0, 0, 0, 255)';
        context.fillRect(0, 0, width, height);
        var yCenter = height / 2;
        context.beginPath();
        context.strokeStyle = 'rgba(128, 128, 128, 255)';
        context.lineWidth = 0.75;
        context.moveTo(0, yCenter);
        context.lineTo(width, yCenter);
        context.stroke();
    };
    var resetCanvas = function() {
        var canvas = document.getElementById('wave-canvas');
        var width = canvas.width;
        var height = canvas.height;
        var context = canvas.getContext('2d');
        resetContext(context, width, height);
    };
    var drawWave = function(outputSettings, dataValues) {
        var canvas = document.getElementById('wave-canvas');
        var width = canvas.width;
        var height = canvas.height;
        var context = canvas.getContext('2d');
        var yCenter = height / 2;
        resetContext(context, width, height);
        context.strokeStyle = 'rgba(0, 255, 0, 255)';
        context.lineWidth = 0.75;
        var calcY = function(x) {
            return -yCenter * dataValues[0][Math.floor(x * (outputSettings.samplesPerSecond / 10) / width)] / outputSettings.maxValue;
        };
        context.beginPath();
        for (x = 0; x < width; ++ x) {
            context.lineTo(x, yCenter + calcY(x));
        }
        context.stroke();
    };
    var makeWave = function() {
        var outputSettings = readOutputSettings();
        var waveSettings = readWaveSettings();
        var dataValues = makeDataValues(outputSettings, waveSettings);
        var bytes = makeWaveBytes(outputSettings, dataValues);
        var base64 = base64Encode(bytes);
        document.getElementById('audio').src = 'data:audio/wav;base64,' + base64;
        drawWave(outputSettings, dataValues);
        document.getElementById('wave-base64').value = base64;
    };
    document.getElementById('wave-form').onsubmit = function(event) {
        event.preventDefault();
        makeWave();
        return false;
    };
    resetCanvas();
})();

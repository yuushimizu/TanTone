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
    var childElements = function(element) {
        var result = [];
        for (var i = 0; i < element.childNodes.length; ++i) {
            var childNode = element.childNodes[i];
            if (childNode instanceof Element) result.push(childNode);
        }
        return result;
    };
    var firstChildElement = function(element) {
        for (var i = 0; i < element.childNodes.length; ++i) {
            var childNode = element.childNodes[i];
            if (childNode instanceof Element) return childNode;
        }
        return null;
    };
    var removeChild = (document.body.removeNode) ? function(parent, node) {node.removeNode(true)} : function(parent, node) {parent.removeChild(node)};
    var removeNode = function(node) {
        removeChild(node.parentNode, node);
    };
    var readOutputSettings = function() {
        var samplesPerSecond = parseInt(document.getElementById('output-samples-per-second').value);
        var channels = parseInt(document.getElementById('output-channels').value);
        var bytesPerSample = parseInt(document.getElementById('output-bytes-per-sample').value);
        var length = parseInt(document.getElementById('output-length').value);
        var sampleCount = Math.floor(samplesPerSecond * length / 1000);
        return {
            samplesPerSecond: samplesPerSecond,
            channels: channels,
            bytesPerSample: bytesPerSample,
            length: length,
            sampleCount: sampleCount,
            dataLength: sampleCount * bytesPerSample * channels,
            maxValue: Math.pow(255, bytesPerSample) / 2
        };
    };
    var nextWaveId = 0;
    var addWaveForm = function() {
        var id = nextWaveId;
        nextWaveId++;
        var clone = document.getElementById('wave-template').cloneNode(true);
        clone.innerHTML = clone.innerHTML.replace(/\:template\-wave\-id\:/g, id);
        var element = firstChildElement(clone);
        document.getElementById('wave-forms').appendChild(element);
        var nextAlternationId = 0;
        var addAlternationForm = function(nextElement) {
            var alternationId = nextAlternationId;
            nextAlternationId++;
            var clone = document.getElementById('wave-' + id + '-alternation-template').cloneNode(true);
            clone.innerHTML = clone.innerHTML.replace(/\:template\-alternation\-id\:/g, alternationId);
            var element = firstChildElement(clone);
            var parent = document.getElementById('wave-' + id + '-alternations');
            if (nextElement) {
                parent.insertBefore(element, nextElement);
            } else {
                parent.appendChild(element);
            }
            document.getElementById('wave-' + id + '-alternation-' + alternationId + '-insert').onclick = function(event) {
                addAlternationForm(element);
            };
            document.getElementById('wave-' + id + '-alternation-' + alternationId + '-delete').onclick = function(event) {
                removeNode(element);
            };
        }
        document.getElementById('wave-' + id + '-add-alternation').onclick = function(event) {
            addAlternationForm();
        };
        document.getElementById('wave-' + id + '-delete').onclick = function(event) {
            removeNode(element);
        };
        addAlternationForm();
    };
    var waveFunctions = {
        'sin': function(timeRate) {
            return Math.sin(timeRate * Math.PI * 2);
        },
        'rect': function(timeRate) {
            return timeRate < 0.5 ? 1 : -1;
        },
        'saw': function(timeRate) {
            return ((timeRate + 0.5) % 1 * 2) - 1;
        }
    };
    var reverseWaveFunction = function(f) {
        return function(timeRate) {
            return f(1 - timeRate);
        };
    };
    var waveAlternationMethods = {
        'average': function(valueForCurrent, valueForNext, timeForAlternation) {
            return valueForCurrent * (1 - timeForAlternation) + valueForNext * timeForAlternation;
        },
        'immediately': function(valueForCurrent, valueForNext, timeForAlternation) {
            return valueForCurrent;
        }
    };
    var readWaveAlternationSettings = function(waveId, alternationId) {
        if (!document.getElementById('wave-' + waveId + '-alternation-' + alternationId + '-enabled').checked) return null;
        var type = document.getElementById('wave-' + waveId + '-alternation-' + alternationId + '-type').value;
        var reversed = document.getElementById('wave-' + waveId + '-alternation-' + alternationId + '-reversed').checked;
        return {
            type: type,
            reversed: reversed,
            waveFunction: reversed ? reverseWaveFunction(waveFunctions[type]) : waveFunctions[type],
            alternationMethod: waveAlternationMethods[document.getElementById('wave-' + waveId + '-alternation-' + alternationId + '-method').value],
            start: parseInt(document.getElementById('wave-' + waveId + '-alternation-' + alternationId + '-start').value),
            rate: parseInt(document.getElementById('wave-' + waveId + '-alternation-' + alternationId + '-rate').value),
            volume: parseInt(document.getElementById('wave-' + waveId + '-alternation-' + alternationId + '-volume').value)
        };
    };
    var readWaveSettings = function(waveId) {
        var waveAlternationForms = childElements(document.getElementById('wave-' + waveId + '-alternations'));
        var alternationsSettings = [];
        for (var i = 0; i < waveAlternationForms.length; ++i) {
            var alternationId = waveAlternationForms[i].id.match(/alternation\-([^\-]+)/)[1];
            var alternationSettings = readWaveAlternationSettings(waveId, alternationId);
            if (alternationSettings) alternationsSettings.push(alternationSettings);
        }
        return {
            alternationsSettings: alternationsSettings
        };
    };
    var readWavesSettings = function() {
        var waveForms = childElements(document.getElementById('wave-forms'));
        var wavesSettings = [];
        for (var i = 0; i < waveForms.length; ++i) {
            var waveId = waveForms[i].id.match(/^wave\-([^\-]+)/)[1];
            wavesSettings.push(readWaveSettings(waveId));
        }
        return wavesSettings;
    }
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
    var emptyValues = function(outputSettings) {
        var values = [];
        for (var channel = 0; channel < outputSettings.channels; ++channel) {
            values[channel] = [];
            for (var sample = 0; sample < outputSettings.sampleCount; ++sample) {
                values[channel][sample] = 0;
            }
        }
        return values;
    };
    var makeSingleDataValues = function(outputSettings, waveSettings) {
        var values = emptyValues(outputSettings);
        var alternationsSettings = waveSettings.alternationsSettings;
        if (alternationsSettings.length <= 0) return values;
        var millisecondsToSamples = function(milliseconds) {
            return Math.floor(outputSettings.samplesPerSecond * milliseconds / 1000);
        };
        var currentTimeForWaveLoop = 0;
        var currentAlternationSettingsIndex = -1;
        var currentAlternationSettings = null;
        var nextAlternationSettings = alternationsSettings[0];
        for (var sample = 0; sample < outputSettings.sampleCount; ++sample) {
            while (nextAlternationSettings && sample >= millisecondsToSamples(nextAlternationSettings.start)) {
                currentAlternationSettings = nextAlternationSettings;
                currentAlternationSettingsIndex++;
                nextAlternationSettings = currentAlternationSettingsIndex + 1 < alternationsSettings.length ? alternationsSettings[currentAlternationSettingsIndex + 1] : null;
            }
            var valueForCurrentAlternation;
            var currentStart;
            var currentRate;
            if (!currentAlternationSettings) {
                valueForCurrentAlternation = 0;
                currentStart = 0;
                currentRate = 0;
            } else {
                valueForCurrentAlternation = currentAlternationSettings.waveFunction(currentTimeForWaveLoop) * (outputSettings.maxValue * currentAlternationSettings.volume / 100);
                currentStart = currentAlternationSettings.start;
                currentRate = currentAlternationSettings.rate;
            }
            var rate;
            var value;
            if (nextAlternationSettings && nextAlternationSettings.start > currentStart) {
                var currentTimeForAlternation = (sample - millisecondsToSamples(currentStart)) / (millisecondsToSamples(nextAlternationSettings.start) - millisecondsToSamples(currentStart));
                var valueForNextAlternation = nextAlternationSettings.waveFunction(currentTimeForWaveLoop) * (outputSettings.maxValue * nextAlternationSettings.volume / 100);
                var alternationMethod = nextAlternationSettings.alternationMethod;
                value =  alternationMethod(valueForCurrentAlternation, valueForNextAlternation, currentTimeForAlternation);
                rate = alternationMethod(currentRate, nextAlternationSettings.rate, currentTimeForAlternation);// + currentTimeForAlternation * (nextAlternationSettings.rate - currentRate);
            } else {
                value = valueForCurrentAlternation;
                rate = currentRate;
            }
            currentTimeForWaveLoop += + rate / outputSettings.samplesPerSecond;
            currentTimeForWaveLoop -= Math.floor(currentTimeForWaveLoop);
            for (var channel = 0; channel < outputSettings.channels; ++channel) {
                values[channel][sample] = value;
            }
        }
        return values;
    };
    var makeDataValues = function(outputSettings, wavesSettings) {
        var mergedValues = emptyValues(outputSettings);
        for (var i = 0; i < wavesSettings.length; ++i) {
            var values = makeSingleDataValues(outputSettings, wavesSettings[i]);
            for (var channel = 0; channel < values.length; ++values) {
                var samples = values[channel].length;
                for (var sample = 0; sample < samples; ++sample) {
                    mergedValues[channel][sample] += values[channel][sample];
                }
            }
        }
        return mergedValues;
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
        var wavesSettings = readWavesSettings();
        var dataValues = makeDataValues(outputSettings, wavesSettings);
        var bytes = makeWaveBytes(outputSettings, dataValues);
        var base64 = 'data:audio/wav;base64,' + base64Encode(bytes);
        document.getElementById('audio').src = base64;
        drawWave(outputSettings, dataValues);
        document.getElementById('wave-link').href = base64;
    };
    document.getElementById('add-wave-form').onclick = function(event) {
        addWaveForm();
        return false;
    };
    document.getElementById('form').onsubmit = function(event) {
        event.preventDefault();
        makeWave();
        return false;
    };
    addWaveForm();
    resetCanvas();
})();

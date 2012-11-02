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
    var insertToFirst = function(parent, element) {
        if (parent.childNodes.length > 0) {
            parent.insertBefore(element, parent.childNodes[0]);
        } else {
            parent.appendChild(element);
        }
    };
    var insertAfter = function(element, previousElement) {
        var parent = previousElement.parentNode;
        var length = parent.childNodes.length;
        for (var i = 0; i < length; ++i) {
            if (parent.childNodes[i] == previousElement) {
                if (i + 1 < length) {
                    parent.insertBefore(element, parent.childNodes[i + 1]);
                } else {
                    parent.appendChild(element);
                }
                return;
            }
        }
    };
    var radioValue = function(ids) {
        for (var i = 0, l = ids.length; i < l; ++i) {
            var radio = document.getElementById(ids[i]);
            if (radio.checked) return radio.value;
        }
        return null;
    };
    var readOutputSettings = function() {
        var samplesPerSecond = parseInt(document.getElementById('output-samples-per-second').value);
        var channels = parseInt(radioValue(['output-channels-1', 'output-channels-2']));
        var bytesPerSample = parseInt(radioValue(['output-bytes-per-sample-1', 'output-bytes-per-sample-2']));
        return {
            samplesPerSecond: samplesPerSecond,
            channels: channels,
            bytesPerSample: bytesPerSample,
            minValue: bytesPerSample == 1 ? 0 : -(256 * 256 / 2),
            maxValue: bytesPerSample == 1 ? 255 : (256 * 256 / 2) - 1
         };
    };
    var findWaveElement = function(waveId, elementId) {
        return document.getElementById('wave-' + waveId + '-' + elementId);
    };
    var findWaveSectionElement = function(waveId, sectionId, elementId) {
        return findWaveElement(waveId, 'section-' + sectionId + '-' + elementId);
    };
    var nextWaveId = 0;
    var addWaveForm = function() {
        var id = nextWaveId;
        nextWaveId++;
        var waveElement = function(elementId) {
            return findWaveElement(id, elementId);
        };
        var clone = document.getElementById('wave-template').cloneNode(true);
        clone.innerHTML = clone.innerHTML.replace(/\:template\-wave\-id\:/g, id);
        var element = firstChildElement(clone);
        document.getElementById('wave-forms').appendChild(element);
        var nextSectionId = 0;
        var addSectionForm = function(previousElement) {
            var sectionId = nextSectionId;
            nextSectionId++;
            var sectionElement = function(elementId) {
                return findWaveSectionElement(id, sectionId, elementId);
            };
            var clone = waveElement('section-template').cloneNode(true);
            clone.innerHTML = clone.innerHTML.replace(/\:template\-section\-id\:/g, sectionId);
            var element = firstChildElement(clone);
            var parent = waveElement('sections');
            if (previousElement) {
                insertAfter(element, previousElement);
                var previousSectionElement = function(elementId) {
                    return document.getElementById(previousElement.id + '-' + elementId);
                };
                sectionElement('length').value = 1000;
                sectionElement('type').value = previousSectionElement('type').value;
                sectionElement('reversed').checked = previousSectionElement('reversed').checked;
                sectionElement('rate').value = previousSectionElement('rate').value;
                sectionElement('volume').value = previousSectionElement('volume').value;
                sectionElement('alternation-method').value = previousSectionElement('alternation-method').value;
            } else {
                insertToFirst(parent, element);
            }
            sectionElement('insert').onclick = function(event) {
                addSectionForm(element);
            };
            sectionElement('delete').onclick = function(event) {
                removeNode(element);
            };
        }
        waveElement('add-section').onclick = function(event) {
            addSectionForm();
        };
        waveElement('delete').onclick = function(event) {
            removeNode(element);
        };
        addSectionForm();
    };
    var waveFunctions = function() {
        return {
            'none': function(timeRate) {
                return 0;
            },
            'sin': function(timeRate) {
                return Math.sin(timeRate * Math.PI * 2);
            },
            'rect': function(timeRate) {
                return timeRate < 0.5 ? 1 : -1;
            },
            'saw': function(timeRate) {
                return ((timeRate + 0.5) % 1 * 2) - 1;
            },
            'triangle': function(timeRate) {
                return ((timeRate % 0.5 < 0.25) ? timeRate % 0.5 : (0.5 - (timeRate % 0.5))) * (timeRate < 0.5 ? 1 : -1) * 4;
            },
            'random': (function() {
                var random = new MersenneTwister(0);
                return function(timeRate) {
                    return random.next() * 2 - 1;
                }
            })(),
            'gear': function(timeRate) {
                var base = Math.sin(timeRate * Math.PI * 2) * 1.5;
                if (base > 1) {
                    return 1;
                } else if (base < -1) {
                    return -1;
                } else {
                    return base;
                }
            },
            'snake-tongue': function(timeRate) {
                var sin = Math.sin(timeRate * Math.PI * 2);
                var reversedSin = Math.sin((1 - timeRate) * Math.PI * 2);
                return (sin * 2 + reversedSin * Math.abs(reversedSin) * 1.75) * 1.75;
            },
            'nazo': function(timeRate) {
                return Math.random() * 2 - 1;
            }
        };
    };
    var reverseWaveFunction = function(f) {
        return function(timeRate) {
            return f(1 - timeRate);
        };
    };
    var waveAlternationMethods = {
        'average': function(valueForCurrent, valueForNext, timeForSection) {
            return valueForCurrent * (1 - timeForSection) + valueForNext * timeForSection;
        },
        'immediately': function(valueForCurrent, valueForNext, timeForSection) {
            return valueForCurrent;
        }
    };
    var readWaveSectionSettings = function(waveId, sectionId) {
        var sectionElement = function(elementId) {
            return findWaveSectionElement(waveId, sectionId, elementId);
        };
        if (!sectionElement('enabled').checked) return null;
        var type = sectionElement('type').value;
        var reversed = sectionElement('reversed').checked;
        return {
            type: type,
            reversed: reversed,
            waveFunction: reversed ? reverseWaveFunction(waveFunctions()[type]) : waveFunctions()[type],
            alternationMethod: waveAlternationMethods[sectionElement('alternation-method').value],
            length: parseFloat(sectionElement('length').value),
            rate: parseFloat(sectionElement('rate').value),
            volume: parseFloat(sectionElement('volume').value)
        };
    };
    var readWaveSettings = function(waveId) {
        var waveSectionForms = childElements(findWaveElement(waveId, 'sections'));
        var sectionsSettings = [];
        for (var i = 0, l = waveSectionForms.length; i < l; ++i) {
            var sectionId = waveSectionForms[i].id.match(/section\-([^\-]+)/)[1];
            var sectionSettings = readWaveSectionSettings(waveId, sectionId);
            if (sectionSettings) sectionsSettings.push(sectionSettings);
        }
        return {
            sectionsSettings: sectionsSettings
        };
    };
    var readWavesSettings = function() {
        var waveForms = childElements(document.getElementById('wave-forms'));
        var wavesSettings = [];
        for (var i = 0, l = waveForms.length; i < l; ++i) {
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
            var byte = (intValue & (0xFF << (i * 8))) >> (i * 8);
            result += String.fromCharCode(byte);
        }
        return result;
    };
    var emptyWave = function(outputSettings) {
        var values = [];
        for (var channel = 0; channel < outputSettings.channels; ++channel) values[channel] = [];
        return values;
    };
    var makeSingleWave = function(outputSettings, waveSettings) {
        var values = emptyWave(outputSettings);
        var sectionsSettings = waveSettings.sectionsSettings;
        if (sectionsSettings.length <= 0) return values;
        var millisecondsToSamples = function(milliseconds) {
            return Math.floor(outputSettings.samplesPerSecond * milliseconds / 1000);
        };
        var currentTimeForWaveLoop = 0;
        var nextSectionSettings = sectionsSettings[0];
        var currentSectionStart = 0;
        var currentSectionSettingsIndex = -1;
        var currentSectionSettings = {
            type: 'none',
            reversed: false,
            waveFunction: waveFunctions()['none'],
            alternationMethod: waveAlternationMethods['immediately'],
            length: 0,
            rate: 1,
            volume: 0
        };
        var sample = 0;
        while (true) {
            var currentSectionEnd = currentSectionStart + millisecondsToSamples(currentSectionSettings.length);
            while (sample >= currentSectionEnd) {
                currentSectionStart = currentSectionEnd;
                currentSectionSettings = nextSectionSettings;
                currentSectionSettingsIndex++;
                currentSectionEnd = currentSectionStart + millisecondsToSamples(currentSectionSettings.length);
                if (currentSectionSettingsIndex >= sectionsSettings.length) return values;
                if (currentSectionSettingsIndex + 1 < sectionsSettings.length) {
                    nextSectionSettings = sectionsSettings[currentSectionSettingsIndex + 1];
                } else {
                    nextSectionSettings = {
                        type: 'none',
                        reversed: false,
                        waveFunction: waveFunctions()['none'],
                        alternationMethod: waveAlternationMethods['immediately'],
                        length: 0,
                        rate: 1,
                        volume: 0
                    };
                }
            }
            var valueForCurrentSection = currentSectionSettings.waveFunction(currentTimeForWaveLoop) * currentSectionSettings.volume / 100;
            var valueForNextSection = nextSectionSettings.waveFunction(currentTimeForWaveLoop) * nextSectionSettings.volume / 100;
            var currentTimeForSection = (sample - currentSectionStart) / millisecondsToSamples(currentSectionSettings.length);
            var value =  nextSectionSettings.alternationMethod(valueForCurrentSection, valueForNextSection, currentTimeForSection);
            for (var channel = 0; channel < outputSettings.channels; ++channel) {
                values[channel][sample] = value;
            }
            var rate = nextSectionSettings.alternationMethod(currentSectionSettings.rate, nextSectionSettings.rate, currentTimeForSection);
            currentTimeForWaveLoop += + rate / outputSettings.samplesPerSecond;
            currentTimeForWaveLoop -= Math.floor(currentTimeForWaveLoop);
            sample++;
        }
        return values;
    };
    var makeMergedWave = function(outputSettings, wavesSettings) {
        var mergedValues = emptyWave(outputSettings);
        for (var i = 0; i < wavesSettings.length; ++i) {
            var values = makeSingleWave(outputSettings, wavesSettings[i]);
            for (var channel = 0; channel < values.length; ++channel) {
                var samples = values[channel].length;
                for (var sample = 0; sample < samples; ++sample) {
                    mergedValues[channel][sample] = (mergedValues[channel][sample] || 0) + values[channel][sample];
                }
            }
        }
        return mergedValues;
    };
    var makeDataBytes = function(outputSettings, wave) {
        var bytes = '';
        var valueRange = outputSettings.maxValue - outputSettings.minValue;
        var base = Math.ceil(outputSettings.minValue + valueRange / 2);
        var sampleCount = wave[0].length;
        for (var sample = 0; sample < sampleCount; ++sample) {
            for (var channel = 0; channel < outputSettings.channels; ++channel) {
                var value = base + Math.floor(wave[channel][sample] * valueRange);
                if (value > outputSettings.maxValue) {
                    value = outputSettings.maxValue;
                } else if (value < outputSettings.minValue) {
                    value = outputSettings.minValue;
                }
                bytes += bytesFromInt(value, outputSettings.bytesPerSample);
            }
        }
        return bytes;
    };
    var makeWaveBytes = function(outputSettings, wave) {
        var bytes = '';
        var formatPartLength = 16;
        var dataLength = wave[0].length * outputSettings.channels * outputSettings.bytesPerSample;
        bytes += 'RIFF';
        bytes += bytesFromInt(4 + 4 + 4 + formatPartLength + 4 + dataLength, 4);
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
        bytes += bytesFromInt(dataLength, 4);
        bytes += makeDataBytes(outputSettings, wave);
        return bytes;
    };
    var resetCanvas = function(canvas) {
        var width = canvas.width;
        var height = canvas.height;
        var context = canvas.getContext('2d');
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
    var resetCanvases = function() {
        resetCanvas(document.getElementById('wave-canvas'));
        resetCanvas(document.getElementById('wave-canvas-scaled'));
    };
    var drawFullWave = function(outputSettings, wave) {
        var canvas = document.getElementById('wave-canvas');
        var width = canvas.width;
        var height = canvas.height;
        var context = canvas.getContext('2d');
        context.strokeStyle = 'rgba(0, 255, 0, 255)';
        context.lineWidth = 0.75;
        context.beginPath();
        var yCenter = height / 2;
        var sampleCount = wave[0].length;
        for (var x = 0; x < width; ++x) {
            var startSample = Math.floor(x * sampleCount / width);
            var endSample = Math.min(Math.floor((x + 1) * sampleCount / width), sampleCount);
            var max = undefined;
            var min = undefined;
            for (var sample = startSample; sample < endSample; ++sample) {
                var value = wave[0][sample];
                if (max === undefined || max < value) max = value;
                if (min === undefined || min > value) min = value;
            }
            if (max !== undefined) context.lineTo(x, yCenter - yCenter * max);
            if (min !== undefined) context.lineTo(x, yCenter - yCenter * min);
        }
        context.stroke();
        var length = sampleCount * 1000 / outputSettings.samplesPerSecond;
        for (var current = 100; current < length; current += 100) {
            context.strokeStyle = current % 500 == 0 ? 'rgba(224, 224, 224, 255)' : 'rgba(128, 128, 128, 255)';
            context.beginPath();
            context.moveTo(width * current / length, 0);
            context.lineTo(width * current / length, height);
            context.stroke();
        }
    };
    var drawScaledWave = function(outputSettings, wave, middleMillisecond) {
        var canvas = document.getElementById('wave-canvas-scaled');
        var width = canvas.width;
        var height = canvas.height;
        var context = canvas.getContext('2d');
        var yCenter = height / 2;
        context.strokeStyle = 'rgba(0, 255, 0, 255)';
        context.lineWidth = 0.75;
        var length = wave[0].length * 1000 / outputSettings.samplesPerSecond;
        var offsetSamples = middleMillisecond < 50 ? 0 : (wave[0].length * Math.min(middleMillisecond - 50, length - 100) / length);
        var calcY = function(x) {
            return yCenter - yCenter * wave[0][Math.floor(offsetSamples + (outputSettings.samplesPerSecond / 10) * x / width)];
        };
        context.beginPath();
        for (var x = 0; x < width; ++ x) {
            context.lineTo(x, calcY(x));
        }
        context.stroke();
    };
    var drawWave = function(outputSettings, wave) {
        resetCanvases();
        drawFullWave(outputSettings, wave);
        drawScaledWave(outputSettings, wave, 0);
        var scaledCanvas = document.getElementById('wave-canvas-scaled');
        var canvas = document.getElementById('wave-canvas');
        var length = wave[0].length * 1000 / outputSettings.samplesPerSecond;
        var listener = function(event) {
            resetCanvas(scaledCanvas);
            drawScaledWave(outputSettings, wave, length * event.offsetX / canvas.width);
        };
        canvas.onmousemove = listener;
    };
    var makeWave = function() {
        var outputSettings = readOutputSettings();
        var wavesSettings = readWavesSettings();
        var wave = makeMergedWave(outputSettings, wavesSettings);
        var bytes = makeWaveBytes(outputSettings, wave);
        var base64 = 'data:audio/wav;base64,' + base64Encode(bytes);
        document.getElementById('audio').src = base64;
        drawWave(outputSettings, wave);
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
    resetCanvases();
})();

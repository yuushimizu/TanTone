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
        var length = parseFloat(document.getElementById('output-length').value);
        var sampleCount = Math.floor(samplesPerSecond * length / 1000);
        return {
            samplesPerSecond: samplesPerSecond,
            channels: channels,
            bytesPerSample: bytesPerSample,
            length: length,
            sampleCount: sampleCount,
            dataLength: sampleCount * bytesPerSample * channels,
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
                sectionElement('start').value = previousSectionElement('start').value;
                sectionElement('type').value = previousSectionElement('type').value;
                sectionElement('reversed').checked = previousSectionElement('reversed').checked;
                sectionElement('rate').value = previousSectionElement('rate').value;
                sectionElement('volume').value = previousSectionElement('volume').value;
                sectionElement('alternation-method').value = previousSectionElement('alternation-method').value;
            } else {
                parent.appendChild(element);
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
    var waveFunctions = {
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
        'split-tongue': function(timeRate) {
            var sin = Math.sin(timeRate * Math.PI * 2);
            var reversedSin = Math.sin((1 - timeRate) * Math.PI * 2);
            return (sin * 2 + reversedSin * Math.abs(reversedSin) * 1.75) * 1.75;
        },
        'nazo': function(timeRate) {
            return Math.random() * 2 - 1;
        }
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
            waveFunction: reversed ? reverseWaveFunction(waveFunctions[type]) : waveFunctions[type],
            alternationMethod: waveAlternationMethods[sectionElement('alternation-method').value],
            start: parseFloat(sectionElement('start').value),
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
        for (var channel = 0; channel < outputSettings.channels; ++channel) {
            values[channel] = [];
            for (var sample = 0; sample < outputSettings.sampleCount; ++sample) {
                values[channel][sample] = 0;
            }
        }
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
        var currentSectionSettingsIndex = -1;
        var currentSectionSettings = null;
        var nextSectionSettings = sectionsSettings[0];
        for (var sample = 0; sample < outputSettings.sampleCount; ++sample) {
            while (nextSectionSettings && sample >= millisecondsToSamples(nextSectionSettings.start)) {
                currentSectionSettings = nextSectionSettings;
                currentSectionSettingsIndex++;
                nextSectionSettings = currentSectionSettingsIndex + 1 < sectionsSettings.length ? sectionsSettings[currentSectionSettingsIndex + 1] : null;
            }
            var valueForCurrentSection;
            var currentStart;
            var currentRate;
            if (!currentSectionSettings) {
                valueForCurrentSection = 0;
                currentStart = 0;
                currentRate = 0;
            } else {
                valueForCurrentSection = currentSectionSettings.waveFunction(currentTimeForWaveLoop) * currentSectionSettings.volume / 100;
                currentStart = currentSectionSettings.start;
                currentRate = currentSectionSettings.rate;
            }
            var rate;
            var value;
            if (nextSectionSettings && nextSectionSettings.start > currentStart) {
                var currentTimeForSection = (sample - millisecondsToSamples(currentStart)) / (millisecondsToSamples(nextSectionSettings.start) - millisecondsToSamples(currentStart));
                var valueForNextSection = nextSectionSettings.waveFunction(currentTimeForWaveLoop) * nextSectionSettings.volume / 100;
                var alternationMethod = nextSectionSettings.alternationMethod;
                value =  alternationMethod(valueForCurrentSection, valueForNextSection, currentTimeForSection);
                rate = alternationMethod(currentRate, nextSectionSettings.rate, currentTimeForSection);
            } else {
                value = valueForCurrentSection;
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
    var makeMergedWave = function(outputSettings, wavesSettings) {
        var mergedValues = emptyWave(outputSettings);
        for (var i = 0; i < wavesSettings.length; ++i) {
            var values = makeSingleWave(outputSettings, wavesSettings[i]);
            for (var channel = 0; channel < values.length; ++channel) {
                var samples = values[channel].length;
                for (var sample = 0; sample < samples; ++sample) {
                    mergedValues[channel][sample] += values[channel][sample];
                }
            }
        }
        return mergedValues;
    };
    var makeDataBytes = function(outputSettings, wave) {
        var bytes = '';
        var valueRange = outputSettings.maxValue - outputSettings.minValue;
        var base = Math.ceil(outputSettings.minValue + valueRange / 2);
        for (var sample = 0; sample < outputSettings.sampleCount; ++sample) {
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
        bytes += makeDataBytes(outputSettings, wave);
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
    var drawWave = function(outputSettings, wave) {
        var canvas = document.getElementById('wave-canvas');
        var width = canvas.width;
        var height = canvas.height;
        var context = canvas.getContext('2d');
        var yCenter = height / 2;
        resetContext(context, width, height);
        context.strokeStyle = 'rgba(0, 255, 0, 255)';
        context.lineWidth = 0.75;
        var calcY = function(x) {
            return -yCenter * wave[0][Math.floor(x * (outputSettings.samplesPerSecond / 10) / width)];
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
    resetCanvas();
})();

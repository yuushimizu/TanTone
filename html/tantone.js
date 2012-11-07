(function() {
    var floatModulo = function(n, m) {
        return n - Math.floor(n / m) * m;
    };
    var copyObject = function(object) {
        var result = {};
        for (var key in object) result[key] = object[key];
        return result;
    }
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
                sectionElement('length').value = 0;
                var fieldIds = ['type', 'reversed', 'frequency', 'volume-0', 'volume-1', 'alternation', 'frequency-modulation-enabled', 'frequency-modulation-type', 'frequency-modulation-reversed', 'frequency-modulation-frequency', 'frequency-modulation-volume', 'volume-modulation-enabled', 'volume-modulation-type', 'volume-modulation-reversed', 'volume-modulation-frequency', 'volume-modulation-volume'];
                for (var i = 0, l = fieldIds.length; i < l; ++i) {
                    var fieldId = fieldIds[i];
                    sectionElement(fieldId).value = previousSectionElement(fieldId).value;
                    sectionElement(fieldId).checked = previousSectionElement(fieldId).checked;
                }
                sectionElement('frequency-modulation-form').style.display = sectionElement('frequency-modulation-enabled').checked ? 'block' : 'none';
                sectionElement('volume-modulation-form').style.display = sectionElement('volume-modulation-enabled').checked ? 'block' : 'none';
            } else {
                insertToFirst(parent, element);
            }
            sectionElement('insert').onclick = function(event) {
                addSectionForm(element);
            };
            sectionElement('delete').onclick = function(event) {
                removeNode(element);
            };
            var frequencyModulationEnabledListener = function() {
                sectionElement('frequency-modulation-form').style.display = this.checked ? 'block' : 'none';
            };
            sectionElement('frequency-modulation-enabled').onclick = frequencyModulationEnabledListener;
            sectionElement('frequency-modulation-enabled').onchange = frequencyModulationEnabledListener;
            var volumeModulationEnabledListener = function() {
                sectionElement('volume-modulation-form').style.display = this.checked ? 'block' : 'none';
            };
            sectionElement('volume-modulation-enabled').onclick = volumeModulationEnabledListener;
            sectionElement('volume-modulation-enabled').onchange = volumeModulationEnabledListener;
        }
        waveElement('add-section').onclick = function(event) {
            addSectionForm();
        };
        waveElement('delete').onclick = function(event) {
            removeNode(element);
        };
        addSectionForm();
    };
    var waveFunction = function(type) {
        var randomWave = function(seed) {
            var random = new MersenneTwister(seed);
            var current = random.next() * 2 - 1;
            var next = random.next() * 2 - 1;
            var lastTimeRate = 0;
            return function(timeRate) {
                var diff = floatModulo(timeRate > lastTimeRate ? timeRate - lastTimeRate : timeRate + (1 - lastTimeRate), 1);
                if (diff > 0.01) {
                    current = next;
                    next = random.next() * 2 - 1;
                    lastTimeRate = timeRate;
                }
                return current + (next - current) * diff;
            };
        };
        switch (type) {
        case 'none':
            return function(timeRate) {
                return 0;
            };
        case 'sin':
            return function(timeRate) {
                return Math.sin(timeRate * Math.PI * 2);
            };
        case 'rect':
            return function(timeRate) {
                return timeRate < 0.5 ? 1 : -1;
            };
        case 'pulse-12.5':
            return function(timeRate) {
                return timeRate < 0.125 ? 1 : -1;
            };
        case 'pulse-25':
            return function(timeRate) {
                return timeRate < 0.25 ? 1 : -1;
            };
        case 'pulse-1/3':
            return function(timeRate) {
                return timeRate < (1 / 3) ? 1 : -1;
            };
        case 'saw':
            return function(timeRate) {
                return (floatModulo(timeRate + 0.5, 1) * 2) - 1;
            };
        case 'triangle':
            return function(timeRate) {
                var rateInHalf = floatModulo(timeRate, 0.5);
                return ((rateInHalf < 0.25) ? rateInHalf : (0.5 - rateInHalf)) * (timeRate < 0.5 ? 1 : -1) * 4;
            };
        case 'random-0':
            return randomWave(0);
        case 'random-72':
            return randomWave(72);
        case 'random-428':
            return randomWave(428);
        case 'random-765':
            return randomWave(765);
        case 'gear':
            return function(timeRate) {
                var base = Math.sin(timeRate * Math.PI * 2) * 1.5;
                if (base > 1) {
                    return 1;
                } else if (base < -1) {
                    return -1;
                } else {
                    return base;
                }
            };
        case 'snake-tongue':
            return function(timeRate) {
                var sin = Math.sin(timeRate * Math.PI * 2);
                var reversedSin = Math.sin((1 - timeRate) * Math.PI * 2);
                return (sin * 2 + reversedSin * Math.abs(reversedSin) * 1.75) * 1.75;
            };
        case 'stair':
            return function(timeRate) {
                return Math.floor(floatModulo(timeRate - 0.5, 1) / 0.2) * 0.5 - 1;
            };
        }
    };
    var reverseWaveFunction = function(f) {
        return function(timeRate) {
            return -f(timeRate);
        };
    };
    var offsetWaveFunction = function(f, offset) {
        return function(timeRate) {
            return f(floatModulo(timeRate + offset, 1));
        };
    };
    var waveAlternationFunctions = {
        'keep': function(valueForCurrent, valueForNext, timeForSection) {
            return valueForCurrent;
        },
        'average': function(valueForCurrent, valueForNext, timeForSection) {
            return valueForCurrent * (1 - timeForSection) + valueForNext * timeForSection;
        }
    };
    var readWaveSection = function(waveId, sectionId) {
        var sectionElement = function(elementId) {
            return findWaveSectionElement(waveId, sectionId, elementId);
        };
        if (!sectionElement('enabled').checked) return null;
        var type = sectionElement('type').value;
        var reversed = sectionElement('reversed').checked;
        var offset = sectionElement('offset').value / 100;
        var frequencyModulationType = sectionElement('frequency-modulation-type').value;
        var frequencyModulationReversed = sectionElement('frequency-modulation-reversed').checked;
        var frequencyModulationOffset = sectionElement('frequency-modulation-offset').value / 100;
        var volumeModulationType = sectionElement('volume-modulation-type').value;
        var volumeModulationReversed = sectionElement('volume-modulation-reversed').checked;
        var volumeModulationOffset = sectionElement('volume-modulation-offset').value / 100;
        return {
            waveFunction: offsetWaveFunction(reversed ? reverseWaveFunction(waveFunction(type)) : waveFunction(type), offset),
            alternationFunction: waveAlternationFunctions[sectionElement('alternation').value],
            length: parseFloat(sectionElement('length').value),
            frequency: parseFloat(sectionElement('frequency').value),
            volumes: [parseFloat(sectionElement('volume-0').value), parseFloat(sectionElement('volume-1').value)],
            frequencyModulation : {
                enabled: sectionElement('frequency-modulation-enabled').checked,
                waveFunction: offsetWaveFunction(frequencyModulationReversed ? reverseWaveFunction(waveFunction(frequencyModulationType)) : waveFunction(frequencyModulationType), frequencyModulationOffset),
                frequency: parseFloat(sectionElement('frequency-modulation-frequency').value),
                volume : parseFloat(sectionElement('frequency-modulation-volume').value)
            },
            volumeModulation : {
                enabled: sectionElement('volume-modulation-enabled').checked,
                waveFunction: offsetWaveFunction(volumeModulationReversed ? reverseWaveFunction(waveFunction(volumeModulationType)) : waveFunction(volumeModulationType), volumeModulationOffset),
                frequency: parseFloat(sectionElement('volume-modulation-frequency').value),
                volume : parseFloat(sectionElement('volume-modulation-volume').value)
            }
        };
    };
    var readWave = function(waveId) {
        var waveSectionForms = childElements(findWaveElement(waveId, 'sections'));
        var sections = [];
        for (var i = 0, l = waveSectionForms.length; i < l; ++i) {
            var sectionId = waveSectionForms[i].id.match(/section\-([^\-]+)/)[1];
            var section = readWaveSection(waveId, sectionId);
            if (section) sections.push(section);
        }
        return {
            sections: sections
        };
    };
    var readWaves = function() {
        var waveForms = childElements(document.getElementById('wave-forms'));
        var waves = [];
        for (var i = 0, l = waveForms.length; i < l; ++i) {
            var waveId = waveForms[i].id.match(/^wave\-([^\-]+)/)[1];
            waves.push(readWave(waveId));
        }
        return waves;
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
    var waveModulator = function(modulation) {
        var timeInLoop = 0;
        var currentValue = modulation.waveFunction(0);
        return {
            modulate: function(source) {
                if (!modulation.enabled) return source;
                return source + source * currentValue * modulation.volume / 100;
            },
            addMilliseconds: function(milliseconds) {
                timeInLoop = floatModulo(timeInLoop + modulation.frequency * milliseconds / 1000, 1);
                if (modulation.enabled) currentValue = modulation.waveFunction(timeInLoop);
            }
        };
    };
    var sampleSingleWave = function(outputSettings, wave) {
        var values = emptyWave(outputSettings);
        var sections = wave.sections;
        if (sections.length <= 0) return values;
        var millisecondsToSamples = function(milliseconds) {
            return Math.floor(outputSettings.samplesPerSecond * milliseconds / 1000);
        };
        var currentTimeForWaveLoop = 0;
        var emptyVolumes = [];
        for (var channel = 0; channel < outputSettings.channels; ++channel) emptyVolumes[channel] = 0;
        var dummySection = copyObject(sections[sections.length - 1]);
        dummySection.waveFunction = waveFunction('none');
        dummySection.length = 0;
        dummySection.volumes = emptyVolumes;
        var currentSection = sections[0];
        var currentFrequencyModulator = waveModulator(currentSection.frequencyModulation);
        var currentVolumeModulator = waveModulator(currentSection.volumeModulation);
        var currentSectionStart = 0;
        var currentSectionIndex = 0;
        var nextSection = sections.length > 1 ? sections[1] : dummySection;
        var nextFrequencyModulator = waveModulator(nextSection.frequencyModulation);
        var nextVolumeModulator = waveModulator(nextSection.volumeModulation);
        var sample = 0;
        while (true) {
            var currentSectionEnd = currentSectionStart + millisecondsToSamples(currentSection.length);
            while (sample >= currentSectionEnd) {
                currentSectionStart = currentSectionEnd;
                currentSection = nextSection;
                currentFrequencyModulator = nextFrequencyModulator;
                currentVolumeModulator = nextVolumeModulator;
                currentSectionIndex++;
                currentSectionEnd = currentSectionStart + millisecondsToSamples(currentSection.length);
                if (currentSectionIndex >= sections.length) return values;
                if (currentSectionIndex + 1 < sections.length) {
                    nextSection = sections[currentSectionIndex + 1];
                } else {
                    nextSection = dummySection;
                }
                nextFrequencyModulator = waveModulator(nextSection.frequencyModulation);
                
                nextVolumeModulator = waveModulator(nextSection.volumeModulation);
            }
            var baseValueForCurrentSection = currentSection.waveFunction(currentTimeForWaveLoop);
            var baseValueForNextSection = nextSection.waveFunction(currentTimeForWaveLoop);
            var currentTimeForSection = (sample - currentSectionStart) / millisecondsToSamples(currentSection.length);
            for (var channel = 0; channel < outputSettings.channels; ++channel) {
                var currentVolume = currentVolumeModulator.modulate(currentSection.volumes[channel]);
                var valueForCurrentSection = baseValueForCurrentSection * currentVolume / 100;
                var nextVolume = nextVolumeModulator.modulate(nextSection.volumes[channel]);
                var valueForNextSection = baseValueForNextSection * nextVolume / 100;
                var value = currentSection.alternationFunction(valueForCurrentSection, valueForNextSection, currentTimeForSection);
                values[channel][sample] = value;
            }
            currentVolumeModulator.addMilliseconds(1000 / outputSettings.samplesPerSecond);
            nextVolumeModulator.addMilliseconds(1000 / outputSettings.samplesPerSecond);
            var currentFrequency = currentFrequencyModulator.modulate(currentSection.frequency);
            currentFrequencyModulator.addMilliseconds(1000 / outputSettings.samplesPerSecond);
            var nextFrequency = nextFrequencyModulator.modulate(nextSection.frequency);
            nextFrequencyModulator.addMilliseconds(1000 / outputSettings.samplesPerSecond);
            var frequency = currentSection.alternationFunction(currentFrequency, nextFrequency, currentTimeForSection);
            currentTimeForWaveLoop = floatModulo(currentTimeForWaveLoop + frequency / outputSettings.samplesPerSecond, 1);
            sample++;
        }
        return values;
    };
    var sampleMergedWave = function(outputSettings, waves) {
        var mergedValues = emptyWave(outputSettings);
        for (var i = 0; i < waves.length; ++i) {
            var values = sampleSingleWave(outputSettings, waves[i]);
            for (var channel = 0; channel < values.length; ++channel) {
                var samples = values[channel].length;
                for (var sample = 0; sample < samples; ++sample) {
                    mergedValues[channel][sample] = (mergedValues[channel][sample] || 0) + values[channel][sample];
                }
            }
        }
        return mergedValues;
    };
    var makeDataBytes = function(outputSettings, samples) {
        var bytes = '';
        var valueRange = outputSettings.maxValue - outputSettings.minValue;
        var base = Math.ceil(outputSettings.minValue + valueRange / 2);
        var sampleCount = samples[0].length;
        for (var sample = 0; sample < sampleCount; ++sample) {
            for (var channel = 0; channel < outputSettings.channels; ++channel) {
                var value = base + Math.floor(samples[channel][sample] * valueRange);
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
    var makeWaveFileBytes = function(outputSettings, samples) {
        var bytes = '';
        var formatPartLength = 16;
        var dataLength = samples[0].length * outputSettings.channels * outputSettings.bytesPerSample;
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
        bytes += makeDataBytes(outputSettings, samples);
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
    var drawSingleChannelFullWave = function(context, outputSettings, samples) {
        var width = context.canvas.width;
        var height = context.canvas.height;
        var yCenter = height / 2;
        context.beginPath();
        context.moveTo(0, yCenter);
        var sampleCount = samples.length;
        for (var x = 0; x < width; ++x) {
            var startSample = Math.floor(x * sampleCount / width);
            var endSample = Math.min(Math.floor((x + 1) * sampleCount / width), sampleCount);
            var max = undefined;
            var min = undefined;
            for (var sample = startSample; sample < endSample; ++sample) {
                var value = samples[sample];
                if (max === undefined || max < value) max = value;
                if (min === undefined || min > value) min = value;
            }
            if (max !== undefined) context.lineTo(x, yCenter - yCenter * max);
            if (min !== undefined) context.lineTo(x, yCenter - yCenter * min);
        }
        context.stroke();
    };
    var waveStrokeStyles = ['rgba(0, 255, 0, 128)', 'rgba(0, 128, 255, 128)'];
    var drawFullWave = function(outputSettings, samples) {
        var canvas = document.getElementById('wave-canvas');
        var width = canvas.width;
        var height = canvas.height;
        var context = canvas.getContext('2d');
        context.lineWidth = 0.75;
        for (var channel = 0; channel < outputSettings.channels; ++channel) {
            context.strokeStyle = waveStrokeStyles[channel];
            drawSingleChannelFullWave(context, outputSettings, samples[channel]);
        }
        var length = samples.length * 1000 / outputSettings.samplesPerSecond;
        for (var current = 100; current < length; current += 100) {
            context.strokeStyle = current % 500 == 0 ? 'rgba(224, 224, 224, 255)' : 'rgba(128, 128, 128, 255)';
            context.beginPath();
            context.moveTo(width * current / length, 0);
            context.lineTo(width * current / length, height);
            context.stroke();
        }
    };
    var drawSingleChannelScaledWave = function(context, outputSettings, samples, middleMillisecond) {
        var width = context.canvas.width;
        var height = context.canvas.height;
        var yCenter = height / 2;
        var lengthMilliseconds = samples.length * 1000 / outputSettings.samplesPerSecond;
        var offsetSamples = middleMillisecond < 50 ? 0 : (samples.length * Math.min(middleMillisecond - 50, lengthMilliseconds - 100) / lengthMilliseconds);
        var calcY = function(x) {
            return yCenter - yCenter * samples[Math.floor(offsetSamples + (outputSettings.samplesPerSecond / 10) * x / width)];
        };
        context.beginPath();
        for (var x = 0; x < width; ++ x) {
            context.lineTo(x, calcY(x));
        }
        context.stroke();
    };
    var drawScaledWave = function(outputSettings, samples, middleMillisecond) {
        var canvas = document.getElementById('wave-canvas-scaled');
        var context = canvas.getContext('2d');
        context.lineWidth = 0.75;
        for (var channel = 0; channel < outputSettings.channels; ++channel) {
            context.strokeStyle = waveStrokeStyles[channel];
            drawSingleChannelScaledWave(context, outputSettings, samples[channel], middleMillisecond);
        }
        context.fillStyle = 'rgba(255, 255, 255, 255)';
        context.textBaseline = 'top';
        context.font = Math.floor(canvas.height * 0.1) + 'px';
        var startMillisecond = Math.floor(middleMillisecond < 50 ? 0 : Math.min(middleMillisecond - 50, samples[0].length * 1000 / outputSettings.samplesPerSecond - 100));
        var textMargin = canvas.width * 0.005;
        context.textAlign = 'left';
        context.fillText(startMillisecond + ' ms', textMargin, textMargin);
        context.textAlign = 'right';
        context.fillText((startMillisecond + 100) + ' ms', canvas.width - textMargin, textMargin);
    };
    var drawWave = function(outputSettings, samples) {
        resetCanvases();
        drawFullWave(outputSettings, samples);
        drawScaledWave(outputSettings, samples, 0);
        var scaledCanvas = document.getElementById('wave-canvas-scaled');
        var canvas = document.getElementById('wave-canvas');
        var length = samples[0].length * 1000 / outputSettings.samplesPerSecond;
        var listener = function(event) {
            resetCanvas(scaledCanvas);
            drawScaledWave(outputSettings, samples, length * event.offsetX / this.width);
        };
        canvas.onmousemove = listener;
        scaledCanvas.onmousemove = listener;
    };
    var makeWave = function() {
        var outputSettings = readOutputSettings();
        var waves = readWaves();
        var samples = sampleMergedWave(outputSettings, waves);
        var bytes = makeWaveFileBytes(outputSettings, samples);
        var base64 = 'data:audio/wav;base64,' + base64Encode(bytes);
        document.getElementById('audio').src = base64;
        drawWave(outputSettings, samples);
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
    findWaveSectionElement(0, 0, 'length').value = '1000.0';
    resetCanvases();
})();

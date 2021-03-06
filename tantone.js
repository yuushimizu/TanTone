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
            if (childNode.nodeType == 1) result.push(childNode);
        }
        return result;
    };
    var firstChildElement = function(element) {
        for (var i = 0; i < element.childNodes.length; ++i) {
            var childNode = element.childNodes[i];
            if (childNode.nodeType == 1) return childNode;
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
    var setRadioValue = function(ids, value) {
        for (var i = 0, l = ids.length; i < l; ++i) {
            var radio = document.getElementById(ids[i]);
            radio.checked = radio.value == value ? 'checked' : '';
        }
    };
    var readOutputInputValues = function() {
        return {
            samplesPerSecond: parseInt(document.getElementById('output-samples-per-second').value),
            channels: parseInt(radioValue(['output-channels-1', 'output-channels-2'])),
            bytesPerSample: parseInt(radioValue(['output-bytes-per-sample-1', 'output-bytes-per-sample-2']))
        };
    };
    var readOutputSettings = function() {
        var result = readOutputInputValues();
        result.minValue = result.bytesPerSample == 1 ? 0 : -(256 * 256 / 2);
        result.maxValue = result.bytesPerSample == 1 ? 255 : (256 * 256 / 2) - 1
        return result;
    };
    var findWaveElement = function(waveId, elementId) {
        return document.getElementById('wave-' + waveId + (elementId ? '-' + elementId : ''));
    };
    var findWaveSectionElement = function(waveId, sectionId, elementId) {
        return findWaveElement(waveId, 'section-' + sectionId + (elementId ? '-' + elementId : ''));
    };
    var nextWaveSectionId = 0;
    var addWaveSectionForm = function(waveId, previousElement) {
        var sectionId = nextWaveSectionId;
        nextWaveSectionId++;
        var sectionElement = function(elementId) {
            return findWaveSectionElement(waveId, sectionId, elementId);
        };
        var clone = findWaveElement(waveId, 'section-template').cloneNode(true);
        clone.innerHTML = clone.innerHTML.replace(/\:template\-section\-id\:/g, sectionId);
        var element = firstChildElement(clone);
        var parent = findWaveElement(waveId, 'sections');
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
            addWaveSectionForm(waveId, element);
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
        return sectionId;
    };
    var nextWaveId = 0;
    var addWaveForm = function() {
        var waveId = nextWaveId;
        nextWaveId++;
        var waveElement = function(elementId) {
            return findWaveElement(waveId, elementId);
        };
        var clone = document.getElementById('wave-template').cloneNode(true);
        clone.innerHTML = clone.innerHTML.replace(/\:template\-wave\-id\:/g, waveId);
        var element = firstChildElement(clone);
        document.getElementById('wave-forms').appendChild(element);
        var nextSectionId = 0;
        waveElement('add-section').onclick = function(event) {
            addWaveSectionForm(waveId);
        };
        waveElement('delete').onclick = function(event) {
            removeNode(element);
        };
        return waveId;
    };
    var waveFunction = function(type) {
        var randomWave = function(seed) {
            var random = new MersenneTwister(seed);
            var current = random.next() * 2 - 1;
            var next = random.next() * 2 - 1;
            var lastTimeRate = 0;
            return function(timeRate) {
                var diff = floatModulo(timeRate > lastTimeRate ? timeRate - lastTimeRate : timeRate + (1 - lastTimeRate), 1);
                if (diff > 0.015) {
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
        case 'pulse-1/8':
            return function(timeRate) {
                return timeRate < 0.125 ? 1 : -1;
            };
        case 'pulse-1/4':
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
        case 'triangle-1:2':
            return function(timeRate) {
                var timeRateOffset = floatModulo(timeRate + (1 / 6), 1);
                return (timeRateOffset < (1 / 3) ? (timeRateOffset * 3) : (1 - timeRateOffset) * 3 / 2) * 2 - 1;
            };
        case 'triangle-1:3':
            return function(timeRate) {
                var timeRateOffset = floatModulo(timeRate + (1 / 8), 1);
                return (timeRateOffset < (1 / 4) ? (timeRateOffset * 4) : (1 - timeRateOffset) * 4 / 3) * 2 - 1;
            };
        case 'triangle-1:4':
            return function(timeRate) {
                var timeRateOffset = floatModulo(timeRate + (1 / 10), 1);
                return (timeRateOffset < (1 / 5) ? (timeRateOffset * 5) : (1 - timeRateOffset) * 5 / 4) * 2 - 1;
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
        'keep': {
            merge: function(valueForCurrent, valueForNext, timeForSection) {
                return valueForCurrent;
            },
            resetTimeForWaveLoop: function(currentTimeForWaveLoop) {
                return 0;
            }
        },
        'average': {
            merge: function(valueForCurrent, valueForNext, timeForSection) {
                return valueForCurrent * (1 - timeForSection) + valueForNext * timeForSection;
            },
            resetTimeForWaveLoop: function(currentTimeForWaveLoop) {
                return currentTimeForWaveLoop;
            }
        }
    };
    var readWaveSectionInputValues = function(waveId, sectionId) {
        var sectionElement = function(elementId) {
            return findWaveSectionElement(waveId, sectionId, elementId);
        };
        return {
            enabled: sectionElement('enabled').checked,
            length: parseFloat(sectionElement('length').value),
            alternation: sectionElement('alternation').value,
            type: sectionElement('type').value,
            reversed: sectionElement('reversed').checked,
            offset: sectionElement('offset').value,
            frequency: parseFloat(sectionElement('frequency').value),
            volume0: parseFloat(sectionElement('volume-0').value),
            volume1: parseFloat(sectionElement('volume-1').value),
            frequencyModulation: {
                enabled: sectionElement('frequency-modulation-enabled').checked,
                type: sectionElement('frequency-modulation-type').value,
                reversed: sectionElement('frequency-modulation-reversed').checked,
                offset: sectionElement('frequency-modulation-offset').value,
                frequency: parseFloat(sectionElement('frequency-modulation-frequency').value),
                volume : parseFloat(sectionElement('frequency-modulation-volume').value)
            },
            volumeModulation: {
                enabled: sectionElement('volume-modulation-enabled').checked,
                type: sectionElement('volume-modulation-type').value,
                reversed: sectionElement('volume-modulation-reversed').checked,
                offset: sectionElement('volume-modulation-offset').value,
                frequency: parseFloat(sectionElement('volume-modulation-frequency').value),
                volume : parseFloat(sectionElement('volume-modulation-volume').value)
            }
        };
    };
    var readWaveInputValues = function(waveId) {
        var waveSectionForms = childElements(findWaveElement(waveId, 'sections'));
        var sections = [];
        for (var i = 0, l = waveSectionForms.length; i < l; ++i) {
            var sectionId = waveSectionForms[i].id.match(/section\-([^\-]+)/)[1];
            sections.push(readWaveSectionInputValues(waveId, sectionId));
        }
        return {
            sections: sections
        };
    };
    var readWavesInputValues = function() {
        var waveForms = childElements(document.getElementById('wave-forms'));
        var waves = [];
        for (var i = 0, l = waveForms.length; i < l; ++i) {
            var waveId = waveForms[i].id.match(/^wave\-([^\-]+)/)[1];
            waves.push(readWaveInputValues(waveId));
        }
        return waves;
    };
    var waveSectionFromInputValues = function(waveSectionInputValues) {
        var makeWaveFunction = function(wave) {
            return offsetWaveFunction(wave.reversed ? reverseWaveFunction(waveFunction(wave.type)) : waveFunction(wave.type), wave.offset);
        };
        var section = copyObject(waveSectionInputValues);
        section.alternationFunction = waveAlternationFunctions[section.alternation];
        section.offset /= 100;
        section.waveFunction = makeWaveFunction(section);
        section.volumes = [section.volume0, section.volume1];
        section.frequencyModulation.offset /= 100;
        section.frequencyModulation.waveFunction = makeWaveFunction(section.frequencyModulation);
        section.volumeModulation.offset /= 100;
        section.volumeModulation.waveFunction = makeWaveFunction(section.volumeModulation);
        return section;
    };
    var waveFromInputValues = function(waveInputValues) {
        var sections = [];
        for (var i = 0, l = waveInputValues.sections.length; i < l; ++i) {
            sections.push(waveSectionFromInputValues(waveInputValues.sections[i]));
        }
        return {
            sections: sections
        };
    };
    var readWaves = function() {
        var inputValues = readWavesInputValues();
        var waves = [];
        for (var i = 0, l = inputValues.length; i < l; ++i) {
            waves.push(waveFromInputValues(inputValues[i]));
        }
        return waves;
    };
    var serializeObject = function(object) {
        if (object instanceof Number || typeof(object) == 'number') {
            return String(object);
        } else if (object instanceof Boolean || typeof(object) == 'boolean') {
            return String(object);
        } else if (object instanceof String || typeof(object) == 'string') {
            return '"' + object + '"';
        } else if (object instanceof Array || typeof(object) == 'array') {
            var result = '';
            for (var i = 0, l = object.length; i < l; ++i) {
                var serialized = serializeObject(object[i]);
                if (serialized !== undefined) {
                    if (result.length != 0) result += ',';
                    result += serialized;
                }
            }
            return '[' + result + ']'
        } else if (typeof(object) == 'object') {
            var result = '';
            for (var key in object) {
                var serialized = serializeObject(object[key]);
                if (serialized !== undefined) {
                    if (result.length != 0) result += ',';
                    result += '"' + key + '":' + serialized;
                }
            }
            return '{' + result + '}';
        } else {
            return undefined;
        }
    };
    var serializeInputValues = function() {
        return serializeObject({output: readOutputInputValues(), waves: readWavesInputValues()});
    };
    var restoreInputValues = function(serialized) {
        var values;
        if (JSON && JSON.parse) {
            values = JSON.parse(serialized);
        } else {
            try {
                values = (new Functino("return " + serialized))();
            } catch (e) {
                return false;
            }
        }
        if (!values) return false;
        var output = values.output;
        var waves = values.waves;
        if (!output || !waves) return false;
        document.getElementById('output-samples-per-second').value = output.samplesPerSecond || 44100;
        setRadioValue(['output-channels-1', 'output-channels-2'], output.channels);
        setRadioValue(['output-bytes-per-sample-1', 'output-bytes-per-sample-2'], output.bytesPerSample);
        for (var waveIndex = 0, waveCount = waves.length; waveIndex < waveCount; ++waveIndex) {
            var waveId = addWaveForm();
            var sections = waves[waveIndex].sections;
            var previousSectionId = undefined;
            for (var sectionIndex = 0, sectionCount = sections.length; sectionIndex < sectionCount; ++sectionIndex) {
                var sectionId = addWaveSectionForm(waveId, previousSectionId === undefined ? undefined : findWaveSectionElement(waveId, previousSectionId));
                var sectionElement = function(id) {
                    return findWaveSectionElement(waveId, sectionId, id);
                };
                var section = sections[sectionIndex];
                sectionElement('enabled').checked = section.enabled ? 'checked' : '';
                sectionElement('length').value = section.length || 0;
                sectionElement('alternation').value = section.alternation;
                sectionElement('type').value = section.type;
                sectionElement('reversed').checked = section.reversed ? 'checked' : '';
                sectionElement('offset').value = section.offset || 0;
                sectionElement('frequency').value = section.frequency || 1;
                sectionElement('volume-0').value = section.volume0 || 0;
                sectionElement('volume-1').value = section.volume1 || 0;
                sectionElement('frequency-modulation-enabled').checked = section.frequencyModulation.enabled ? 'checked' : '';
                sectionElement('frequency-modulation-form').style.display = section.frequencyModulation.enabled ? 'block' : 'none';
                sectionElement('frequency-modulation-type').value = section.frequencyModulation.type;
                sectionElement('frequency-modulation-reversed').checked = section.frequencyModulation.reversed ? 'checked' : '';
                sectionElement('frequency-modulation-offset').value = section.frequencyModulation.offset || 0;
                sectionElement('frequency-modulation-frequency').value = section.frequencyModulation.frequency || 1;
                sectionElement('frequency-modulation-volume').value = section.frequencyModulation.volume || 0;
                sectionElement('volume-modulation-enabled').checked = section.volumeModulation.enabled ? 'checked' : '';
                sectionElement('volume-modulation-form').style.display = section.volumeModulation.enabled ? 'block' : 'none';
                sectionElement('volume-modulation-type').value = section.volumeModulation.type;
                sectionElement('volume-modulation-reversed').checked = section.volumeModulation.reversed ? 'checked' : '';
                sectionElement('volume-modulation-offset').value = section.volumeModulation.offset || 0;
                sectionElement('volume-modulation-frequency').value = section.volumeModulation.frequency || 1;
                sectionElement('volume-modulation-volume').value = section.volumeModulation.volume || 0;
                previousSectionId = sectionId;
            }
        }
        return true;
    };
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
        var sections = [];
        for (var i = 0, l = wave.sections.length; i < l; ++i) {
            if (wave.sections[i].enabled) sections.push(wave.sections[i]);
        }
        if (sections.length <= 0) return values;
        var millisecondsToSamples = function(milliseconds) {
            return Math.floor(outputSettings.samplesPerSecond * milliseconds / 1000);
        };
        var currentTimeForWaveLoop = 0;
        var emptyVolumes = [];
        for (var channel = 0; channel < outputSettings.channels; ++channel) emptyVolumes[channel] = 0;
        var dummySection = copyObject(sections[sections.length - 1]);
        dummySection.type = 'none';
        dummySection.reversed = false;
        dummySection.offset = 0;
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
                currentTimeForWaveLoop = currentSection.alternationFunction.resetTimeForWaveLoop(currentTimeForWaveLoop);
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
                var value = currentSection.alternationFunction.merge(valueForCurrentSection, valueForNextSection, currentTimeForSection);
                values[channel][sample] = value;
            }
            currentVolumeModulator.addMilliseconds(1000 / outputSettings.samplesPerSecond);
            nextVolumeModulator.addMilliseconds(1000 / outputSettings.samplesPerSecond);
            var currentFrequency = currentFrequencyModulator.modulate(currentSection.frequency);
            currentFrequencyModulator.addMilliseconds(1000 / outputSettings.samplesPerSecond);
            var nextFrequency = nextFrequencyModulator.modulate(nextSection.frequency);
            nextFrequencyModulator.addMilliseconds(1000 / outputSettings.samplesPerSecond);
            var frequency = currentSection.alternationFunction.merge(currentFrequency, nextFrequency, currentTimeForSection);
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
    var resetCanvas = function(context) {
        var width = context.canvas.width;
        var height = context.canvas.height;
        context.beginPath();
        context.fillStyle = 'rgba(0, 0, 0, 255)';
        context.fillRect(0, 0, width, height);
        var yCenter = height / 2;
        context.beginPath();
        context.strokeStyle = 'rgba(128, 128, 128, 255)';
        context.lineWidth = 1;
        context.moveTo(0, yCenter);
        context.lineTo(width, yCenter);
        context.stroke();
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
    var drawFullWave = function(context, outputSettings, samples) {
        resetCanvas(context);
        if (!outputSettings) return;
        var width = context.canvas.width;
        var height = context.canvas.height;
        context.lineWidth = 1;
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
    var createFullWaveImage = (function() {
        var fullWaveCanvas = document.getElementById('wave-canvas');
        var canvasForImage = document.createElement('canvas');
        canvasForImage.width = fullWaveCanvas.width;
        canvasForImage.height = fullWaveCanvas.height;
        return function(outputSettings, samples) {
            var context = canvasForImage.getContext('2d');
            drawFullWave(context, outputSettings, samples);
            return context.getImageData(0, 0, context.canvas.width, context.canvas.height);
        };
    })();
    var drawSingleChannelScaledWave = function(context, outputSettings, samples, drawMilliseconds, middleMillisecond) {
        var width = context.canvas.width;
        var height = context.canvas.height;
        var yCenter = height / 2;
        var lengthMilliseconds = samples.length * 1000 / outputSettings.samplesPerSecond;
        var offsetSamples = middleMillisecond < (drawMilliseconds / 2) ? 0 : (samples.length * Math.min(middleMillisecond - (drawMilliseconds / 2), lengthMilliseconds - drawMilliseconds) / lengthMilliseconds);
        var calcY = function(x) {
            return yCenter - yCenter * samples[Math.floor(offsetSamples + (outputSettings.samplesPerSecond * drawMilliseconds / 1000) * x / width)];
        };
        context.beginPath();
        for (var x = 0; x < width; ++ x) {
            context.lineTo(x, calcY(x));
        }
        context.stroke();
    };
    var drawScaledWave = function(context, outputSettings, samples, drawMilliseconds, middleMillisecond) {
        resetCanvas(context);
        if (!outputSettings) return;
        var width = context.canvas.width;
        var height = context.canvas.height;
        context.lineWidth = 1;
        for (var channel = 0; channel < outputSettings.channels; ++channel) {
            context.strokeStyle = waveStrokeStyles[channel];
            drawSingleChannelScaledWave(context, outputSettings, samples[channel], drawMilliseconds, middleMillisecond);
        }
        context.fillStyle = 'rgba(255, 255, 255, 255)';
        context.textBaseline = 'top';
        context.font = Math.floor(height * 0.1) + 'px';
        var startMillisecond = Math.floor(middleMillisecond < (drawMilliseconds / 2) ? 0 : Math.min(middleMillisecond - (drawMilliseconds / 2), samples[0].length * 1000 / outputSettings.samplesPerSecond - drawMilliseconds));
        var textMargin = width * 0.005;
        context.textAlign = 'left';
        context.fillText(startMillisecond + ' ms', textMargin, textMargin);
        context.textAlign = 'right';
        context.fillText((startMillisecond + drawMilliseconds) + ' ms', width - textMargin, textMargin);
    };
    var fullWaveImage = null;
    var redrawWaveImages = function(outputSettings, samples) {
        var fullWaveCanvas = document.getElementById('wave-canvas');
        fullWaveImage = createFullWaveImage(outputSettings, samples);
        var scaledWaveCanvas = document.getElementById('wave-canvas-scaled');
        var scaledWaveContext = scaledWaveCanvas.getContext('2d');
        drawScaledWave(scaledWaveContext, outputSettings, samples, 100, 0);
        var moreScaledWaveCanvas = document.getElementById('wave-canvas-scaled-more');
        var moreScaledWaveContext = moreScaledWaveCanvas.getContext('2d');
        drawScaledWave(moreScaledWaveContext, outputSettings, samples, 20, 0);
        if (!outputSettings) return;
        var length = samples[0].length * 1000 / outputSettings.samplesPerSecond;
        var listener = function(event) {
            drawScaledWave(scaledWaveContext, outputSettings, samples, 100, length * event.offsetX / this.clientWidth);
            drawScaledWave(moreScaledWaveContext, outputSettings, samples, 20, length * event.offsetX / this.clientWidth);
        };
        fullWaveCanvas.onmousemove = listener;
        scaledWaveCanvas.onmousemove = listener;
        moreScaledWaveCanvas.onmousemove = listener;
    };
    var makeWave = function() {
        var outputSettings = readOutputSettings();
        var waves = readWaves();
        var samples = sampleMergedWave(outputSettings, waves);
        var bytes = makeWaveFileBytes(outputSettings, samples);
        var base64 = 'data:audio/wav;base64,' + base64Encode(bytes);
        document.getElementById('audio').src = base64;
        redrawWaveImages(outputSettings, samples);
        document.getElementById('wave-link').href = base64;
    };
    document.getElementById('add-wave-form').onclick = function(event) {
        var newWaveId = addWaveForm();
        addWaveSectionForm(newWaveId);
        return false;
    };
    document.getElementById('form').onsubmit = function(event) {
        event.preventDefault();
        makeWave();
        location.hash = encodeURIComponent(serializeInputValues());
        return false;
    };
    var initializeWaves = function() {
        var waveId = addWaveForm();
        var sectionId = addWaveSectionForm(waveId);
        findWaveSectionElement(waveId, sectionId, 'length').value = '1000.0';
    };
    if (location.hash != '') {
        try {
            restoreInputValues(decodeURIComponent(location.hash.replace(/^\#/, '')));
        } catch (e) {
        }
    } else {
        initializeWaves();
    }
    var refreshFullWaveCanvas = (function() {
        var fullWaveCanvas = document.getElementById('wave-canvas');
        var context = fullWaveCanvas.getContext('2d');
        var width = context.canvas.width;
        var height = context.canvas.height;
        var audio = document.getElementById('audio');
        return function() {
            if (!fullWaveImage) return;
            context.putImageData(fullWaveImage, 0, 0);
            var duration = audio.duration;
            var currentTime = audio.currentTime;
            if (duration !== undefined && !isNaN(duration) && currentTime !== undefined && !isNaN(currentTime)) {
                context.lineWidth = 1;
                context.strokeStyle = 'rgb(192, 128, 32)';
                context.beginPath();
                var x = width * currentTime / duration;
                context.moveTo(x, 0);
                context.lineTo(x, height);
                context.stroke();
            }
        };
    })();
    setInterval(refreshFullWaveCanvas, 50);
    redrawWaveImages(null, null);
})();
let audioContext = null;
let musicTimer = null;
let musicStep = 0;
let noiseBuffer = null;

const melody = [261.63, 0, 329.63, 392, 0, 329.63, 293.66, 0,
	220, 0, 261.63, 329.63, 0, 293.66, 261.63, 0];

function toggleLofiMusic(enabled) {
	const AudioContextClass = window.AudioContext || window.webkitAudioContext;
	if (!AudioContextClass) {
		return false;
	}

	if (!audioContext) {
		audioContext = new AudioContextClass();
	}

	if (enabled) {
		audioContext.resume();
		if (!musicTimer) {
			musicStep = 0;
			musicTimer = window.setInterval(playMusicStep, 240);
			playMusicStep();
		}
	} else {
		window.clearInterval(musicTimer);
		musicTimer = null;
		audioContext.suspend();
	}

	return true;
}

function playMusicStep() {
	const step = musicStep;
	const now = audioContext.currentTime;
	const note = melody[step];

	if (note) {
		playSoftNote(note, now);
	}
	if (step % 8 === 0) {
		playKick(now);
	}
	if (step % 8 === 4) {
		playSnare(now);
	}
	if (step % 2 === 1) {
		playHat(now);
	}

	musicStep = (musicStep + 1) % melody.length;
}

function playSoftNote(frequency, startTime) {
	const oscillator = audioContext.createOscillator();
	const filter = audioContext.createBiquadFilter();
	const gain = audioContext.createGain();
	oscillator.type = "triangle";
	oscillator.frequency.value = frequency;
	filter.type = "lowpass";
	filter.frequency.value = 1100;
	gain.gain.setValueAtTime(0.0001, startTime);
	gain.gain.exponentialRampToValueAtTime(0.045, startTime + 0.025);
	gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.28);
	oscillator.connect(filter).connect(gain).connect(audioContext.destination);
	oscillator.start(startTime);
	oscillator.stop(startTime + 0.3);
}

function playKick(startTime) {
	const oscillator = audioContext.createOscillator();
	const gain = audioContext.createGain();
	oscillator.type = "sine";
	oscillator.frequency.setValueAtTime(105, startTime);
	oscillator.frequency.exponentialRampToValueAtTime(48, startTime + 0.14);
	gain.gain.setValueAtTime(0.0001, startTime);
	gain.gain.exponentialRampToValueAtTime(0.16, startTime + 0.008);
	gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.17);
	oscillator.connect(gain).connect(audioContext.destination);
	oscillator.start(startTime);
	oscillator.stop(startTime + 0.18);
}

function getNoiseBuffer() {
	if (!noiseBuffer) {
		noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.12, audioContext.sampleRate);
		const samples = noiseBuffer.getChannelData(0);
		for (let index = 0; index < samples.length; index++) {
			samples[index] = Math.random() * 2 - 1;
		}
	}
	return noiseBuffer;
}

function playSnare(startTime) {
	const source = audioContext.createBufferSource();
	const filter = audioContext.createBiquadFilter();
	const gain = audioContext.createGain();
	source.buffer = getNoiseBuffer();
	filter.type = "highpass";
	filter.frequency.value = 1400;
	gain.gain.setValueAtTime(0.075, startTime);
	gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.11);
	source.connect(filter).connect(gain).connect(audioContext.destination);
	source.start(startTime);
	source.stop(startTime + 0.12);
}

function playHat(startTime) {
	const source = audioContext.createBufferSource();
	const filter = audioContext.createBiquadFilter();
	const gain = audioContext.createGain();
	source.buffer = getNoiseBuffer();
	filter.type = "highpass";
	filter.frequency.value = 7000;
	gain.gain.setValueAtTime(0.018, startTime);
	gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.035);
	source.connect(filter).connect(gain).connect(audioContext.destination);
	source.start(startTime);
	source.stop(startTime + 0.04);
}

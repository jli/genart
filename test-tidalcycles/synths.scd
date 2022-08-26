

/////////////////// source: https://github.com/diegodorado/tidal-synths

SynthDef(\cs80lead, {

    arg freq=880, amp=0.5, attack=0.75, decay=0.5, sustain=0.8, release=1.0, fatt=0.75, fdecay=0.5, fsus=0.8, frel=1.0,
        cutoff=200, pan=0, dtune=0.002, vibrate=4, vibdepth=0.015,
        // gate=1.0,
        ratio=1,out=0,cbus=1;
    var env,fenv,vib,ffreq,sig;
    cutoff=In.kr(cbus);
    // env=EnvGen.kr(Env.adsr(attack,decay,sustain,release),gate,levelScale:1,doneAction:2);
    // fenv=EnvGen.kr(Env.adsr(fatt,fdecay,fsus,frel,curve:2),gate,levelScale:1,doneAction:2);
    vib=SinOsc.kr(vibrate).range(-1*vibdepth,vibdepth)+1;
    freq=Line.kr(freq,freq*ratio,5);
    freq=freq*vib;
    sig=Mix.ar(Saw.ar([freq,freq*(1+dtune)]));
    // keep this below nyquist!!
    // ffreq=max(fenv*freq*12,cutoff)+100;
    ffreq=max(freq*12,cutoff)+100;
    sig=LPF.ar(sig,ffreq);


    // OffsetOut.ar(out, DirtPan.ar(sig, ~dirt.numChannels, pan, env));
    OffsetOut.ar(out, DirtPan.ar(sig, ~dirt.numChannels, pan));


}).add;


SynthDef(\bass8, {
	arg out = 0, amp = 0.1, gate = 1, pan = 0, freq = 200;
	var sig;
	var osc = Array.newClear(6);
	var env = Array.newClear(6);

	env[0] = EnvGen.kr(Env([0,1,0.051,0],[0.001,0.01,0.8], [4,-8]), 1);
	env[1] = EnvGen.kr(Env([0,1,0.051,0],[0.005,0.5,1.5], [0,-8], releaseNode:2), 1);
	env[2] = EnvGen.kr(Env([0,1,1,0],[0.01,0.01,0.2], [0,0,-4], releaseNode:2), gate);
	env[3] = EnvGen.kr(Env([0,1,0],[0.002,2.8], [0,-4]), 1);
	env[4] = EnvGen.kr(Env([0,1,1,0],[0.001,0.1,0.8], [4,0,-4], releaseNode:2), gate);
	env[5] = EnvGen.kr(Env([0,1,0],[0.001,3.0], [0,-4]), 1);

	freq = (freq / 4) * ((0..1)/1 - 0.5 * 0.0007 + 1);

	osc[0] = SinOsc.ar(freq * 11 + 0) * env[0];
	osc[1] = SinOsc.ar(freq * 6 * ( osc[0] * 2.5 + 1 )) * env[1];
	osc[2] = SinOsc.ar(freq * 2 * 1 + 0) * env[2];
	osc[3] = SinOsc.ar(freq * 1 * ( osc[2] * 2.5 + 1 ) + 0) * env[3];
	osc[4] = SinOsc.ar(freq * 1 * ( osc[1] * 2.5 + 1 ) * (osc[3] * 2.5 + 1)) * env[4];
	osc[5] = SinOsc.ar(freq * 2) * env[5];

	sig = osc * DC.ar([0.0, 0.0, 0.0,  0.0, 0.5, 0.5]);
	sig = sig * 0.5;
	sig = sig.flop.sum;
	sig = sig * EnvGen.ar(\adsr.kr( Env.adsr(0.001,0,1,0.01, 1,-1) ), gate, doneAction:2);
	sig = sig * AmpComp.kr(freq);
	sig = sig.sum;
	Out.ar(out, Pan2.ar(sig, pan, amp));

}).add;


SynthDef(\acid309, {|out, sustain=1, pan, accelerate, freq |
    var env1, env2, son, pitch, amp, gate;
    gate=1;
    amp = 0.5;
    pitch = freq.cpsmidi;
    pitch = Lag.kr(pitch, 0.12 * (1-Trig.kr(gate, 0.001)) * gate);
    env1 = EnvGen.ar(Env.new([0, 1.0, 0, 0], [0.001, 2.0, 0.04], [0, -4, -4], 2), gate, amp, doneAction:2);
    env2 = EnvGen.ar(Env.adsr(0.001, 0.8, 0, 0.8, 70, -4), gate);
    son = LFPulse.ar(pitch.midicps, 0.0, 0.51, 2, -1);

    son = RLPF.ar(son, (pitch + env2).midicps, 0.3);

    OffsetOut.ar(out, DirtPan.ar(son, ~dirt.numChannels, pan, env1));
}).add;


SynthDef(\rhodes, {|out, sustain=1, pan, accelerate, freq |
  var sig, in, n = 6, max = 0.04, min = 0.01, delay, pitch, detune, hammer, amp, env;
  amp = 0.9;
	freq = freq.cpsmidi;
	hammer = Decay2.ar(Impulse.ar(0.001), 0.008, 0.04, LFNoise2.ar([2000,4000].asSpec.map(amp), 0.25));
	sig = Mix.ar(Array.fill(3, { arg i;
			detune = #[-0.04, 0, 0.03].at(i);
			delay = (1/(freq + detune).midicps);
			CombL.ar(hammer, delay, delay, 50 * amp)
		}) );

	sig = HPF.ar(sig,50);
    env = EnvGen.ar(Env.perc(0.0001,sustain, amp * 4, -1), doneAction:2);
    OffsetOut.ar(out, DirtPan.ar(sig, ~dirt.numChannels, pan, env));
}).add;






////////////////////////////// source: https://github.com/efairbanks/tidal-performance-2019/blob/master/synthdefs.scd
SynthDef(\donk, {
    |out, sustain = 1, freq = 440, speed = 1, begin=0, end=1, pan, accelerate, offset|
    var line = Line.ar(begin, end, sustain, doneAction:2);
    var env = Env([0, 1, 0], [0.01, 1], curve:-3);
    var envGen = IEnvGen.ar(env, line*env.times.sum*abs(speed));
    var modulator = (SinOsc.ar(freq*[1.0001,0.9999]*abs(speed))*2).tanh;
    var carrier = (SinOsc.ar((freq/4)+(modulator*1000*envGen))*0.8).tanh;
    var sound = DirtPan.ar(carrier, ~dirt.numChannels, pan, envGen);
    Out.ar(out, sound);
  }).add;
  SynthDef(\wub, {
    |out, sustain = 1, freq = 440, speed = 1, begin=0, end=1, pan, accelerate, offset|
    var line = Line.ar(begin, end, sustain, doneAction:2);
    var env = Env([0, 1, 0],[1,5], curve:2);
    var envGen = IEnvGen.ar(env, line*env.times.sum*abs(speed));
    // --- //
    var speedFreq = freq*abs(speed)/4;
    var mod = Latch.ar((SinOsc.ar(speedFreq*[7,11,13,5])*5).tanh*2000*envGen, Saw.ar(21000*envGen));
    var car =  Latch.ar(((SinOsc.ar(speedFreq+mod)*10)+(SinOsc.ar(speedFreq)!2)).tanh, Saw.ar(21000*envGen));
    var sound = LPF.ar(car, DC.ar(20000)*envGen+DC.ar(10))*(-11.dbamp);
    Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, envGen));
  }).add;
  SynthDef(\sawpluck, {
    |out, sustain = 1, freq = 440, speed = 1, begin=0, end=1, pan, accelerate, offset|
    var line = Line.ar(begin, end, sustain, doneAction:2);
    var env = Env([0, 1, 0.333, 0],[5, 70, 1000]);
    var envGen = IEnvGen.ar(env, line*env.times.sum*abs(speed));
    var sound = Saw.ar(freq*abs(speed));
    Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, envGen));
  }).add;
  SynthDef(\vibsawpluck, {
    |out, sustain = 1, freq = 440, speed = 1, begin=0, end=1, pan, accelerate, offset|
    var line = Line.ar(begin, end, sustain, doneAction:2);
    var env = Env([0, 1, 0.333, 0],[5, 70, 1000]);
    var envGen = IEnvGen.ar(env, line*env.times.sum*abs(speed));
    var sound = Saw.ar(freq*abs(speed)+(SinOsc.ar(10)*(freq*0.06)*line*line));
    sound = RLPF.ar(sound, Clip.ar(envGen*freq*48, 0, 20000), 0.5);
    Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, envGen));
  }).add;
  SynthDef(\plucklead, {
    |out, sustain = 1, freq = 440, speed = 1, begin=0, end=1, pan, accelerate, offset|
    var line = Line.ar(begin, end, sustain, doneAction:2);
    var env = Env([0, 1, 0.333, 0],[5, 70, 1000]);
    var envGen = IEnvGen.ar(env, line*env.times.sum*abs(speed));
    var speedFreq = freq*abs(speed);
    var pulseLfo = SinOsc.ar(Rand(-1,1));
    var sound = RLPF.ar(Pulse.ar([speedFreq*Rand(0.99,1.01)*2,speedFreq*Rand(0.99,1.01)*2],pulseLfo)*0.5+Saw.ar(speedFreq), (20000*(envGen**2.8))+DC.ar(10), 0.5);
    Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, envGen));
  }).add;
  SynthDef(\wob, {
    |out, sustain = 1, freq = 440, speed = 1, begin=0, end=1, pan, accelerate, offset|
    var line = Line.ar(begin, end, sustain, doneAction:2);
    var env = Env([0, 1, 0],[1, 1]);
    var envGen = IEnvGen.ar(env, line*env.times.sum*abs(speed));
    // --- //
    var speedFreq = freq*abs(speed)/4;
    var mod = Latch.ar((SinOsc.ar(speedFreq*[7,11,13,5])*5).tanh*2000*envGen, Saw.ar(21000*envGen));
    var car =  Latch.ar(((SinOsc.ar(speedFreq+mod)*10)+(SinOsc.ar(speedFreq)!2)).tanh, Saw.ar(21000*envGen));
    var sound = car*(-10.dbamp);
    Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, envGen));
  }).add;
  SynthDef(\noisebuild, {
    |out, sustain = 1, freq = 440, speed = 1, begin=0, end=1, pan, accelerate, offset|
    var line = Line.ar(begin, end, sustain, doneAction:2);
    var env = Env([0, 1, 0],[127, 1],curve:4);
    var envGen = IEnvGen.ar(env, line*env.times.sum/*abs(speed)*/);
    // --- //
    var sound = HPF.ar(BPF.ar(WhiteNoise.ar()*envGen, 10+(20000*envGen), 0.8), 1000);
    Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, envGen));
  }).add;
  SynthDef(\fmp, {
      |out,sustain = 1,freq = 440,speed = 1,begin=0,end=1,pan,accelerate,offset,cStartFreq=440,cEndFreq=440,cEnvFMod=0,mStartFreq=440,mEndFreq=440,mEnvFMod=0,fMod=0,pMod=0,cFFeedback=0,cPFeedback=0,mFFeedback=0,mPFeedback=0,feedbackDelay=0.01,attackCurve=1,decayCurve=1,atk=1,dcy=1|
      var line = Line.ar(begin, end, sustain, doneAction:2);
      var env = Env([0, 1, 0],[atk,dcy],[attackCurve,decayCurve]);
      var envGen = IEnvGen.ar(env, line*env.times.sum*abs(speed));
      var feedback = LocalIn.ar(1);
      var mFreq = ((1-line)*mStartFreq)+(line*mEndFreq)+(envGen*mEnvFMod)+(mFFeedback*feedback);
      var mPhase = mPFeedback*feedback;
      var modulator = SinOsc.ar(mFreq,mPhase)*envGen;
      var cFreq = ((1-line)*cStartFreq)+(line*cEndFreq)+(envGen*cEnvFMod)+(modulator*fMod)+(cFFeedback*feedback);
      var cPhase = (modulator*pMod)+(cPFeedback*feedback);
      var carrier = SinOsc.ar(cFreq,cPhase);
      var sound = carrier*envGen;
      LocalOut.ar(DelayL.ar(sound,10,feedbackDelay));
      Out.ar(out, DirtPan.ar(sound,~dirt.numChannels,pan,1));
  }).add;
  SynthDef(\ab2, {
	arg out, freq = 440, sustain = 5, speed = 1, begin =0, end=1, pan, accelerate, offset;
	var line = Line.ar(begin, end, sustain, doneAction:2);
	var env = Env([0, 1, 0], [0.01, 1], curve:-3);
	var envGen = IEnvGen.ar(env, line*env.times.sum*abs(speed));
	var snd;
	var sound;
	snd = Saw.ar([freq, freq*1.022]);
	8.do { |k|
		var trig, ffreq;
		snd = AllpassN.ar(snd, 1, 0.1 / (12 - k), 2);
		trig = Impulse.ar(2 ** (8 - k) / 32, 1 / 2);
		ffreq = 80 ** TRand.ar(1, 2, trig).lag((2 ** (8 - k)).reciprocal);
		snd = BRF.ar(snd, ffreq, 2);
	};
	sound = DirtPan.ar(snd, ~dirt.numChannels, pan, envGen);
	Out.ar(out, sound);
}).add;
SynthDef(\flutter, {
	|out, sustain = 1, freq = 440, speed = 1, begin=0, end=1, pan, accelerate, offset|
	var line = Line.ar(begin, end, sustain, doneAction:2);
	var env = Env([0,1,0],[0.2,0.8]);
	var envGen = IEnvGen.ar(env, line*env.times.sum*abs(speed));
	var lfo = SinOsc.ar(Rand(-0.1,0.1),Rand(0,3.145))*(freq*abs(speed))/80;
	var sound = Saw.ar((freq*abs(speed))+lfo+(Rand(-1,1)*(freq*abs(speed))/DC.ar(100)));
	sound = LPF.ar(sound, (freq*abs(speed))*1.5);
	//sound = RLPF.ar(sound, Clip.ar(envGen*freq*48, 0, 20000), 0.5);
	Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, envGen));
}).add;
SynthDef(\futuresaw, {
	|out, sustain = 1, freq = 440, speed = 1, begin=0, end=1, pan, accelerate, offset|
	var line = Line.ar(begin, end, sustain, doneAction:2);
	var envCurve = -1.5;
	var env = Env([0,1,0],[0.5,0.5],[-1*envCurve,envCurve]);
	var envGen = IEnvGen.ar(env, line*env.times.sum*abs(speed));
	var sound = Saw.ar((freq*abs(speed))+(Rand(-1,1)*(freq*abs(speed))/DC.ar(100)));
	sound = RLPF.ar(sound, Clip.ar(envGen*freq*48, 0, 20000), 0.5);
	Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, envGen));
}).add;
SynthDef(\futuresub, {
	|out, sustain = 1, freq = 440, speed = 1, begin=0, end=1, pan, accelerate, offset|
	var line = Line.ar(begin, end, sustain, doneAction:2);
	var envCurve = 5;
	var env = Env([0,1,0],[0.5,0.5],[-1*envCurve,envCurve]);
	var envGen = IEnvGen.ar(env, line*env.times.sum*abs(speed));
	var sound = SinOsc.ar((freq*abs(speed))+(Rand(-1,1)*(freq*abs(speed))/DC.ar(100)));
	sound = sound*2;
	sound = sound.tanh;
	Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, envGen));
}).add;
SynthDef(\ultrasaw, {
	|out, sustain = 1, freq = 440, speed = 1, begin=0, end=1, pan, accelerate, offset|
	var line = Line.ar(begin, end, sustain, doneAction:2);
	var env = Env([0,1,1,0],[0.001,1,0.001]);
	var envGen = IEnvGen.ar(env, line*env.times.sum*abs(speed));
	var freqs = {Rand(-1,1)*(freq/60)}.dup(12);
	var sound = Saw.ar((freq+freqs));
	sound = sound + Saw.ar((freq+freqs)*2);
	sound = sound + Saw.ar((freq+freqs)*0.5);
	sound = sound + Saw.ar((freq+freqs)*4);
	sound = sound + Saw.ar((freq+freqs)*0.25);
	sound = LPF.ar(sound, freq*1.5);
	//sound = RLPF.ar(sound, Clip.ar(envGen*freq*48, 0, 20000), 0.5);
	Out.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, envGen));
}).add;
SynthDef(\acid, {
	|out, sustain = 1, freq = 440, speed = 1, begin=0, end=1, pan, accelerate, offset, clamp=1, res=0.2, mix=0.1|
	var line = Line.ar(begin, end, sustain, doneAction:2);
	var env = Env([0, 1, 0], [0.01, 1], curve:-3);
	var envGen = IEnvGen.ar(env, line*env.times.sum*abs(speed));
	var carrier = RLPF.ar((Saw.ar(freq)*(1-mix))+(Pulse.ar(freq)*mix), envGen*clamp*18000,res);
	var sound = DirtPan.ar(carrier, ~dirt.numChannels, pan, envGen);
	Out.ar(out, sound);
}).add;
SynthDef(\sinosc, {
	|out, sustain = 1, freq = 440, speed = 1, begin=0, end=1, pan=0.5, accelerate, offset|
	var env, envTimes, envGen, line, sound, rate, phase;
	envTimes = [1,100];
	envTimes = envTimes/envTimes.sum;
	env = Env([0,1,0],envTimes);
	line = Line.ar(0,1,sustain,doneAction:2);
	envGen = IEnvGen.ar(env,line);
	sound = SinOsc.ar(freq*speed)*envGen;
	OffsetOut.ar(out, DirtPan.ar(sound, ~dirt.numChannels, pan, envGen));
}).add;

/*
 *Derived from https://github.com/zjy369/amr-file-player
 */
var AmrPlayer = function(amr_url, download_success_cb, download_progress_cb, download_error_cb, play_end_cb) {
	this.init(amr_url, download_success_cb, download_progress_cb, download_error_cb, play_end_cb);
};
AmrPlayer.prototype = {
	init: function(amr_url, download_success_cb, download_progress_cb, download_error_cb, play_end_cb) {
		this.audioContext = null;
		this.bufferSource = null;
    this.AMR_NB_HEADER = "#!AMR\n";
    this.AMR_NB_SAMPLERATE = 8000;
    this.AMR_WB_HEADER = "#!AMR-WB\n";
    this.AMR_WB_SAMPLERATE = 16000;
		this.blob = null;
		this.canPlay = false;
		this.isPlaying = false;
		var cnt = 0;
		this.allTime = 0;
		this.ended_cb = function() {
			if(cnt === 0) {
				cnt++;
				console.info("AmrPlayer ended callback");
				if(this.isPlaying){
          this.isPlaying = false;
          this.audioContext.close();
        }
				play_end_cb && play_end_cb();
			}
		};
		this.downloadAmrBlob(amr_url, download_success_cb, download_progress_cb, download_error_cb);
	},
	downloadAmrBlob: function(amr_url, download_success_cb, download_progress_cb) {
		var self = this;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', amr_url);
		xhr.responseType = 'blob';
		xhr.onreadystatechange = function(e) {
			if(xhr.readyState == 4 && xhr.status == 200) {
				self.blob = new Blob([xhr.response], {
					type: 'audio/mpeg'
				});
				self.canPlay = true;
				self.genPLayer(function() {
					download_success_cb && download_success_cb(self.allTime);
				});
			}
			if (xhr.readyState == 4 && xhr.status != 200) {
				console.log("amr address is wrong, please check amr address");
				console.log(xhr.readyState + "    " + xhr.status);
				download_error_cb && download_error_cb();
			}
		};
		xhr.onprogress = function(e) {
			if(e.lengthComputable) {
				download_progress_cb && download_progress_cb(e);
			}
		};
		xhr.send();
	},
	genPLayer: function(success_cb) {
		var self = this;
		this.isPlaying = false;
		this.readBlob(this.blob, function(data) {
			self.readAmrArray(data, success_cb);
		});
	},
	readBlob: function(blob, callback) {
		var reader = new FileReader();
		reader.onload = function(e) {
			var data = new Uint8Array(e.target.result);
			callback(data);
		};
		reader.readAsArrayBuffer(blob);
	},
	readAmrArray: function(array, success_cb) {
    var amr_header = "";
    if (String.fromCharCode.apply(null, array.subarray(0, this.AMR_NB_HEADER.length)) == this.AMR_NB_HEADER) {
        amr_header = this.AMR_NB_HEADER;
    }else if(String.fromCharCode.apply(null, array.subarray(0, this.AMR_WB_HEADER.length)) == this.AMR_WB_HEADER){
        amr_header = this.AMR_WB_HEADER;
    }
    console.log(amr_header);
    var samples;
    if(amr_header == this.AMR_NB_HEADER){
      samples = AMR.decode(array);
    }else if(amr_header == this.AMR_WB_HEADER){
      AMRWB.decodeInit();
      samples = AMRWB.decode(array);
      AMRWB.decodeExit();
    }
		if(!samples) {
			console.log('Failed to decode!');
			return;
		}
		this.readPcm(samples, amr_header, success_cb);
	},
	readPcm: function(samples, amr_header, success_cb) {
		var self = this;
		var ctx = this.getAudioContext();
		this.bufferSource = ctx.createBufferSource();
    var sampleRate = 0;
    if(amr_header == this.AMR_NB_HEADER){
      sampleRate = this.AMR_NB_SAMPLERATE;
    }else if(amr_header == this.AMR_WB_HEADER){
      sampleRate = this.AMR_WB_SAMPLERATE;
    }
    if(sampleRate == 0){
      console.log('Failed to decode!');
      return;
    }
		var buffer = ctx.createBuffer(1, samples.length, sampleRate);
		if(buffer.copyToChannel) {
			buffer.copyToChannel(samples, 0, 0)
		} else {
			var channelBuffer = buffer.getChannelData(0);
			channelBuffer.set(samples);
		}
		this.bufferSource.buffer = buffer;
		this.bufferSource.connect(ctx.destination);
		this.bufferSource.onended = function() {
			self.ended_cb && self.ended_cb();
		};
		self.allTime = this.bufferSource.buffer.duration * 1000;
		success_cb && success_cb(self.allTime);
	},
	getAudioContext: function() {
		if(!this.audioContext) {
			if(window.AudioContext) {
				this.audioContext = new AudioContext();
			} else {
				this.audioContext = new window.webkitAudioContext();
			}
		}
		return this.audioContext;
	},
	play: function() {
		if(!this.isPlaying && this.canPlay) {
			this.bufferSource.start();
			this.isPlaying = true;
		} else {
			this.warn('can not play now');
		}
	},
	pause: function() {
		if(this.isPlaying && this.canPlay) {
			this.bufferSource.stop();
			this.audioContext.close();
			this.isPlaying = false;
      this.ended_cb && this.ended_cb();
		} else {
			this.warn('can not pause now');
		}
	},
	toggle: function() {
		this.isPlaying ? this.pause() : this.play();
	},
	endedWith: function(cb) {
		this.ended_cb = cb;
	},
	warn: function(msg) {
		console.warn(msg);
	}
};
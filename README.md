amr-file-player
Use JavaScript to play audio in remote amr-nb and amr-wb formats 

inpired by 
https://github.com/yxl/opencore-amr-js  (amr-nb)
https://github.com/sblandford/amrwb-js  (amr-wb)

-- AmrFilePlayer --

params:   
  >amr_url   
  >download_success_cb (optional)   
  >download_progress_cb (optional)   
  
props:   
  >bool canPlay   
  >bool isPlaying
  
methods:   
  >play()   
  >pause()   
  >toggle() // play() when paused or pause() when playing   
  >endWith(callback) // optional, fire callback with ended event

usage:
    <script src="xxx/amrnb.js"></script>
    <script src="xxx/amrwb.js"></script>
    <script src="xxx/amrwb-util.js"></script>
    <script src="xxx/amrplayer.js"></script>
	  
	var player = new AmrPlayer('http://xxx/xxx.amr');
	player.endWith(function(){ console.log( xxx ) });
	player.play();
	// or player.pause();
	// or player.toggle();

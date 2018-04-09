var http = require('http');
var fs = require('fs');
var del = require('del');
var request = require('request'); 
var NodeHelper = require("node_helper");
var HashMap = require("hashmap");
var SVG  = require('svgi');


module.exports = NodeHelper.create({

	start: function() {
		console.log("Starting node helper: " + this.name);
	},

	socketNotificationReceived: function(notification, payload) {
		console.error("Downloading weather map with signal: " + notification + " From URL: " + payload.domain + payload.path);
        var self = this;
        var success = false;
		if (notification === "FETCH_MAP"){
			var options = {
				host: payload.domain,
				path: payload.path
			};
			var imgType = payload.useSVG ? '.svg' : '.png';
			http.get(options, function (response) {
				var pngFiles = payload.mmDir + 'modules/mmm-weatherchart/cache/*.png';
                var svgFiles = payload.mmDir + 'modules/mmm-weatherchart/cache/*.svg';
				var cachedFile = new Date().getTime() + imgType;
//				var newImage = fs.createWriteStream(payload.mmDir + 'modules/mmm-weatherchart/cache/' + cachedFile);
				var imagePath = '/modules/mmm-weatherchart/cache/' + cachedFile;
				var imagePathAbs = payload.mmDir + imagePath.substring(1);
				var incomingData = '';
				response.on('data', function(chunk){
					incomingData += chunk; // this probably won't work for png.
				});
				response.on('end', function(){
//					newImage.end();
					if(payload.useSVG && payload.customiseSVG){
				        console.log("imagePath = " + imagePath);

//					    var meteogram = self.readSVG(imagePathAbs);

                        var customColours = new HashMap(payload.customColours);
					    success = self.customiseSVG(incomingData, customColours, imagePathAbs);
					}
					else { // just write the image
					    success = self.writeFile(incomingData, imagePathAbs);
					}
					
					if(success == true){
					    self.sendSocketNotification("MAPPED", imagePath);
					    del([pngFiles, svgFiles, '!'+imagePathAbs]);
					}
					else{
					    console.log("Customise SVG failed, sending FAILED notification ");
                        self.sendSocketNotification("FAILED", false);
					}
					
					
				});
			});
		}
		
		
	},
	
	writeFile: function(data, path){
       console.log("writing file....");
       fs.writeFile(path, data, 'utf-8', function(err) {
           if(err) {
               console.log(err);
               return false;
           }

           console.log("The file was saved!");
       }); 
       return true;
	},
	
	
	readSVG: function(svgFilepath){
        var self = this;
	    console.log(">> readSVG");

	    console.log("svgFilepath = " + svgFilepath);
	    var svgData = fs.readFileSync(svgFilepath,'utf8');

	    return svgData;
        console.log("<< readSVG");
	},
	
   customiseSVG: function(meteogram, customColours, svgFilepath){
       var self = this;
       console.log(">> customiseSVG");
      
       console.log("iterating....");
       customColours.forEach(function(value, key) {
           console.log(key + ' ==> ' + value);

           var reg = new RegExp(key,"g");   // not the safest way to do this, but #yolo
           meteogram = meteogram.replace(reg, value);
       });
       
       if(!self.writeFile(meteogram, svgFilepath)){
           return false;
       }
       
       try {  // validate result (wip)
           let svgi = new SVG(meteogram);
           svgi.report();
       }
       catch (error){
           console.log(error);
           // return false;
       }

       console.log("<< customiseSVG");
       return true;
   
   },
	
	
});

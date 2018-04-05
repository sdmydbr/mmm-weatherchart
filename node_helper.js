var http = require('http');
var fs = require('fs');
var del = require('del');
var request = require('request'); 
var NodeHelper = require("node_helper");
var HashMap = require("hashmap");
var xmlChecker  = require('xmlchecker');


module.exports = NodeHelper.create({

	start: function() {
		console.log("Starting node helper: " + this.name);
	},

	socketNotificationReceived: function(notification, payload) {
		console.error("Downloading weather map with signal: " + notification + " From URL: " + payload.domain + payload.path);
        var self = this;
		if (notification === "FETCH_MAP"){
			var options = {
				host: payload.domain,
				path: payload.path
			};
			var imgType = payload.useSVG ? '.svg' : '.png';
			http.get(options, function (response) {
				var pngFiles = payload.mmDir + 'modules/mmm-weatherchart/cache/*.png';
                var svgFiles = payload.mmDir + 'modules/mmm-weatherchart/cache/*.svg';
				del([pngFiles, svgFiles]);
				var cachedFile = new Date().getTime() + imgType;
				var newImage = fs.createWriteStream(payload.mmDir + 'modules/mmm-weatherchart/cache/' + cachedFile);
				var imagePath = '/modules/mmm-weatherchart/cache/' + cachedFile;
				response.on('data', function(chunk){
					newImage.write(chunk);
				});
				response.on('end', function(){
					newImage.end();
					if(payload.useSVG && payload.customiseSVG){
				        console.log("imagePath = " + imagePath);

					    var svgFilepath = payload.mmDir + imagePath.substring(1);
					    var meteogram = self.readSVG(svgFilepath);

                        var customColours = new HashMap(payload.customColours);
					    var success = self.customiseSVG(meteogram, customColours, svgFilepath);
					    if(success == false){
					        console.log("Customise SVG failed, sending FAILED notification ");
					        self.sendSocketNotification("FAILED", false);
					        return; // bail out
					    }
					}
					
				    self.sendSocketNotification("MAPPED", imagePath);
					
				});
			});
		}
		
		
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
       
      
//       try {  // validate result
//           xmlChecker.check(meteogram);
//       }
//       catch (error){
//           console.log("XML Parser: " + error.name + " at line =" + error.line + ", column =" + error.column + ": " + error.message);
//           return false;
//       }
       
       console.log("writing file....");
       fs.writeFile(svgFilepath, meteogram, 'utf-8', function(err) {
           if(err) {
               return console.log(err);
           }

           console.log("The file was saved!");
       }); 
       console.log("<< customiseSVG");
       return true;
   
   },
	
	
});

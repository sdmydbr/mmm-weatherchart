Module.register("mmm-weatherchart", {

	defaults: {
		country: 'Germany',
		area: 'North_Rhine-Westphalia',
		city: 'Duisburg',
		updateInterval: 60 * 60 * 1000, // every hour
		hideBorder: true,
		negativeImage: true,
		retryDelay: 2500,
		domain: "www.yr.no",
		path: "/place/",
		mmDirectory: "/home/pi/MagicMirror/", // not sure whether it is possible to ask MM for this path?
		useSVG: true,
        customiseSVG: true,    // change colours in hex values or "default" for no change
        background_colour:    "#000000",
        title_text_colour : "#d9d9d9",    // "Meteogram for...."
        date_text_colour : "#f2f2f2",     // "Tuesday"
        temperature_text_colour: "#f2f2f2", // vertical axis
        rain_text_colour: "#f2f2f2",        // amount of rain 
        below_zero_line_colour: "#74c4fe", 
        above_zero_line_colour: "#ffdb48",    
        minor_gridline_colour: "#43443c",
        major_gridline_colour: "#9d9f93",
        wind_direction_colour: "#9d9f93",
        rain_colour: "#83d2fe",
        snow_colour: "#ffffff",   
        moon_colour_a: "#afb3b6", 
        moon_colour_b: "#acafb3"
		
	},

	// Define required scripts.
	getScripts: function() {
		return ["moment.js", "hashmap.js"];
	},

	getDom: function() {
		var wrapper = document.createElement("div");

		var object = document.createElement("object"); // FIX chrome not rendering temperature line when using <img> 
		object.data = this.srcMap;
		
		if (this.config.hideBorder) {
			wrapper.style.width = "810px";
			wrapper.style.height = "241px";
			wrapper.style.overflow = "hidden";
			wrapper.style.position = "relative";
		}
        wrapper.appendChild(object);
		
		return wrapper;
	},

	start: function() {
		Log.info("Starting module: " + this.name);
		this.loaded = false;
		this.scheduleUpdate(3); // wait some 3 secs and run initial update
		this.updateTimer = null;
		this.customColours = this.createCustomColourArray();
	},

	
	getWeatherMap: function() {
		var self = this;
		var filetype = this.config.useSVG == true ? "svg" : "png"
		var mapLocal = this.config.path + this.config.country + "/" + this.config.area + "/" + this.config.city + "/meteogram." + filetype;
		var payload = {
			domain: this.config.domain,
			path: mapLocal,
			mmDir: this.config.mmDirectory,
			useSVG: this.config.useSVG,
			customiseSVG: this.config.customiseSVG,
			customColours: this.customColours
		};
        console.log("Downloading weather map from URL: " + payload.domain + payload.path);
        console.log("Image type = " + filetype + " ; customiseSVG = " + this.config.customiseSVG);

		self.sendSocketNotification("FETCH_MAP", payload);
	},

	socketNotificationReceived: function(notification, payload) {
	    var self = this;
		if (notification === "MAPPED"){
			this.srcMap = payload;
			if (typeof this.srcMap !== "undefined") {
		        this.loaded = true;
		        this.updateDom();
			}
			this.scheduleUpdate();
		}
		else if (notification === "FAILED"){
		    this.scheduleUpdate(retryDelay);
		}
		    
	},
	
	
	
	// return 2d array (map) of new colours to be set in the meteogram
	// key = colour; value = replacement colour from config
	createCustomColourArray: function() {
	    var array = [
	        ["Meteogram for ", ''],
	        [", England \\(United Kingdom\\)", ''],
	        ["fill:black", 'fill:' + this.config.wind_direction_colour],
    	    ['#D7EFFA', this.config.background_colour],        // outer background
    	    ['rect x="0" y="0" fill="white"', 'rect x="0" y="0" fill="' + this.config.background_colour + '"'],  // inner background
    	    ["Arial;", "Arial; " + "fill: " + this.config.title_text_colour + ";"],
    	    ["#000080", this.config.title_text_colour],
    	    ["#212D2C", this.config.temperature_text_colour],
    	    ["#EAEBE6", this.config.minor_gridline_colour],
            ["#CFD0CA", this.config.major_gridline_colour],
    	    ["#8B918F", this.config.wind_direction_colour],
    	    ["#505956", this.config.date_text_colour],
    	    ["#F01C1C", this.config.above_zero_line_colour],
    	    ["#0280D9", this.config.below_zero_line_colour],
    	    ["#47c0e3", this.config.snow_colour],  
    	    ["#0062bf", this.config.rain_colour],  // rain drop
    	    ["#37BFE1", this.config.rain_colour],  // rain level
    	    ['g id="logo-yr"', 'g id="logo-yr" fill="#231F20" '], // make yr logo visible
    	    ['#686e73', this.config.moon_colour_a],
    	    ['#6a7075', this.config.moon_colour_b],
    	    ['1.3-1>', '1.3-1.7,2.2-2.1,2.4l0,0l0,0L6,12c0.8-0.5,2.9-1.4,2.9-4.4L9,0.4L9,0.4z" /></g></svg>'] // bugfix? for dodgy, unclosed yr logo xml
	    ];
	    
	    return array;
	},
	

	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}
		var self = this;
		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(function() {
		    self.getWeatherMap();
		}, nextLoad);
	},
});


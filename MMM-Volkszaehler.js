/* global Module */

/* Magic Mirror
 * Module: MMM-Volkszaehler
 *
 * By {{AUTHOR_NAME}}
 * {{LICENSE}} Licensed.
 */

Module.register("MMM-Volkszaehler", {
	defaults: {
		updateInterval: 60000,
		retryDelay: 5000
	},

	requiresVersion: "2.1.0", // Required version of MagicMirror

	start: function() {
		var self = this;
		var dataRequest = null;
		var dataNotification = null;
		var all = null;
		var jsonbody = null;

		//Flag for check if module is loaded
		this.loaded = false;

		// Schedule update timer.
		this.getData();
		setInterval(function() {
			self.updateDom();
		}, this.config.updateInterval);
	},

	/*
	 * getData
	 * function example return data and show it in the module wrapper
	 * get a URL request
	 */
	getData: function() {
		var self = this;

		var urlApi = "http://stromzaehler/middleware/data/3594ee50-087f-11eb-ba5a-77ef154c9d83.json?from=7+days+ago&to=now&group=day";
		var retry = true;

		var dataRequest = new XMLHttpRequest();
		dataRequest.open("GET", urlApi, true);
		dataRequest.onreadystatechange = function() {
			console.log(this.readyState);
			if (this.readyState === 4) {
				console.log(this.status);
				if (this.status === 200) {
					self.processData(JSON.parse(this.response));
				} else if (this.status === 401) {
					self.updateDom(self.config.animationSpeed);
					Log.error(self.name, this.status);
					retry = false;
				} else {
					Log.error(self.name, "Could not load data.");
				}
				if (retry) {
					self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
				}
			}
		};
		dataRequest.send();
	}, 
	/*getData: function() {
		
		var theUrl="http://stromzaehler/middleware/data/3594ee50-087f-11eb-ba5a-77ef154c9d83.json?from=7+days+ago&to=now&group=day"
		var dataRequest = new XMLHttpRequest();
		dataRequest.open( "GET", theUrl, false ); // false for synchronous request
		dataRequest.send( null );
		var dataObj=JSON.parse(dataRequest.responseText);
		var tuples = dataObj.data.tuples;
		var values = [];
		var dates = [];
		for(i=0; i<6;i++)
		{
		 values.push(tuples[i][1]*24);
		 var date =new Date(tuples[i][0]);
		 dates.push(date.getDate()+"."+("0" + (date.getMonth() + 1)).slice(-2));
		}
		
		//alert(dataObj.data.average); 
		//var dataerik = [12, 13, 3, 5, 2, 3];
		var all = [dates,values];
		return all;
			
			
		}, */

	/* scheduleUpdate()
	 * Schedule next update.
	 *
	 * argument delay number - Milliseconds before next update.
	 *  If empty, this.config.updateInterval is used.
	 */
	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}
		nextLoad = nextLoad ;
		var self = this;
		setTimeout(function() {
			self.getData();
		}, nextLoad);
	},

	getDom: function() {
		var self = this;

		// create element wrapper for show into the module
		var wrapper = document.createElement("div");
		// If this.dataRequest is not empty
		if (this.dataRequest) {
			var wrapperDataRequest = document.createElement("canvas");


			var tuples = this.jsonbody.data.tuples;
			
			var values = [];
			var dates = [];
			for(i=0; i<tuples.length;i++)
			{
			 values.push(tuples[i][1]*24);
			 var date =new Date(tuples[i][0]);
			 dates.push(date.getDate()+"."+("0" + (date.getMonth() + 1)).slice(-2));
			}
//test
			
			
			
			// check format https://jsonplaceholder.typicode.com/posts/1
			//wrapperDataRequest.innerHTML = this.dataRequest.data.average;
			var myChart = new Chart(wrapperDataRequest, {
				type: 'bar',
				data: {
					labels: dates,
					datasets: [{
						data: values,
						backgroundColor: 'rgba(255, 255, 255, 0.5)',
						borderWidth: 1
					}]
				},
				options: {
					scales: {
						yAxes: [{
							ticks: {
								beginAtZero: true
							}
						}]
					},
					legend: {
						display: false,
					}
				}
			});

			var labelDataRequest = document.createElement("label");
			// Use translate function
			//             this id defined in translations files
			labelDataRequest.innerHTML = this.translate("PV-Leistung letzte 7 Tage [W]");
          

			wrapper.appendChild(labelDataRequest);
			wrapper.appendChild(wrapperDataRequest);
		}

		// Data from helper
		if (this.dataNotification) {
			var wrapperDataNotification = document.createElement("div");
			// translations  + datanotification
			wrapperDataNotification.innerHTML =  this.translate("UPDATE") + ": " + this.dataNotification.date;

			wrapper.appendChild(wrapperDataNotification);
		}
		return wrapper;
	},

	getScripts: function() {
		return [


			'modules/MMM-Volkszaehler/node_modules/chart.js/dist/Chart.bundle.js',
			'moment.js'

		];
	},

	getStyles: function () {
		return [
			"MMM-Volkszaehler.css",
		];
	},

	// Load translations files
	getTranslations: function() {
		//FIXME: This can be load a one file javascript definition
		return {
			en: "translations/en.json",
			es: "translations/es.json"
		};
	},

	processData: function(data) {
		var self = this;
		this.dataRequest = data;
		this.jsonbody = data;
		if (this.loaded === false) { self.updateDom(self.config.animationSpeed) ; }
		this.loaded = true;

		// the data if load
		// send notification to helper
		this.sendSocketNotification("MMM-Volkszaehler-NOTIFICATION_TEST", data);
	},
    
	// socketNotificationReceived from helper
	socketNotificationReceived: function (notification, payload) {
		if(notification === "MMM-Volkszaehler-NOTIFICATION_TEST") {
			// set dataNotification
			this.dataNotification = payload;
			this.updateDom();
		}
	},
});

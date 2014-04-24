/** 
 * @projectDescription	The core Longana library
 *
 * @namespace	Longana
 * @author 		Bob Obringer
 * @version 	0.9 Alpha
 * 
 * Copyright(c) 2008
 */
Longana = {version		: "0.9"};

(function() {
	/*
	 * Make sure we've at least got Ext 2.2 installed
	 */
	if (typeof Ext == "undefined" || Ext.version.split("-")[0] < 2) {
		alert("Longana Could Not Load:  Ext 2.2 or higher is not loaded");
		return;
	};

	
	/*
	 * Get the path of longana.js
	 */
	var jsPath;
	var scripts = Ext.DomQuery.select("script");
	var lv = "longana-" + Longana.version;
	for (var i = 0; i < scripts.length; i++) {
		var script = scripts[i];
		if (script.src && script.src.match(lv)) {
			jsPath = script.src.split(lv)[0].split(location.host)[1] + lv + "/";
			i = scripts.length;
		}
	};
	

	/*
	 * Set the path of a blank 1x1 image
	 */	
	Ext.BLANK_IMAGE_URL = jsPath + "resources/images/blank.gif";
	
	
	
	/*
	 * Parse the query string
	 */
	var ags		= location.search.substring(1,location.search.length).replace(/\+/g, ' ').split("&");
	var qs		= {};
	for (var i = 1; i < ags.length; i++) {
		var pair = ags[i].split("=");
		qs[pair[0]] = pair[1];
	};
	
	
	/*
	 * Public Longana Functions
	 */	
	Ext.apply(Longana, {
		
		/** @id JSPath */
		JSPath 		: jsPath,
		
		/** @id NSFPath */
		NSFPath 	: "/longana/longana-" + Longana.version.replace(/\./g, "_") + ".nsf",
		
		/** @id URLCommand */
		URLCommand	:	ags[0],
		
		/** @id QS */
		QS			:	qs,
		
		/** @id decode */
		decode	: function(st) {
			return Ext.decode(st.replace(/([\x00-\x1f])/g, " "));
		}
	})
})();



Ext.ns("Longana.view", "Longana.number");



Longana.number = {
	
	punctuate	: function(val, sep, decpoint) {
		/*
		 * Function used to punctuate numbers
		 * 
		 * Author: Robert Hashemian
		 * http://www.hashemian.com/
		 * 
		 * You can use this code in any manner so long as the author's
		 * name, Web address and this disclaimer is kept intact.
		 */
		var sep = sep || ",";
		var decpoint = decpoint || ".";

  		var num = val.toString();
  
  		var a = num.split(decpoint);
  		var x = a[0];
  		var y = a[1];
  		var z = "";

		if (typeof(x) != "undefined") {
			// reverse so regex can properly split at thousands
			for (i = x.length - 1; i >= 0; i--) {
				z += x.charAt(i);
			}
			
			// insert the punctuation
 			z = z.replace(/(\d{3})/g, "$1" + sep);
			if (z.slice(-sep.length) == sep) {
				z = z.slice(0, -sep.length);
			}
   		
			// reverse again to get back the number
			x = "";
    		for (i = z.length - 1; i >= 0; i--) {
				x += z.charAt(i);
			}
				
			// add the fraction back in, if it was there
			if (typeof(y) != "undefined" && y.length > 0) {
				x += decpoint + y;
			}
		}
		
 		return x;
	}
}

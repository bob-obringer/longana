/**
 * @author bobringer
 */
Longana.view.Reader = function(design){
	this.design = design;

	var fields = [];
	Ext.each(design.columns, function(col) {
		fields.push({
			name	: col.name
		});
	});
	
	fields.push({
		name:"position"
	},{
		name:"noteid"
	},{
		name:"unid"
	},{
		name:"siblings"
	});

	/*
	 * recordDesign is the record "template" to be used for our datastore
	 */
	var recordDesign = Ext.data.Record.create(fields);
	
	Longana.view.Reader.superclass.constructor.call(this, {}, recordDesign);
};
Ext.extend(Longana.view.Reader, Ext.data.JsonReader, {
    read : function(r){
		var data = Longana.decode(r.responseText);
        return this.readRecords(data);
    },
	
	

	/*
	 * Lifted right from Ext.data.JsonReader and modified so it can properly process our domino returned code
	 */
    readRecords : function(data){

        /*
         * After any data loads, the raw JSON data is available for further custom processing.  If no data is
         * loaded or there is a load exception this property will be undefined.
         */
		this.jsonData = data;
		var Record = this.recordType;
		var fields = Record.prototype.fields;

		/*
		 * This is the root of our view entry objects
		 */
		var totalRecords = data["@rangeentries"] || data["@toplevelentries"];


		if (!totalRecords || totalRecords == "0") {
			return {
				success: false,
				records: [],
				totalRecords: totalRecords
			};
		}
		
		var root = data.viewentry;
		var success = true;
		var records = [];

		Ext.each(root, function(rec) {
			console.log(Ext.encode(rec));
			var values = {};
			
			var id = rec["@unid"] + Math.random();

			values.position = rec["@position"];
			values.noteid = rec["@noteid"];
			values.unid = rec["@unid"];
			values.siblings = rec["@siblings"];

			Ext.each(rec.entrydata, function(item) {
				console.log(Ext.encode(item["@name"].replace(/\$/g, "_S_")));
				values[item["@name"].replace(/\$/g, "_S_")] = this.formatValue(item);
			}, this);
			
			
			records.push(new Record(values, id));
		}, this);
		
		
		return {
			success : success,
			records : records,
			totalRecords : totalRecords
		};
    },
	
	
	/*
	 * Custom function to find and return data from a domino view based on the type of data in the column
	 */
	formatValue		: function(item) {
		/*
		 * If we have text, just bring it back here... no need to check for anything else
		 */
		if (item.text) return item.text["0"];
		

		/*
		 * Get our column design in case we need to know more about the design of this column...
		 */
		var colNum = (r["@columnnumber"] - 0) + ((this.view.restrictToCategory) ? 1 : 0)
		var colDesign = this.viewDesign.column[colNum];
		
		
		/*
		 * Number columns could potentially contain domino icons, we test the column design to see which we should show
		 */
		if (r.number) {
			if (colDesign["@icon"]) {
				if (r.number[0] == "0") {
					return "<img src='/icons/ecblank.gif' style='height:12px'>";
				} else {
					return "<img src='/icons/vwicn" + (String.leftPad(r.number[0], 3, '0')) + ".gif'>";
				};
			} else {
				return r.number[0];
			}
			return (colDesign["@icon"]) ? "<img src='/icons/vwicn" + (String.leftPad(r.number[0], 3, '0')) + ".gif'>" : r.number[0];
		}
		
		/*
		 * Textlists and numberlists are formatted the same way, only the number list contains
		 * number objects instead of text objects
		 */
		if (r.textlist || r.numberlist) {
			var t = (r.textlist) ? r.textlist.text : r.numberlist.number;
			var val = [];
			for (var i = 0; i < t.length; i++) {
				val.push(t[i][0]);
			};
			
			var sep = colDesign["@listseparator"];
			switch(sep) {
				case "newline"	: sep = "<br />"; break;
				case "semicolon": sep = "; "; break;
				case "space"	: sep = " "; break;
				default			: sep = ", "; break;
			}
			return val.join(sep);
		}
		
		
		/*
		 * Dates are returned in a datetime object
		 */
		if (r.datetime) {
			
			/*
			 * Get our date components and turn it into a javascript date object...
			 * make this more efficient with time, check domino format based on what is saved...
			 * Domino doesn't always return the same format if we don't store both date/time
			 */
			var dtext;
			var dt = r.datetime[0];
			if (dt.indexOf("T") !== 0) {
				var y = dt.substring(0,4);
				var m = dt.substring(4,6);
				var d = dt.substring(6,8);
				var h = dt.substring(9,11);
				var min = dt.substring(11,13);
				var s = dt.substring(13,15);
				
				dtext = ((m) ? (m + "/" + d + "/" + y) : "") + " ";
				dtext += (h) ? (h + ":" + min + ":" + s) : "";
			} else {
				var th = dt.substring(1,3);
				var tmin = dt.substring(3,5);
				var ts = dt.substring(5,7);
				dtext =  "1/1/1899 " + th + ":" + tmin + ":" + ts;
				
			}
			
			var jsdt = new Date(dtext.trim());

			


			/*
			 * For now, just use what we get from the domino design...
			 * In the future we should allow the developer to pass a format string in a config to format the column
			 */
			this.view.columnDateFormats = (this.view.columnDateFormats || {});
			if (this.view.columnDateFormats[r["@columnnumber"]]) {
				return jsdt.format(this.view.columnDateFormats[r["@columnnumber"]]);
			}
			
			if (this.view.defaultDateFormat) {
				return jsdt.format(this.view.defaultDateFormat);
			}
			
			var dtDesign = colDesign.datetimeformat["@show"];
			switch (dtDesign) {
				case "time"		: return jsdt.format("g:i a");
				case "date"		: return jsdt.format("M j, Y");
				case "datetime"	: return jsdt.format("M j, Y,  g:i a");
			}
		}
	}
});
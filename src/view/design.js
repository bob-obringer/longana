/**
 * @class 		Longana.view.Design
 * @extends 	Ext.util.Observable
 * @projectDescription	The Longana representation of a Lotus Domino View design
 * @constructor
 * Creates a new Longana.view.Design object
 * @param		{Object} config A config object containing the information needed to create the Design
 * 
 *
 * @namespace	Longana.view.Design
 * @author 		Bob Obringer
 * @version 	0.9 Alpha
 */
Longana.view.Design = function(config) {
	/*
	 * Required config options
	 * 
	 * viewName
	 * 
	 * 
	 * Optional config options
	 * 
	 * dbPath
	 * currency
	 * extendedColumn
	 * columnConfig (object with column numbers as keys and config object values...
	 * 		for example... columnConfig : {"1":{currency:"$"}}
	 * 
	 * 		currency
	 * 		numberformatter (future)
	 *		dateformatter (future) 
	 */

	
	/*
	 * Add the design configuration object
	 */
	Ext.apply(this, config, {
		dbPath			: Longana.Session.getDBPath(),		//dbPath should ALWAYS be passed in the config... leave this???
		columnConfig	: {},
		currency		: "$"
	});
	
	this.addEvents({
		"designload" : true
	});
	
	/*
	 * Load the view design
	 */
	this.loadDesign();
	
	Longana.view.Design.superclass.constructor.call(this);
};


Ext.extend(Longana.view.Design, Ext.util.Observable, {
	loadDesign	: function() {
		Ext.Ajax.request({
			url		: this.dbPath + "/" + this.viewName + "?ReadDesign&OutputFormat=JSON",
			scope	: this,
			success	: function(r) {
				/*
				 * Longana.view.Design.dominoDesign contains the raw JSON from the view design
				 */
				this.dominoDesign = Longana.decode(r.responseText);
				var d = this.dominoDesign;
				
				/*
				 * Longana.view.Design.extendedColumn identifies the "greedy" column that uses
				 * all remaining space, when passed as a config option, it overrides any domino settings
				 */
				if (!this.extendedColumn) {
					this.extendedColumn = false;
				}
				
				
				/*
				 * Does this view alternate row colors?
				 */
				if (d["@altrowcolor"]) {
					this.altRowColor = d["@altrowcolor"];
				}
				
				/*
				 * Does this view wrap rows?
				 */
				this.wrap = (d["@rowlines"] && (d["@rowlines"] - 0 > 1));
				
				/*
				 * Does this view header wrap rows?
				 */
				this.headerWrap = (d["@headerlines"] && (d["@headerlines"] - 0 > 1));
				
				/*
				 * Are we using a custom simple header?
				 */
				this.simpleHeader = (typeof d["@headerbgcolor"] == "undefined");
				if (this.simpleHeader) {
					this.headerBackgroundColor = d["@headerbgcolor"];
				}
				
				/*
				 * Row Spacing
				 */
				this.spacing = 0;
				if (d["@spacing"]) {
					this.spacing = d["@spacing"] * 2;
				}
				
				/*
				 * Column totals color
				 */
				this.totalsColor = d["@totalscolor"];
				
				/*
				 * Longana.view.Design.columns is an array of columns used for Longana views
				 */
				this.columns = [];
				
				var i = -1;
				Ext.each(d.column, function(col) {
					i++;
					
					/*
					 * Check to see if this is the autoexpanded column
					 */
					if (col["@extendcolwidth"] == "true" && this.extendedColumn === false) {
						this.extendedColumn = i;
					}

					/*
					 * Find out what the possibilities are for sorting
					 */
					var sortasc = (col["@resortdescending"] && col["@resortdescending"] == "true");
					var sortdsc = (col["@resortascending"] && col["@resortascending"] == "true");
					var sortable = false;
					if (sortasc && sortdsc) {
						sortable = "both";
					} else if (sortasc) {
						sortable = "asc";
					} else if (sortdsc) {
						sortable = "dsc";
					}
					
					
					/*
					 * Set up the columns list separator
					 */
					var sep = ", ";
					switch(col["@listseparator"]) {
						case "newline"		: sep = "<br />"; break;
						case "semicolon"	: sep = "; "; break;
						case "space"		: sep = " "; break;
					}
					
					/*
					 * Set up the column alignment
					 */
					var align = "left";
					if (col["@align"]) {
						switch(col["@align"]) {
							case "1"	: align = "right"; break;
							case "2"	: align = "center"; break;
						}						
					}
					var halign = "left";
					if (col["@headeralign"]) {
						switch(col["@headeralign"]) {
							case "1"	: halign = "right"; break;
							case "2"	: halign = "center"; break;
						}						
					}
					
					
					/*
					 * Get the text style for this column
					 */
					var cstyle = "font-family:" + ((col.cfont["@face"] == "Helvetica") ? "Arial" : col.cfont["@face"]) + "; " +
						"color:" + col.cfont["@color"] + "; " +
						"font-size:" + col.cfont["@size"] + "px";
					if (col.cfont["@style"].match(/b/)) {
						cstyle += "; font-weight:bold";
					}
					if (col.cfont["@style"].match(/i/)) {
						cstyle += "; font-style:italic";
					}
					
					
					/*
					 * Get the text style for this column header
					 */
					var hstyle = "font-family:" + ((col.hfont["@face"] == "Helvetica") ? "Arial" : col.hfont["@face"]) + "; " +
						"color:" + col.hfont["@color"] + "; " +
						"font-size:" + col.hfont["@size"] + "px";
					if (col.hfont["@style"].match(/b/)) {
						hstyle += "; font-weight:bold";
					}
					if (col.hfont["@style"].match(/i/)) {
						hstyle += "; font-style:italic";
					}
					
					
					
					/*
					 * Create a number formatter for each column.  The number formatter is a function that
					 * replicates the format that would be used in the notes client view
					 */
					var cnf = col.numberformat;
					
					var fix = function(inp) {
						return (inp.toFixed(cnf["@digits"]));
					};
					var isFixed = (cnf["@format"] == "fixed");
					var isPunctuated = (cnf["@punctuated"] && cnf["@punctuated"] == "true");
					var isParens = (cnf["@parens"] && cnf["@parens"] == "true");


					var self = this;
					var nf;
					
					/*
					 * Format "percent" columns
					 */
					if (cnf["@percent"] && cnf["@percent"] == "true") {
						nf = function(inp) {
							var isNeg = false;
							if (inp < 0) {
								isNeg = true;
								inp = Math.abs(inp);
							}
							
							var n = inp * 100;
							if (isFixed) {
								n = fix(n);
							}

							n = (isPunctuated) ? Longana.number.punctuate(n) : n;
							if (isNeg) {
								if (isParens) {
									return "(" + n + "%)";
								} else {
									return "-" + n + "%";
								}
							}
							return n + "%";
						};

						
					/*
					 * format "bytes" columns
					 */
					} else if (cnf["@bytes"] == "true") {
						nf = function(inp) {
							var isNeg = false;
							if (inp < 0) {
								isNeg = true;
								inp = Math.abs(inp);
							}
							
							if (inp === 0) {
								return "0K";
							}
							
							var r;
							if (inp / 1024 < 1024) {
								r = Math.round(inp / 1024);
								if (r === 0) {
									r = 1;
								}
								r = (isPunctuated) ? Longana.number.punctuate(r) : r;
								if (isNeg) {
									if (isParens) {
										return "(" + r + "K)";
									} else {
										return "-" + r + "K";
									}
								} 
								return r + "K";
								
							}
							
							if (inp / 1024 / 1024 < 1024) {
								r = Math.round(inp / 1024 / 1024 * 10) / 10;
								if (r === 0) {
									r = 1;
								}
								r = (isPunctuated) ? Longana.number.punctuate(r) : r;
								if (isNeg) {
									if (isParens) {
										return "(" + r + "M)";
									} else {
										return "-" + r + "M";
									}
								} 
								return r + "M";
							}
							
							
							
							if (inp / 1024 / 1024 / 1024 < 1024) {
								r = Math.round(inp / 1024 / 1024 / 1024 * 10) / 10;
								if (r === 0) {
									r = 1;
								}
								
								r = (isPunctuated) ? Longana.number.punctuate(r) : r;
								if (isNeg) {
									if (isParens) {
										return "(" + r + "G)";
									} else {
										return "-" + r + "G";
									}
								} 
								return r + "G";
							}

							
							r = Math.round(inp / 1024 / 1024 / 1024 / 1024 * 10) / 10;
							if (r === 0) {
								r = 1;
							}
							r = (isPunctuated) ? Longana.number.punctuate(r) : r;
							if (isNeg) {
								if (isParens) {
									return "(" + r + "T)";
								} else {
									return "-" + r + "T";
								}
							} 
							return r + "T";
						};
						
						
					/*
					 * Format "scientific" columns
					 */
					} else if (cnf["@format"] == "scientific") {
						nf = function(inp) {
							var isNeg = false;
							if (inp < 0) {
								isNeg = true;
								inp = Math.abs(inp);
							}
							
							var i = inp * 100;

							i = i.toString().split(".")[0];
							var val = (i / (Math.pow(10, i.length - 2)));

							val = fix(val / 10);
							
							var exp = "E+" + String.leftPad(i.length - 3, 2, "0");

							if (isNeg) {
								if (isParens) {
									return "(" + val + exp + ")";
								} else {
									return "-" + val + exp;
								}
							}
							return val + exp;
						};
						
						
					/*
					 * Format "currency" columns
					 */
					} else if (cnf["@format"] == "currency") {
						nf = function(inp) {
							var isNeg = false;
							if (inp < 0) {
								isNeg = true;
								inp = Math.abs(inp);
							}
							
							inp = (isPunctuated) ? Longana.number.punctuate(fix(inp)) : fix(inp);
							var cur = (self.columnConfig.currency || self.currency || "$");
							
							if (isNeg) {
								if (isParens) {
									return "(" + cur + inp + ")";
								} else {
									return cur + "-" + inp;
								}
							}
							return cur + inp;
						};
					
					
					/*
					 * Format "general number" columns
					 */
					} else {
						nf = function(inp) {
							var isNeg = false;
							if (inp < 0) {
								isNeg = true;
								inp = Math.abs(inp);
							}
							inp = (isPunctuated) ? Longana.number.punctuate(inp) : inp;
							inp = (cnf["@varying"] && cnf["@varying"] == "true") ? inp : fix(inp);  
							if (isNeg) {
								if (isParens) {
									return "(" + inp + ")";
								} else {
									return "-" + inp;
								}
							}
							return inp;
						};
					}
					
					
					/*
					 * Create the view column design object optimized for Longana
					 */
					var c = {
						width 		: col["@width"],
						name		: col["@name"].replace(/\$/g, "_S_"),
						title		: col["@title"],
						categorized	: (col["@sortcategorize"] && col["@sortcategorize"] == "true") ? true : false,
						sorted		: (col["@sort"] && col["@sort"] == "true") ? true : false,
						sortable	: sortable,
						resize		: (col["@resize"] && col["@resize"] == "true") ? true : false,
						separator	: sep,
						icon		: (col["@icon"] && col["@icon"] == "true") ? true : false,
						align		: align,
						headerAlign	: halign,
						response	: (col["@response"] && col["@response"] == "true") ? true : false,
						twistie		: (col["@twistie"] && col["@twistie"] == "true") ? true : false,
						twistieImage	: (col["@twistieimage"]) ? col["@twistieimage"] : false,
						totals		: (col["@totals"] && col["@totals"] == "true") ? true : false,
						columnStyle	: cstyle,
						headerStyle	: hstyle,
						numberFormat	: nf
					};
					
					this.columns.push(c);
				}, this);
				
				/*
				 * We only make our last column greedy if no other column is greedy
				 */
				if (this.extendedColumn === false && d["@extendlastcolumn"] != "false") {
					this.extendedColumn = i;
				}
				
				this.fireEvent("designload", "18");
			}
		});
	}
});
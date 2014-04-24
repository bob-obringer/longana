/**
 * @author bobringer
 */
Longana.view.View = function(config){

	/*
	 * Since we need to add the config to initialConfig (used by view.Design), apply the defaults
	 * directly to the config object instead of applying them as defaults to "this"
	 */
	Ext.applyIf(config, {
		dbPath		: Longana.Session.getDBPath(),
		pageSize	: 100,
		remoteSort	: true
	});
	this.initialConfig = config;
	
	Ext.apply(this, config);
	
	Longana.view.View.superclass.constructor.call(this);
	
	this.loadDesign();
};


Ext.extend(Longana.view.View, Ext.util.Observable, {
	loadDesign	: function() {
		this.design = new Longana.view.Design(Ext.apply(this.initialConfig, {
			listeners	: {
				scope		: this,
				designload : function() {
					this.createDataStore();
				}
			}
		}));
	},
	

	createDataStore : function() {
		this.baseParams = {
			StartKey			: this.startKey || null,
			UntilKey			: this.untilKey || (this.startKey) ? this.startKey + "~~" : null,
			RestrictToCategory	: this.restrictToCategory || null,
			OutputFormat		: "JSON",
			Count				: this.pageSize
		};
		
		this.proxy = new Ext.data.HttpProxy({
			url			: this.dbPath + "/" + this.viewName + "?ReadViewEntries",
    		method		: 'GET'
		});
		
		this.reader = new Longana.view.Reader(this.design);
		
		this.store = new Ext.data.Store({
			baseParams		: this.baseParams,
			proxy			: this.proxy,
			reader			: this.reader,
			remoteSort		: this.remoteSort
		});
		
		this.store.load();
	}
});
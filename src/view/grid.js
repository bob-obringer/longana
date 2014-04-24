Longana.view.Grid = function(view){
	this.longanaView = view;
	
	/*
	 * Get the selection model
	 */
	 var selModel = (view.showCheckboxes) 
		? new Ext.grid.CheckboxSelectionModel({singleSelect:view.singleSelect})
		: new Ext.grid.RowSelectionModel({singleSelect:view.singleSelect});


	/*
	 * Create the column model and add some utility columns
	 */
	var columns = [];
	if (view.showCheckboxes) {columns.push(selModel);}
	if (view.showRowNumberer) {columns.push(new Ext.grid.PagedRowNumberer(view.showRowNumberer));}

	/*
	 * Loop though each column specified in the view design.  Add all visible columns to the model
	 */	
	Ext.each(view.design.columns, function(col) {
		if (col.visible) {
			columns.push({
				dataIndex	: col.name,
				id			: col.name,
				header		: col.title,
				width		: parseInt(col.width),
				align		: col.align,
				sortable	: col.sortable,
				resizable	: col.resizable,
				menuDisabled: !col.sortable,
				css			: col.css
			})
		}
	});
	var colModel = new Ext.grid.ColumnModel(columns);

	
	
	/*
	 * Set up the load mask for our view
	 */
	var loadMask = false;
	if (view.hideLoadMask !== true) {
		loadMask = {
			msg			: "Loading " + view.title,
			msgClass	: "x-mask-loading"
		};
	}



	/*
	 * Create the grid view configuration object
	 */
	var viewConfig = Ext.apply({}, view.viewConfig);


	/*
	 * Set up our grid view containing "color" columns.  This is a little tricky since we don't
	 * want to create new css files every time we render a grid row.  Every time we request a
	 * new store load, we build any new css classes we need, remove the old stylesheet, and
	 * create a new stylesheet with new classes loaded by the view.
	 */
	if (view.design.colorColumn) {

		view.cssClasses = {};
		view.rowStyleID = "";
		view.rowStyles = "";

		/*
		 * In order to change the look of a class, we need to create a custom
		 * getRowClass function for the gridview.
		 */
		viewConfig.getRowClass = function (row, index) {
			var val = row.data[view.design.colorColumn];
			
			/*
			 * If our value is "", we should display the default row color of the grid
			 */
			if (val === "") {
				return ("x-grid3-row-" + (index % 2 === 0) ? "" : "alt");
			}

			/*
			 * Get the class name we need for this row
			 */			
			var cls = view.id + "-color-" + val.replace(/\#/g, "");

			/*
			 * If our row style doesn't yet exist in the style sheet, we need to create a new class
			 */
			if (!view.cssClasses[val]) {
				view.cssClasses[val] = true;
				view.rowStyles += "." + cls + "{background:" + val + " !important}";
			}
			
			return cls;
		};
		
		/*
		 * Before we reload the store, clear our style and classes object
		 */
		view.store.on("beforeload", function() {
			view.rowStyles = "";
			view.cssClasses = {};
		}, this);
		
		/*
		 * After we load the store, delete the existing stylesheet for this grid
		 * and then create a new sheet for this grid
		 */
		view.store.on("load", function() {
			Ext.util.CSS.removeStyleSheet(view.rowStyleID);
			view.rowStyleID = Ext.id();
			Ext.util.CSS.createStyleSheet(view.rowStyles, view.rowStyleID);
		}, this);
	}
	
	
	/*
	 * This is where we would add any defaults to our grid
	 */
	//Ext.applyIf(viewConfig, {
		//autoFill	: true
	//})





	/*
	 * Create the config object for this grid
	 */
	var config = {
		id					: view.id + "-grid",
		border				: false,
		
		colModel			: colModel,
		selModel			: selModel,
		store				: view.store,
		loadMask			: loadMask,
		viewConfig			: viewConfig,
		//bbar				: new Longana.view.PagingToolbar(view),
		//tbar				: [],

		autoExpandColumn	: view.design.autoExpandColumn,
		autoHeight			: view.autoHeight,
		enableDragDrop		: view.enableDragDrop,
		enableColumnMove	: view.enableColumnMove,
		enableHdMenu		: view.enableHdMenu,
		hideHeaders			: view.hideHeaders,
		stripeRows			: view.design.altRowColor,
		trackMouseOver		: ((view.trackMouseOver === false) ? false : true),
		
		listeners	: {
			scope		: this,
			rowdblclick	: function(grid, rowIndex, ev) {
				this.clickHandler("rowdblclick", grid, rowIndex, ev);
			},
			rowclick : function(grid, rowIndex, ev) {
				this.clickHandler("rowclick", grid, rowIndex, ev);
			}
		}
	};
	
	Longana.view.Grid.superclass.constructor.call(this, config);



	/*
	 * Build CSS rules used to style this grid
	 */

	
	/*
	 * If we have a are tracking mouse over, we need to either set a custom style or add !important
	 * to the default style so it overrides any additional custom row-alt styles
	 */
	var css = "";
	if (view.trackMouseOver !== false) {
		
		/*
		 * If the trackMouseOver config is a string, use it as the css rule for the row-over class.
		 * If this config overrides the background rule it needs to be set as !important
		 */
		if (typeof view.trackMouseOver == "string") {
			css += "#" + this.id + " .x-grid3-row-over{" + view.trackMouseOver + "}"
		} else {
		/*
		 * Using the default mouseover allows custom row-alt background to bleed through.  Adding
		 * !important here forces the mouseover class to appear above the row-alt background
		 */
			var r = Ext.util.CSS.getRule(".x-grid3-row-over", true)
			css += "#" + this.id + " .x-grid3-row-over{background:" + r.style.background + " !important;}"
		}
	}

	
	/*
	 * If our view uses a custom role color, add it to the style here.  Since domino doesn't pass row color
	 * when passing the design, it needs to be specified directly in the view config
	 */	
	if (view.rowColor) {
		css += "#" + this.id + " .x-grid3-row {background-color:" + view.rowColor + ";}";
	}

	/*
	 * Set the row-alt color based on the view configuration if it exists, or from the domino design if set
	 */
	if (view.altRowColor || view.design.altRowColor) {
		css += "#" + this.id + " .x-grid3-row-alt {background-color:" + (view.altRowColor || view.design.altRowColor) + ";}";
	}
	
	
	/*
	 * If our view wraps text, set up the styles here
	 */
	if (view.design.wrap) {
		css += "#" + this.id + " .x-grid3-cell-inner {white-space:normal;}";
	}
	
	
	/*
	 * We need to make sure that our "selected" rows override all other styles
	 */
	if (view.selectedRowStyle) {
		css += "#" + this.id + " .x-grid3-row-selected {" + view.selectedRowStyle + ";}";
	} else {
		var sr = Ext.util.CSS.getRule(".x-grid3-row-selected");
		css += "#" + this.id + " .x-grid3-row-selected{background:" + sr.style.background + " !important;}";
	}
	
	
	/*
	 * If we're using a row numberer, set the backgorund for that cell here
	 */
	if (view.showRowNumberer) {
		css += "#" + this.id + " .x-grid3-body .x-grid3-td-numberer {background-color:#F9F9F9 !important;}"	
	}
	
	
	/*
	 * Add the stylesheet for this view
	 */	
	Ext.util.CSS.createStyleSheet(css);
 
};

Ext.extend(Longana.view.Grid, Ext.grid.GridPanel, {
    afterRender: function() {
        Longana.view.Grid.superclass.afterRender.apply(this);	
		
		/*
		 * For some reason, the empty text doesn't display unless we reapply it
		 * and do a layout after our view is rendered
		 */
		this.getView().applyEmptyText();
		this.getView().layout();
    },
	
	
	/*
	 * The clickHandler abstracts our rowclick and rowdblclick handlers.  It
	 * passes the following parameters to the handlers
	 * unid, 
	 */
	clickHandler : function(type, grid, rowIndex, ev) {
		var v = this.longanaView;
		var rec = v.store.getAt(rowIndex);
		var unid = rec.get("unid");
				
		var cols = []
		Ext.each(v.design.columns, function(col) {
			cols.push(rec.get(col.name))
		})
		
		v.fireEvent(type, unid, rec, cols, v);
	}
})
Ext.reg("l-viewgrid", Longana.view.Grid);






Ext.grid.PagedRowNumberer = function(len){
	var config = {};
	if (len !== true) {
		config.width = len * 11;
	}
	
    Ext.apply(this, config);
    if(this.rowspan){
        this.renderer = this.renderer.createDelegate(this);
    }
};

Ext.grid.PagedRowNumberer.prototype = {
    header		: "",
    width		: 40,
    sortable	: false,
    fixed		: false,
    hideable	: false,
    dataIndex	: '',
    id			: 'numberer',
    rowspan		: undefined,
    renderer 	: function(v, p, record, rowIndex, colIndex, store){
		p.css = "x-paged-row-numberer"
        if(this.rowspan){
            p.cellAttr += ' rowspan="'+this.rowspan+'"';
        }
        var i = (store.lastOptions.params) ? (store.lastOptions.params.start || 0) : 1;
        if (isNaN(i)) {
            i = 0;
        }
        return (i + rowIndex).toFixed(0).toLocaleString();
    }
}; 
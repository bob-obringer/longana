/**
 * namespace Longana.Session
 * @class Session
 * @sdoc session.sdoc
 * Functions to get information about our current user's session
 */
Longana.Session = function(){
	
	/*
	 * c is the private member that holds the contents of the session init config object
	 */
	var c = {};
	
	return	{
		/*
		 * Any page that requires additional session information must include the Session - Initialize
		 * subform from longana.nsf in order to capture information used in other places
		 * 
		 * This may change in a future release as we might just require a single subform to be included
		 * on any of your notes forms in which you are going to use Longana
		 */
		init	: function(config) {
			Ext.apply(c, config);
			//Ext.apply(Longana.Session, config)
			Longana.Session.isInitialized = true;
		},
		
		
		/** @id Longana.Session.getUserName */
		getUserName	: function(action) {
			if (!action || action ==="") {
				return c.userName;
			}
			var comps = c.userName.split("/");
			switch (action.toLowerCase()) {
				case "cn"	: return comps[0].replace(/CN=/, "");
			}
		},
		
		getRoles : function() {
			return c.userRoles;
		},
		
		
		/*
		 * Returns whether or not the current user is part of a role.
		 */
		hasRole			: function() {
			for (var i = 0; i < arguments.length; i++) {
				if (c.userRoles.indexOf(arguments[i]) > -1) {
					return true;
				}
			}
			return false;
		},
		
		
		getDBPath		: function() {
			var p = location.pathname.toString();
			var i = p.toLowerCase().lastIndexOf('.nsf');
			return p.substring(0, i + 4);
		}
	};
}();


/*
 * Make sure we've loaded the session subform from Longana.nsf.  If not, we don't have the stuff we really need about our session
 */
Ext.onReady(function() {
	var msg = [
		"Longana Session has not been initalized.\n\nBe sure to include the session subform from Longana.nsf\n",
		"in each of your forms that use the Longana framework."
	].join("");
	if (!Longana.Session.isInitialized) {
		alert(msg);
	}
});

/*******************************************************************************
 * Copyright 2014 The MITRE Corporation 
 *   and the MIT Kerberos and Internet Trust Consortium
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *   http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/

Backbone.Model.prototype.fetchIfNeeded = function(options) {
	var _self = this;
	if (!options) {
		options = {};
	}
	var success = options.success;
	options.success = function(c, r) {
		_self.isFetched = true;
		if (success) {
			success(c, r);
		}
	};
	if (!this.isFetched) {
		return this.fetch(options);
	} else {
		return options.success(this, null);
	}
};
Backbone.Collection.prototype.fetchIfNeeded = function(options) {
	var _self = this;
	if (!options) {
		options = {};
	}
	var success = options.success;
	options.success = function(c, r) {
		_self.isFetched = true;
		if (success) {
			success(c, r);
		}
	};
	if (!this.isFetched) {
		return this.fetch(options);
	} else {
		return options.success(this, null);
	}
};


var URIModel = Backbone.Model.extend({

    validate: function(attrs){

        var expression = /^(?:([a-z0-9+.-]+:\/\/)((?:(?:[a-z0-9-._~!$&'()*+,;=:]|%[0-9A-F]{2})*)@)?((?:[a-z0-9-._~!$&'()*+,;=]|%[0-9A-F]{2})*)(:(?:\d*))?(\/(?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*)?|([a-z0-9+.-]+:)(\/?(?:[a-z0-9-._~!$&'()*+,;=:@]|%[0-9A-F]{2})+(?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*)?)(\?(?:[a-z0-9-._~!$&'()*+,;=:\/?@]|%[0-9A-F]{2})*)?(#(?:[a-z0-9-._~!$&'()*+,;=:\/?@]|%[0-9A-F]{2})*)?$/i;
        var regex = new RegExp(expression);

        if (attrs.item == null || !attrs.item.match(regex)) {
            return "Invalid URI";
        }
    }

});


/*
* Backbone JS Reusable ListWidget
*  Options
* {
*   collection: Backbone JS Collection
*   type: ('uri'|'default')
*   autocomplete: ['item1','item2'] List of auto complete items
* }
*
 */
var ListWidgetChildView = Backbone.View.extend({

    tagName: 'tr',

    events:{
        "click .btn-delete":'deleteItem'
    },
    
    deleteItem:function (e) {
    	e.preventDefault();
        //this.$el.tooltip('delete');
        
        this.model.destroy({         
        	error:function (error, response) {
        		console.log("An error occurred when deleting from a list widget");

				//Pull out the response text.
				var responseJson = JSON.parse(response.responseText);
        		
        		//Display an alert with an error message
        		$('#modalAlert div.modal-body').html(responseJson.errorMessage);
        		
    			 $("#modalAlert").modal({ // wire up the actual modal functionality and show the dialog
    				 "backdrop" : "static",
    				 "keyboard" : true,
    				 "show" : true // ensure the modal is shown immediately
    			 });
        	}
        });
        
    },

    initialize:function () {

        if (!this.template) {
            this.template = _.template($('#tmpl-list-widget-child').html());
        }

    },

    render:function () {
        this.$el.html(this.template(this.model.toJSON()));

        if (this.model.get('item').length > 30) {
            this.$el.tooltip({title:this.model.get('item')});
        }
        return this;
    }
});

var ListWidgetView = Backbone.View.extend({

    tagName: "table",

    childView:ListWidgetChildView,

    events:{
        "click .btn-add":"addItem",
        "keypress":function (e) {
        	// trap the enter key
            if (e.which == 13) {
            	e.preventDefault();
                this.addItem(e);
                $("input", this.$el).focus();
            }
        }
    },

    initialize:function () {

        if (!this.template) {
            this.template = _.template($('#tmpl-list-widget').html());
        }

        this.$el.addClass("table table-condensed table-hover table-striped span4");
        this.collection.bind('add', this.render, this);
        this.collection.bind('remove', this.render, this);
    },

    addItem:function(e) {
    	e.preventDefault();

    	var input_value = $("input", this.el).val().trim();

        var model;

        if (this.options.type == 'uri') {
            model = new URIModel({item:input_value});
        } else {
            model = new Backbone.Model({item:input_value});
            model.validate = function(attrs) { 
            	if(!attrs.item) {
            		return "value can't be null";
            	}
            };
        }

        // if it's valid and doesn't already exist
        if (model.get("item") != null && this.collection.where({item: input_value}).length < 1) {
            this.collection.add(model);
        } else {
            // else add a visual error indicator
            $(".control-group", this.el).addClass('error');
        }
    },

    render:function (eventName) {

        this.$el.html(this.template({placeholder:this.options.placeholder}));

        // bind autocomplete options
        if (this.options.autocomplete) {
            $('input', this.$el).typeahead({source:this.options.autocomplete});
        }

        _self = this;

        if (_.size(this.collection.models) == 0) {
    		$("tbody", _self.el).html($('#tmpl-list-widget-child-empty').html());
        } else {
        	_.each(this.collection.models, function (model) {
        		var el = new this.childView({model:model}).render().el;
        		$("tbody", _self.el).append(el);
        	}, this);
        }

        return this;
    }
    
});

var BlackListModel = Backbone.Model.extend({
	idAttribute: 'id',
	
	urlRoot: 'api/blacklist'
});

var BlackListCollection = Backbone.Collection.extend({
	initialize: function() { },

	url: "api/blacklist"
});

var BreadCrumbView = Backbone.View.extend({

    tagName: 'ul',

    initialize:function () {

        if (!this.template) {
            this.template = _.template($('#tmpl-breadcrumbs').html());
        }

        this.$el.addClass('breadcrumb');

        this.collection.bind('add', this.render, this);
    },

    render:function () {

        this.$el.empty();
        var parent = this;

        // go through each of the breadcrumb models
        _.each(this.collection.models, function (crumb, index) {

            // if it's the last index in the crumbs then render the link inactive
            if (index == parent.collection.size() - 1) {
                crumb.set({active:true}, {silent:true});
            } else {
                crumb.set({active:false}, {silent:true});
            }

            this.$el.append(this.template(crumb.toJSON()));
        }, this);

        $('#breadcrumbs').html(this.el);
    }
});


var BlackListListView = Backbone.View.extend({
	tagName: 'span',
	
	initialize:function() {
		if (!this.template) {
			this.template = _.template($('#tmpl-blacklist-form').html());
		}
	},

	load:function(callback) {
    	if (this.model.isFetched) {
    		callback();
    		return;
    	}

    	$('#loadingbox').sheet('show');
    	$('#loading').html('blacklist');

    	$.when(this.model.fetchIfNeeded()).done(function() {
    	    		$('#loadingbox').sheet('hide');
    	    		callback();
    			});    	
    },
	
	events: {
        "click .refresh-table":"refreshTable"    		
	},

    refreshTable:function(e) {
    	e.preventDefault();
    	var _self = this;
    	$('#loadingbox').sheet('show');
    	$('#loading').html('blacklist');

    	$.when(this.model.fetch()).done(function() {
    	    		$('#loadingbox').sheet('hide');
    	    		_self.render();
    			});    	
    },	
	
	render:function (eventName) {
		
		$(this.el).html(this.template(this.model.toJSON()));
		
		$('#blacklist .controls', this.el).html(new BlackListWidgetView({
			placeholder: 'http://',
			collection: this.model
		}).render().el);
		
		return this;
	}
});

var BlackListWidgetView = ListWidgetView.extend({
	
	childView: ListWidgetChildView.extend({
		render:function() {
			var uri = this.model.get('uri');
			
			this.$el.html(this.template({item: uri}));

            if (uri.length > 30) {
                this.$el.tooltip({title:uri});
            }
            return this;
			
		}
	}),
	
	addItem:function(e) {
    	e.preventDefault();

    	var input_value = $("input", this.el).val().trim();
    	
    	// TODO: URI/pattern validation, check against existing clients
    	
    	var item = new BlackListModel({
    		uri: input_value
    	});
    	
    	var _self = this; // closures...
    	
    	item.save({}, {
    		success:function() {
    			_self.collection.add(item);
    		},
    		error:function(error, response) {
    			//Pull out the response text.
				var responseJson = JSON.parse(response.responseText);
        		
        		//Display an alert with an error message
        		$('#modalAlert div.modal-body').html(responseJson.errorMessage);
        		
    			 $("#modalAlert").modal({ // wire up the actual modal functionality and show the dialog
    				 "backdrop" : "static",
    				 "keyboard" : true,
    				 "show" : true // ensure the modal is shown immediately
    			 });
    		}
    	});

	}
	
});

// Stats table

var StatsModel = Backbone.Model.extend({
	url: "api/stats/byclientid"
});

// User Profile

var UserProfileView = Backbone.View.extend({
	tagName: 'span',
	
	initialize:function() {
        if (!this.template) {
            this.template = _.template($('#tmpl-user-profile-element').html());
        }
	},
	
	render:function() {
		
        $(this.el).html($('#tmpl-user-profile').html());

        _.each(this.model, function (value, key) {
        	if (key && value) {
	            $('dl', this.el).append(
	            		this.template({key: key, value: value})
	            	);
        	}
        }, this);
		
		return this;
	}
});

// Router
var AppRouter = Backbone.Router.extend({

    routes:{
        "admin/clients":"listClients",
        "admin/client/new":"newClient",
        "admin/client/:id":"editClient",

        "admin/whitelists":"whiteList",
        "admin/whitelist/new/:cid":"newWhitelist",
        "admin/whitelist/:id":"editWhitelist",
        
        "admin/blacklist":"blackList",
        
        "admin/scope":"siteScope",
        "admin/scope/new":"newScope",
        "admin/scope/:id":"editScope",
        
        "user/approved":"approvedSites",
        "user/tokens":"tokens",
        "user/profile":"profile",
        
        "dev/dynreg":"dynReg",
        "dev/dynreg/new":"newDynReg",
        "dev/dynreg/edit":"editDynReg",
        
        "": "root"
        	
    },
    
    root:function() {
    	if (isAdmin()) {
    		this.navigate('admin/clients', {trigger: true});
    	} else {
    		this.navigate('user/approved', {trigger: true});
    	}
    },
    
    initialize:function () {

        this.clientList = new ClientCollection();
        this.whiteListList = new WhiteListCollection();
        this.blackListList = new BlackListCollection();
        this.approvedSiteList = new ApprovedSiteCollection();
        this.systemScopeList = new SystemScopeCollection();
        this.clientStats = new StatsModel(); 
        this.accessTokensList = new AccessTokenCollection();
        this.refreshTokensList = new RefreshTokenCollection();
        
        this.clientListView = new ClientListView({model:this.clientList, stats: this.clientStats, systemScopeList: this.systemScopeList, whiteListList: this.whiteListList});
        this.whiteListListView = new WhiteListListView({model:this.whiteListList, clientList: this.clientList, systemScopeList: this.systemScopeList});
        this.approvedSiteListView = new ApprovedSiteListView({model:this.approvedSiteList, clientList: this.clientList, systemScopeList: this.systemScopeList});
        this.blackListListView = new BlackListListView({model:this.blackListList});
        this.systemScopeListView = new SystemScopeListView({model:this.systemScopeList});
        this.tokensListView = new TokenListView({model: {access: this.accessTokensList, refresh: this.refreshTokensList}, clientList: this.clientList, systemScopeList: this.systemScopeList});
    	this.dynRegRootView = new DynRegRootView({systemScopeList: this.systemScopeList});
        
        this.breadCrumbView = new BreadCrumbView({
            collection:new Backbone.Collection()
        });

        this.breadCrumbView.render();

        $('#loadingbox').sheet('show');
        $("#loading").html('<span class="label" id="loading-system">System Configuration</span>');
        var base = $('base').attr('href');
        $.getJSON(base + '.well-known/openid-configuration', function(data) {
        	app.serverConfiguration = data;
        	$('#loading-system').addClass('label-success');
        	var baseUrl = $.url(app.serverConfiguration.issuer);
			Backbone.history.start({pushState: true, root: baseUrl.attr('relative') + 'manage/'});
			$('#loadingbox').sheet('hide');
        });

    },

    listClients:function () {

    	if (!isAdmin()) {
    		this.root();
    		return;
    	}
    	
        this.breadCrumbView.collection.reset();
        this.breadCrumbView.collection.add([
            {text:"Home", href:""},
            {text:"Manage Clients", href:"manage/#admin/clients"}
        ]);

        this.clientListView.load(function() {
        	$('#content').html(app.clientListView.render().el);
        	app.clientListView.delegateEvents();
        	setPageTitle("Manage Clients");        	
        });

    },

    newClient:function() {

    	if (!isAdmin()) {
    		this.root();
    		return;
    	}

        this.breadCrumbView.collection.reset();
        this.breadCrumbView.collection.add([
            {text:"Home", href:""},
            {text:"Manage Clients", href:"manage/#admin/clients"},
            {text:"New", href:""}
        ]);

    	var client = new ClientModel();
    	
    	// set up this new client to require a secret and have us autogenerate one
    	client.set({
    		requireClientSecret:true, 
    		generateClientSecret:true,
    		displayClientSecret:false,
    		scope: _.uniq(_.flatten(this.systemScopeList.defaultScopes().pluck("value"))),
    		accessTokenValiditySeconds:3600,
    		idTokenValiditySeconds:600
    	}, { silent: true });
    	
        this.clientFormView = new ClientFormView({model:client, systemScopeList: this.systemScopeList});
        $('#content').html(this.clientFormView.render().el);
    	setPageTitle("New Client");
    },

    editClient:function(id) {

    	if (!isAdmin()) {
    		this.root();
    		return;
    	}

        this.breadCrumbView.collection.reset();
        this.breadCrumbView.collection.add([
            {text:"Home", href:""},
            {text:"Manage Clients", href:"manage/#admin/clients"},
            {text:"Edit", href:"manage/#admin/client/" + id}
        ]);

        var client = this.clientList.get(id);

        if (client.get("clientSecret") == null) {
        	client.set({
        		requireClientSecret:false
        	}, { silent: true });
        }
        
        if ($.inArray("refresh_token", client.get("grantTypes")) != -1) {
        	client.set({
        		allowRefresh: true
        	}, { silent: true });
        }
        
    	client.set({
    		generateClientSecret:false,
    		displayClientSecret:false
    	}, { silent: true });
        
        this.clientFormView = new ClientFormView({model:client, systemScopeList: this.systemScopeList});
        $('#content').html(this.clientFormView.render().el);
        
    	setPageTitle("Edit Client");
    },

    whiteList:function () {

    	if (!isAdmin()) {
    		this.root();
    		return;
    	}

    	this.breadCrumbView.collection.reset();
        this.breadCrumbView.collection.add([
            {text:"Home", href:""},
            {text:"Manage Whitelisted Sites", href:"manage/#admin/whitelists"}
        ]);
        
        var view = this.whiteListListView;
        
        view.load(
        	function() {
        		$('#content').html(view.render().el);
        		view.delegateEvents();
        		setPageTitle("Manage Whitelists");
        	}
        );
        

    },
    
    newWhitelist:function(cid) {

    	if (!isAdmin()) {
    		this.root();
    		return;
    	}

    	var client = this.clientList.get(cid);

        // if there's no client this is an error
        if (client != null) {

        	this.breadCrumbView.collection.reset();
            this.breadCrumbView.collection.add([
                {text:"Home", href:""},
                {text:"Manage Whitelisted Sites", href:"manage/#admin/whitelists"},
                {text:"Manage Whitelisted Sites", href:"manage/#admin/whitelist/new/" + cid}
            ]);
            
            var whiteList = new WhiteListModel();
            whiteList.set({
            	clientId: client.get('clientId'),
            	allowedScopes: client.get('scope')
            }, { silent: true });
            
        	this.whiteListFormView = new WhiteListFormView({model: whiteList, client: client, systemScopeList: this.systemScopeList});
        	$('#content').html(this.whiteListFormView.render().el);
        	setPageTitle("Create New Whitelist");
        } else {
        	console.log('ERROR: no client found for ' + cid);
        }
        
    	
    },
    
    editWhitelist:function(id) {

    	if (!isAdmin()) {
    		this.root();
    		return;
    	}

    	this.breadCrumbView.collection.reset();
        this.breadCrumbView.collection.add([
            {text:"Home", href:""},
            {text:"Manage Whitelisted Sites", href:"manage/#admin/whitelists"},
            {text:"Manage Whitelisted Sites", href:"manage/#admin/whitelist/" + id}
        ]);
        
        var whiteList = this.whiteListList.get(id);
        if (whiteList != null) {
            var client = app.clientList.getByClientId(whiteList.get('clientId'));
            
            // if there's no client, this is an error
            if (client != null) {
            	this.whiteListFormView = new WhiteListFormView({model: whiteList, client: client, systemScopeList: this.systemScopeList});
            	$('#content').html(this.whiteListFormView.render().el);
            	setPageTitle("Edit Whitelist");

            } else {
            	console.log('ERROR: no client found for ' + whiteList.get('clientId'));
            }
        } else {
        	console.error('ERROR: no whitelist found for id ' + id);
        }
    },
    
    approvedSites:function() {
    	this.breadCrumbView.collection.reset();
        this.breadCrumbView.collection.add([
            {text:"Home", href:""},
            {text:"Manage Approved Sites", href:"manage/#user/approve"}
        ]);

    	var view = this.approvedSiteListView;
    	
    	this.approvedSiteListView.load( 
    		function(collection, response, options) {
    			$('#content').html(view.render().el);
    	    	setPageTitle("Manage Approved Sites");
    		}
    	);
    	
    },

    tokens:function() {
    	this.breadCrumbView.collection.reset();
        this.breadCrumbView.collection.add([
            {text:"Home", href:""},
            {text:"Manage Active Tokens", href:"manage/#user/tokens"}
        ]);
        
        var view = this.tokensListView;
        
        view.load(
    		function(collection, response, options) {
				$('#content').html(view.render().el);
				setPageTitle("Manage Active Tokens");
    		}
        );
        
    },
    
    notImplemented:function(){
        this.breadCrumbView.collection.reset();
        this.breadCrumbView.collection.add([
            {text:"Home", href:""}
        ]);
    		$('#content').html("<h2>Not implemented yet.</h2>");
    },
    
    blackList:function() {

    	if (!isAdmin()) {
    		this.root();
    		return;
    	}

    	this.breadCrumbView.collection.reset();
        this.breadCrumbView.collection.add([
            {text:"Home", href:""},
            {text:"Manage Blacklisted Sites", href:"manage/#admin/blacklist"}
        ]);
        
        var view = this.blackListListView;
        
        view.load(
        	function(collection, response, options) {
        		$('#content').html(view.render().el);
            	setPageTitle("Manage Blacklist");
        	}
        );
    },
    
    siteScope:function() {

    	if (!isAdmin()) {
    		this.root();
    		return;
    	}

    	this.breadCrumbView.collection.reset();
    	this.breadCrumbView.collection.add([
             {text:"Home", href:""},
             {text:"Manage System Scopes", href:"manage/#admin/scope"}
        ]);
    	
    	var view = this.systemScopeListView;
    	
    	view.load(function() {
    		$('#content').html(view.render().el);
    		view.delegateEvents();
    		setPageTitle("Manage System Scopes");    		
    	});

    },
    
    newScope:function() {

    	if (!isAdmin()) {
    		this.root();
    		return;
    	}

    	this.breadCrumbView.collection.reset();
    	this.breadCrumbView.collection.add([
             {text:"Home", href:""},
             {text:"Manage System Scopes", href:"manage/#admin/scope"},
             {text:"New", href:"manage/#admin/scope/new"}
        ]);
    	
    	var scope = new SystemScopeModel();
    	
    	this.systemScopeFormView = new SystemScopeFormView({model:scope});
    	$('#content').html(this.systemScopeFormView.render().el);
    	setPageTitle("New System Scope");

    },
    
    editScope:function(sid) {

    	if (!isAdmin()) {
    		this.root();
    		return;
    	}

    	this.breadCrumbView.collection.reset();
    	this.breadCrumbView.collection.add([
             {text:"Home", href:""},
             {text:"Manage System Scopes", href:"manage/#admin/scope"},
             {text:"Edit", href:"manage/#admin/scope/" + sid}
        ]);

    	var scope = this.systemScopeList.get(sid);
    	
    	this.systemScopeFormView = new SystemScopeFormView({model:scope});
    	$('#content').html(this.systemScopeFormView.render().el);
    	setPageTitle("Edit System Scope");
    	
    },
    
    dynReg:function() {
    	this.breadCrumbView.collection.reset();
    	this.breadCrumbView.collection.add([
             {text:"Home", href:""},
             {text:"Client Registration", href:"manage/#dev/dynreg"}
        ]);
    	
    	$('#content').html(this.dynRegRootView.render().el);
    	
    	setPageTitle("Self-service Client Registration");
    },
    
    newDynReg:function() {
    	this.breadCrumbView.collection.reset();
    	this.breadCrumbView.collection.add([
             {text:"Home", href:""},
             {text:"Client Registration", href:"manage/#dev/dynreg"},
             {text:"New", href:"manage/#dev/dynreg/new"}
        ]);
    	
    	this.dynRegEditView = new DynRegEditView({model: new DynRegClient()});
    	$('#content').html(this.dynRegEditView.render().el);
    	
    	setPageTitle("Dynamically Register a New Client");
    },
    
    editDynReg:function() {
    	this.breadCrumbView.collection.reset();
    	this.breadCrumbView.collection.add([
             {text:"Home", href:""},
             {text:"Client Registration", href:"manage/#dev/dynreg"},
             {text:"Edit", href:"manage/#dev/dynreg/new"}
        ]);
    	
    	setPageTitle("Edit a Dynamically Registered Client");
    	// note that this doesn't actually load the client, that's supposed to happen elsewhere...
    },
    
    profile:function() {
    	this.breadCrumbView.collection.reset();
    	this.breadCrumbView.collection.add([
             {text:"Home", href:""},
             {text:"Profile", href:"manage/#user/profile"}
        ]);
    
    	this.userProfileView = new UserProfileView({model: getUserInfo()});
    	$('#content').html(this.userProfileView.render().el);
    	
    	setPageTitle("View User Profile");
    	
    }


});

// holds the global app.
// this gets init after the templates load
var app = null;

// main
$(function () {

    jQuery.ajaxSetup({async:false});

    var _load = function (templates) {
        $('body').append(templates);
    };

    // load templates and append them to the body
    $.get('resources/template/admin.html', _load);
    $.get('resources/template/client.html', _load);
    $.get('resources/template/grant.html', _load);
    $.get('resources/template/scope.html', _load);
    $.get('resources/template/whitelist.html', _load);
    $.get('resources/template/dynreg.html', _load);
    $.get('resources/template/token.html', _load);
    
    jQuery.ajaxSetup({async:true});
    app = new AppRouter();

    // grab all hashed URLs and send them through the app router instead
    $(document).on('click', 'a[href^="manage/#"]', function(event) {
    	event.preventDefault();
    	app.navigate(this.hash.slice(1), {trigger: true});
    });
    
});



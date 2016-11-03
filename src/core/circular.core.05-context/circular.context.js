/* ----------------------
	context
----------------------- */

new CircularModule('context',{

	config				: {
		root		: 'document',
		debug		: false
	},
	
	settings 			: {
		requiremods		: ['log']
	},

	attributes		: [{
	
		name : 'cc-context',
		in	: function(ccattr,node,ccnode) {
			return this.in(ccattr,node,ccnode);
		},
		out	: function(ccattr,node,ccnode) {
			return this.out(ccattr,node,ccnode);
		}
		
		
	},{
	
		name : 'cc-root',
		in	: function(ccattr,node,ccnode) {
			return this.in(ccattr,node,ccnode);
		},
		out	: function(ccattr,node,ccnode) {
			return this.out(ccattr,node,ccnode);
		}
		
	}],
	
	init				: function() {
		this.set(this.config.root);
	},
	
	// ------------------
	
	
	
	current			: '',

	in	: function(ccattr,node,ccnode) {
		
		ccattr.properties.ctxbefore = Circular.context.get();
		if (ccattr.content.expression) {
			this.debug('cc-context.in','setting context expr',ccattr.content.expression);
			if (typeof ccattr.content.result=='string') {
				this.debug('cc-context.in','using result literal',ccattr.content.value);
				Circular.context.set(ccattr.content.value);
			} else {
				Circular.context.set(ccattr.content.expression);
			}
		} else {
			this.debug('cc-context.in','setting context value',ccattr.content.value);
			Circular.context.set(ccattr.content.value);

		}
	},
	
	out	: function(ccattr,node,ccnode) {
		this.debug('cc-context.out','resetting context');
		Circular.context.set(ccattr.properties.ctxbefore);
		delete ccattr.properties.ctxbefore;
	},
	
	set		: function(context) {
			this.current = context;
	},
	get		: function() {
			return this.current;
	},
	debug	: function() {
		if (this.config.debug) {
			Circular.log.debug.apply(Circular.log,arguments);
		}
	}
	
});

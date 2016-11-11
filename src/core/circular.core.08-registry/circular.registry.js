/* ----------------------
	registry
----------------------- */

new CircularModule('registry', {

	
	config				: {
		debug	: false
	},
	
	settings 			: {
		requiremodss	: ['log']
	},

	attributes		: {},
	
	init					: function() { return true; },
	
	// ------------------
	
	
	counter	: 0,
	
	newCCNode 	: function() {
		return {
			'flags'	: {
				'pristine'					: true,
				'registered'				: false,
				'watched'						: false,
				'domobserved'				: false,
				'dataobserved'			: false,
				'processing'				: false,
				'processedin'				: false,
				'processedout'			: false,
				'attrsetchanged'		: true,
				'contentchanged'		: true,
				'contentchanged:i'	: false,
				'contentchanged'		: true,
				'ocontextchanged'		: true,
				'icontextchanged'		: true,
				'attrdomchanged'		: true,
				'attrdatachanged'		: true,
				'recurse'						: true
			},
			'properties'	: {
				'outercontext'	: '',
				'innercontext'	: '',
				'contentchanged:p'	: 0
			},
			'attributes'			:	{},		// attrs by name -> attributes
			'index'						: [],		// attrs by index -> indexed
		};
	} ,
	
	newCCattribute 	: function(name) {
		return {
			'flags'			: {
				'parsed'						: false,
				'registered'				: false,
				'attrdomchanged'		: true,
				'attrdomchanged:i'	: false,
				'attrdatachanged'		: true,
				'attrdatachanged:i'	: false,
				'breaking'					: false
			},
			'properties'			: {
				'name'							: name,
				'module'						: '',
				'attrdomchanged:p'	: 0,
				'attrdatachanged:p'	: 0
			},
			'content'	: {
				'original'					: '',
				'expression'				: '',
				'result'						: undefined,
				'value'							: '',
				'oldpaths'					: [],
				'paths'							: []
			}
		}
	},

	lock	: function(node) {
		var ccnode = this.get(node,true);
		ccnode.flags.locked=true;
		this.set(node,ccnode);
	},
	
	unlock	: function(node) {
		ccnode = $(node).data('cc-node');
		ccnode.flags['locked']=false;
		// unset the flags youve set before recycle
		ccnode.flags['processing'] 			= false;
		ccnode.flags['attrsetchanged'] 	= false;
		ccnode.flags['contentchanged'] 	= false;
		ccnode.flags['ocontextchanged'] = false;
		ccnode.flags['icontextchanged'] = false;
		ccnode.flags['attrdomchanged'] 	= false;
		ccnode.flags['attrdatachanged'] = false;
		for (var ac=0; ac<ccnode.index.length; ac++) {
			ccnode.index[ac].flags['attrdomchanged'] = false;
			ccnode.index[ac].flags['attrdatachanged'] = false;
			//alert(ccnode.index[ac].properties.name+' eq '+(ccnode.index[ac]===ccnode.attributes[ccnode.index[ac].properties.name]));
		}
		$(node).data('cc-node',ccnode);
		
	},
	

	set	: function(node,ccnode,watch) {
		this.debug('@registry.set');
		if (!ccnode.flags.registered) {
			ccnode.flags.pristine = false;
			ccnode.flags.registered = true;
			this.counter++;
		}
		for (var ac=0;ac<ccnode.index.length;ac++) {
			ccnode.index[ac].flags.registered=true;
		}
		if (watch) {
			this.debug('@registry.set','watch',node);
			Circular.watchdog.watch(node,ccnode);
		}
		$(node).data('cc-node',ccnode);
	},
	
	get	: function(node,readonly) {
		this.debug('Circular.registry.get');
		// this should perhaps return a deep copy instead ..
		var ccnode = $(node).data('cc-node');
		if (!ccnode) ccnode = this.newCCNode();
		if (!ccnode.flags.locked || readonly) {
			return ccnode;
		} else {
			Circular.log.error('@registry.get','Node is locked',node);
		}
	},
	
	debug	: function() {
		if (this.config.debug) {
			Circular.log.debug.apply(Circular.log,arguments);
		}
	}	
	
	
	
});
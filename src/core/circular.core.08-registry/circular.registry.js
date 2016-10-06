/* ----------------------
	registry
----------------------- */

new CircularModule({

	name		: 'registry',
	requires	: ['log','debug'],
	counter	: 0,
	
	newCCNode 	: function() {
		return {
			'flags'	: {
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
				'contextchanged'		: true,
				'attrdomchanged'		: true,
				'attrdatachanged'		: true
			},
			'properties'	: {
				'outercontext'	: '',
				'innercontext'	: '',
				'contentchanged:p'	: 0
			},
			'attributes'								:	{},		// attrs by name -> attributes
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
		ccnode = $(node).data('cc-properties');
		ccnode.flags.locked=false;
		$(node).data('cc-properties',ccnode);
	},
	

	set	: function(node,ccnode,watch) {
		//Circular.debug.write('@registry.set');
		if (!ccnode.flags.registered) {
			ccnode.flags.registered = true;
			this.counter++;
		}
		for (var ac=0;ac<ccnode.index.length;ac++) {
			ccnode.index[ac].flags.registered=true;
		}
		if (watch) {
			Circular.debug.write('@registry.set','watch',node);
			Circular.watchdog.watch(node,ccnode);
		}
		$(node).data('cc-properties',ccnode);
	},
	
	get	: function(node,readonly) {
		// Circular.debug.write('Circular.registry.get');
		// this should perhaps return a deep copy instead ..
		var ccnode = $(node).data('cc-properties');
		if (!ccnode) ccnode = this.newCCNode();
		if (!ccnode.flags.locked || readonly) {
			return ccnode;
		} else {
			Circular.log.error('@registry.get','Node is locked',node);
		}
	}
	
	
	
});
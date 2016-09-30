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
				'contentchanged:p'	: 0,
				'contentchanged:i'	: false,
				'contentchanged'		: true,
				'contextchanged'		: true,
				'attrdomchanged'		: true,
				'attrdatachanged'		: true
			},
			'props'	: {
				'outercontext'	: '',
				'innercontext'	: ''
			},
			'ccattrs'								:	{},		// attrs by name
			'ccattrlist'						: [],		// attrs by index
		};
	} ,
	
	newCCattribute 	: function(name) {
		return {
			'flags'			: {
				'parsed'						: false,
				'registered'				: false,
				'attrdomchanged'		: true,
				'attrdomchanged:p'	: 0,
				'attrdomchanged:i'	: false,
				'attrdatachanged'		: true,
				'attrdatachanged:p'	: 0,
				'attrdatachanged:i'	: false,
				'breaking'					: false
			},
			'props'			: {
				'name'				: name,
				'module'			: '',
				'original'		: '',
				'expression'	: '',
				'result'			: undefined,
				'value'				: ''
			},
			'oldpaths'		: [],
			'paths'				: [],		

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
		for (var ac=0;ac<ccnode.ccattrlist.length;ac++) {
			ccnode.ccattrlist[ac].flags.registered=true;
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
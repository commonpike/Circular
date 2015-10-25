/* ----------------------
	registry
----------------------- */

new CircularModule({

	name		: 'registry',
	requires	: ['log','debug'],
	counter	: 0,
	
	newProperties 	: function() {
		return {
			'flags'	: {
				'registered'				: false,
				'processing'				: false,
				'processedin'				: false,
				'processedout'			: false,
				'contentchanged'		: true,
				'contentchanged:p'	: 0,
				'contentchanged:i'	: false,
				'contentchanged'		: true,
				'contextchanged'		: true,
				'attrdomchanged'		: true,
				'attrdatachanged'		: true
			},
			'outercontext'	: '',
			'innercontext'	: '',
			'attributes'		: [],		// todo: reverse naming
			'name2attr'			: {}		// todo: reverse naming
		};
	} ,
	
	newAttribute 	: function(name) {
		return {
			'name'				: name,
			'module'			: '',
			'original'		: '',
			'expression'	: '',
			'result'			: undefined,
			'value'				: '',
			'paths'				: [],		// todo: rename to watch
			'flags'			: {
				'registered'				: false,
				'attrdomchanged'		: true,
				'attrdomchanged:p'	: 0,
				'attrdomchanged:i'	: false,
				'attrdatachanged'		: true,
				'attrdatachanged:p'	: 0,
				'attrdatachanged:i'	: false,
				'breaking'					: false
			}
		}
	} ,

	lock	: function(node) {
		var props = this.get(node,true);
		props.flags.locked=true;
		this.set(node,props);
	},
	
	unlock	: function(node) {
		props = $(node).data('cc-properties');
		props.flags.locked=false;
		$(node).data('cc-properties',props);
	},
	
	set	: function(node,props,watch) {
		Circular.debug.write('Circular.registry.set');
		if (!props.flags.registered) {
			props.flags.registered = true;
			this.counter++;
		}
		if (watch) {
			Circular.debug.write('Circular.registry.set','watch',node);
			Circular.watchdog.watch(node,props);
		}
		$(node).data('cc-properties',props);
	},
	
	get	: function(node,force) {
		// Circular.debug.write('Circular.registry.get');
		// this should perhaps return a deep copy instead ..
		var props = $(node).data('cc-properties');
		if (!props) props = this.newProperties();
		if (!props.flags.locked || force) {
			return props;
		} else {
			Circular.log.error('Circular.registry.get','Node is locked',node);
		}
	}
	
	
	
});
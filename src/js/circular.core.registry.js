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

	processed			: function(node,props) {
		Circular.debug.write('Circular.registry.processed');
		props.flags = {
			'registered'				: true,
			'processing'				: false,
			'contentchanged'		: false,
			'contextchanged'		: false,
			'attrdomchanged'		: false,
			'attrdatachanged'		: false
		};
		for (var ac=0; ac<props.attributes.length; ac++) {
			props.attributes[ac].flags = {
				'attrdomchanged'	: false,
				'attrdatachanged'	: false,
				'breaking'				: false
			};
		}
	},
	
	add	: function(node,props) {
		Circular.debug.write('Circular.registry.add');
		if (props.flags.registered) {
			return this.update(node,props);
		}
		this.counter++;
		props.flags.registered=true;
		this.processed(node,props);
		$(node).data('cc-properties',props);
		// notify the watchdog of changes
		if (Circular.watchdog) {
			Circular.watchdog.watch(node,props);
		}
		return props;
	},
	
	update	: function(node,props) {
		Circular.debug.write('Circular.registry.update',node,props);
		if (!props.flags.registered) {
			return this.add(node,props);
		}
		this.processed(node,props);
		$(node).data('cc-properties',props);
		// notify the watchdog of changes
		if (Circular.watchdog) {
			Circular.watchdog.watch(node,props);
		}
		return props;
	},
	
	
	set	: function(node,props) {
		//Circular.debug.write('Circular.registry.set');
		$(node).data('cc-properties',props);
	},
	
	get	: function(node) {
		//Circular.debug.write('Circular.registry.get');
		var props = $(node).data('cc-properties');
		if (!props) props = this.newProperties();
		return props;
	}
	
	
	
});
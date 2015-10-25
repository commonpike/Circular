/* ----------------------
	context
----------------------- */

new CircularModule({

	name				: 'context',
	requires		: ['debug'],
	current			: '',
	
	in	: function(attr,node,props) {
		Circular.debug.write('mod.context.in','setting context',attr.value);
		attr.before = this.get();
		if (!attr.expression || typeof attr.result == "string") {
			this.set(attr.value);
		} else {
			Circular.log.warn('mod.context.in','Context should be a string - using expression instead');
			this.set(attr.expression);
		}
	},
	
	out	: function(attr,node,props) {
		Circular.debug.write('mod.context.out','resetting context');
		this.set(attr.before);
		delete attr.before;
	},
	
	set		: function(context) {
			this.current = context;
	},
	get		: function() {
			return this.current;
	}
		
		
});

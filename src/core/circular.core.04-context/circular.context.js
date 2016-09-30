/* ----------------------
	context
----------------------- */

new CircularModule({

	name				: 'context',
	requires		: ['debug'],
	config			: {
		rootcontext		: 'document'
	},
	current			: '',
	
	init				: function() {
		this.set(Circular.config.rootcontext);
	},
	
	in	: function(ccattr,node,ccnode) {
		Circular.debug.write('mod.context.in','setting context',ccattr.value);
		ccattr.before = this.get();
		if (ccattr.expression) {
			this.set(ccattr.expression);
		} else {
			Circular.debug.write('mod.context.in','No expression, using value');
			this.set(ccattr.value);
		}
	},
	
	out	: function(ccattr,node,ccnode) {
		Circular.debug.write('mod.context.out','resetting context');
		this.set(ccattr.before);
		delete ccattr.before;
	},
	
	set		: function(context) {
			this.current = context;
	},
	get		: function() {
			return this.current;
	}
		
		
});

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
		
		ccattr.before = this.get();
		if (ccattr.expression) {
			Circular.debug.write('mod.context.in','setting context expr',attr.expression);
			console.log(attr);
			if (typeof ccattr.result=='string') {
				Circular.debug.write('mod.context.in','using value',ccattr.value);
				this.set(ccattr.value);
			} else {
				this.set(ccattr.expression);
			}
		} else {
			Circular.debug.write('mod.context.in','setting context value',ccattr.value);
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

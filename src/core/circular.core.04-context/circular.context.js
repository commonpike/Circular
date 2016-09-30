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
	
	in	: function(attr,node,props) {
		
		attr.before = this.get();
		if (attr.expression) {
			Circular.debug.write('mod.context.in','setting context expr',attr.expression);
			console.log(attr);
			if (typeof attr.result=='string') {
				Circular.debug.write('mod.context.in','using value',attr.value);
				this.set(attr.value);
			} else {
				this.set(attr.expression);
			}
		} else {
			Circular.debug.write('mod.context.in','setting context value',attr.value);
			this.set(attr.value);
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

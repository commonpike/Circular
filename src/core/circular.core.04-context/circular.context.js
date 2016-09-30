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
		if (ccattr.props.expression) {
			Circular.debug.write('mod.context.in','setting context expr',ccattr.props.expression);
			//console.log(attr);
			if (typeof ccattr.props.result=='string') {
				Circular.debug.write('mod.context.in','using value',ccattr.props.value);
				this.set(ccattr.props.value);
			} else {
				this.set(ccattr.props.expression);
			}
		} else {
			Circular.debug.write('mod.context.in','setting context value',ccattr.props.value);
			this.set(ccattr.props.value);

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

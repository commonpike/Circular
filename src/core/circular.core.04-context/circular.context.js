/* ----------------------
	context
----------------------- */

new CircularModule({

	name				: 'context',
	requires		: ['log'],
	config			: {
		rootcontext		: 'document'
	},
	current			: '',
	
	init				: function() {
		this.set(Circular.config.rootcontext);
	},
	
	in	: function(ccattr,node,ccnode) {
		
		ccattr.before = this.get();
		if (ccattr.content.expression) {
			Circular.log.debug('mod.context.in','setting context expr',ccattr.content.expression);
			//console.log(attr);
			if (typeof ccattr.content.result=='string') {
				Circular.log.debug('mod.context.in','using value',ccattr.content.value);
				this.set(ccattr.content.value);
			} else {
				this.set(ccattr.content.expression);
			}
		} else {
			Circular.log.debug('mod.context.in','setting context value',ccattr.content.value);
			this.set(ccattr.content.value);

		}
	},
	
	out	: function(ccattr,node,ccnode) {
		Circular.log.debug('mod.context.out','resetting context');
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

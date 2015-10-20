/* ----------------------
	context
----------------------- */

new CircularModule({

	name				: 'context',
	requires		: ['debug'],
	current			: '',
	
	in	: function(attr,node,props) {
		Circular.debug.write('mod.context.in','setting context',attr.expression);
		attr.before = this.get();
		Circular.context.set(attr.expression);
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

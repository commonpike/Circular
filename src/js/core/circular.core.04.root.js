
/* ----------------------
	root
----------------------- */

new CircularModule({
	name				: 'root',
	requires		: ['context','debug'],
	
	in	: function(attr,node,props) {
		Circular.debug.write('mod.root.in','setting context',attr.expression);
		attr.before = Circular.context.get();
		Circular.context.set(attr.expression);
	},
	
	out	: function(attr,node,props) {
		Circular.debug.write('mod.root.out','resetting context');
		Circular.context.set.set(attr.before);
		delete attr.before;
	},
	
	
		
});

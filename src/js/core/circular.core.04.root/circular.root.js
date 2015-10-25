
/* ----------------------
	root
----------------------- */

new CircularModule({
	name				: 'root',
	requires		: ['context','debug'],
	
	in	: function(attr,node,props) {
		if (!attr.value) attr.value = Circular.context.get();
		Circular.debug.write('mod.root.in','setting context',attr.value);
		attr.before = Circular.context.get();
		Circular.context.set(attr.value);
	},
	
	out	: function(attr,node,props) {
		if (attr.value) {
			Circular.debug.write('mod.root.out','resetting context');
			Circular.context.set(attr.before);
			delete attr.before;
		}
	},
	
	
		
});

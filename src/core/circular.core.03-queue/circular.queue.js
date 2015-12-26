
/* ----------------------
	queue
----------------------- */

new CircularModule({

	name				: 'queue',
	requires		: ['debug'],

	todo	: [],
	
	
	add		: function(func) {
		Circular.debug.write("Circular.queue.add",this.todo.length);
		this.todo.push(func);
		if (this.todo.length==1) this.next();
	}, 
	
	next	: function() {
		if (!Circular.dead) {
			if (this.todo.length) {
				Circular.debug.write("Circular.queue.next",this.todo.length);
				this.todo[this.todo.length-1]();
				this.todo.pop();
				this.next();
			} else {
				Circular.debug.write("Circular.queue.next","all done.");
			}
		} else {
			Circular.debug.write("Circular.queue.next","dead");
		}
	}
		
});

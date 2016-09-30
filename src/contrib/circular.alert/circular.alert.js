
/* ----------------------
	alert
----------------------- */

new CircularModule({

	name			: 'alert',
	
	in	: function(ccattr,node,ccnode) {
		alert('in: '+ccattr.result||ccattr.value)
	},
	out	: function(ccattr,node,ccnode) {
		alert('out: '+ccattr.result||ccattr.value)
	}

	
		
});





/* ----------------------
	alert
----------------------- */

new CircularModule({

	name			: 'alert',
	
	in	: function(ccattr,ccnode,node) {
		alert('in: '+ccattr.content.result||ccattr.content.value)
	},
	out	: function(ccattr,ccnode,node) {
		alert('out: '+ccattr.content.result||ccattr.content.value)
	}

	
		
});




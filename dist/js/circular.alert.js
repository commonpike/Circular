
/* ----------------------
	alert
----------------------- */

new CircularModule({

	name			: 'alert',
	
	in	: function(ccattr,node,ccnode) {
		alert('in: '+ccattr.content.result||ccattr.content.value)
	},
	out	: function(ccattr,node,ccnode) {
		alert('out: '+ccattr.content.result||ccattr.content.value)
	}

	
		
});




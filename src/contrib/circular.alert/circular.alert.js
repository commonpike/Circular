
/* ----------------------
	alert
----------------------- */

new CircularModule({

	name			: 'alert',
	
	in	: function(attr,node,props) {
		alert('in: '+attr.value)
	},
	out	: function(attr,node,props) {
		alert('out: '+attr.value)
	}

	
		
});





/* ----------------------
	alert
----------------------- */

new CircularModule({

	name			: 'alert',
	
	in	: function(attr,node,props) {
		alert('in: '+attr.result)
	},
	out	: function(attr,node,props) {
		alert('out: '+attr.result)
	}

	
		
});




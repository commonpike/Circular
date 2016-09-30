
/* ----------------------
	alert
----------------------- */

new CircularModule({

	name			: 'alert',
	
	in	: function(ccattr,node,ccnode) {
		alert('in: '+ccattr.props.result||ccattr.props.value)
	},
	out	: function(ccattr,node,ccnode) {
		alert('out: '+ccattr.props.result||ccattr.props.value)
	}

	
		
});





/* ----------------------
	content
----------------------- */

new CircularModule('content',{

	config				: {
	
	},
	
	settings 			: {
		requiremods	: ['log'],
		insertcss		: ['.cc-content-generated {  }']
	},

	attributes		: [{
		name 	: 'cc-content',
		in		: function(ccattr,node,ccnode) {
			val = ccattr.content.value;
			Circular.log.debug('cc-content.in','setting content',val);
			node.textContent=val;
			$(node).addClass('cc-content-generated');
		},
		filter	: function(value) {
			if (value.length>16) return value.substring(0,16)+'...';
			return value;
		}
	}]
	
		
});

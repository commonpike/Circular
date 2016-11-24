
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

	attributes		: {
		'cc-content' : {
			in		: function(ccattr,ccnode,node) {
				val = ccattr.content.value;
				Circular.log.debug('@content','cc-content','setting content',val);
				node.textContent=val;
				$(node).addClass('cc-content-generated');
			},
			sanitize	: function(value) {
				if (value.length>16) return value.substring(0,16)+'(...)';
				return value;
			}
		}
	}
	
		
});


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
			//if (val.length>16) {
			//	Circular.watchdog.pass(node,'attrdomchanged',ccattr.properties.name);
			//	node.setAttribute('cc-content',val.substring(0,16)+'..')
			//}
			Circular.log.debug('cc-content.in','setting content',val);
			node.textContent=val;
			$(node).addClass('cc-content-generated');
		}
	}]
	
		
});

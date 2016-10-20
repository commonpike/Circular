
/* ----------------------
	content
----------------------- */

new CircularModule({

	name				: 'content',
	requires		: ['log'],
	
	css		: '.cc-content-generated {  }',

	in	: function(ccattr,node,ccnode) {
		var val = ccattr.content.result;
		if (val==undefined) val = ccattr.content.value;
		Circular.log.debug('@content.in','setting content',val);
		node.textContent=val;
		//$(node).addClass('cc-content-generated');
	}

		
});

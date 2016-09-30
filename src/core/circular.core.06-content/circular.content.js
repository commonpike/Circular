
/* ----------------------
	content
----------------------- */

new CircularModule({

	name				: 'content',
	requires		: ['debug'],
	
	css		: '.cc-content-generated {  }',
	in	: function(ccattr,node,ccnode) {
		var val = ccattr.result;
		if (val==undefined) val = ccattr.value;
		Circular.debug.write('mod.content.in','setting content',val);
		node.textContent=val;
		$(node).addClass('cc-content-generated');
	}

		
});

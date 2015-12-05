
/* ----------------------
	content
----------------------- */

new CircularModule({

	name				: 'content',
	requires		: ['debug'],
	
	css		: '.cc-content-generated {  }',
	in	: function(attr,node,props) {
		var val = attr.result;
		if (val==undefined) val = attr.value;
		Circular.debug.write('mod.content.in','setting content',val);
		node.textContent=val;
		$(node).addClass('cc-content-generated');
	}

		
});

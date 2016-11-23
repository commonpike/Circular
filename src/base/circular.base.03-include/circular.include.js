
/* ----------------------
	template
----------------------- */

new CircularModule('include',{

	settings		: {
		insertcss: ['.cc-template, [cc-template=""]{ display:none; }']
	},
	
	attributes	: {
		'cc-include' : {
			in	: function(ccattr,ccnode,node) {
				Circular.log.debug('cc-include.in',node);
				
				
			}
		
		}
	},
	
	comments	: {
		'include'	: function(comment,arg) {
			Circular.log.debug('@include',arg);
			$.ajax(arg).done(function(data) {
				Circular.log.debug('@include',arg,'success');
				var node =null;
				if (Circular.modules.attrprefix!='cc-' && data.indexOf('cc-')!=-1) {
					Circular.log.debug('@include','prefixing cc-');
					var $node = $(data);
					$node.find('*').each(function(idx1, child) {
						$.each(child.attributes, function( idx2, attr ) {
                if(attr.name.indexOf('cc-')===0) {
                   child.setAttribute(Circular.modules.prefix(attr.name),child.getAttribute(attr.name));
                   child.removeAttribute(attr.name);
                }
            });
					});
					node = $node.get(0);
				} else {
					node = $(data).get(0);
 				}
 				comment.parentNode.insertBefore(node,comment);
				comment.parentNode.removeChild(comment);
 			}).fail(function(data) {
 				Circular.log.debug('@include',arg,'fail',data);
 				var node = document.createComment('ERROR: @include[JSON.stringify]');
 				comment.parentNode.insertBefore(node,comment);
				comment.parentNode.removeChild(comment);
 			});
		}
	},
	// -------------
	
	load	: function(url) {
		$.get(url)
 			.success(function(data) {
     		
 });
	}
	
	
		
});





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
				var node = $(data).get(0);
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





/* ----------------------
	template
----------------------- */

new CircularModule('include',{

	settings		: {
		insertcss: [
			'.cc-include-pending { visibility:hidden; }',
		]
	},
	
	attributes	: {
		'cc-include' : {
			in	: function(ccattr,ccnode,node) {
				if (ccattr.content.result) {
					Circular.include.insert(node,ccattr.content.result);
				} else {
					Circular.include.insert(node,ccattr.content.value);
				}
			}
		},
		'cc-include-transclude' : {
			// ignore
		}
		
	},
	
	comments	: {
		'include'	: function(comment,arg) {
			Circular.include.replace(comment,arg);
		}
	},
	
	// -------------
	
	$stack	: null,
	
	insert	: function(parent,arg) {
		if (arg) {
			$(parent).addClass('cc-include-pending');
	
			$.ajax(arg).done(function(data) {
				Circular.log.debug('@include','insert',arg,'success');
				var $nodes = $(data);
				Circular.include.prefix($nodes);
				var $parent = $(parent);
				Circular.include.createTranscludeBase($parent);
				$parent.empty().append($nodes);
				$(parent).removeClass('cc-include-pending');
				
			}).fail(function(data) {
				Circular.log.debug('@include','insert','fail',data);
				var node = document.createComment('ERROR: @include.insert '+JSON.stringify(data));
				$(parent).prepend(node);
				$(parent).removeClass('cc-include-pending');
			});
		} else {
			Circular.log.error('@include','insert','no argument');
		}
	},
	
	replace	: function(orgnode,arg) {
		if (arg) {
			Circular.log.debug('@include','replace',arg);
			$.ajax(arg).done(function(data) {
				Circular.log.debug('@include','replace',arg,'success');
				var $nodes = $(data);
				Circular.include.prefix($nodes);
				$nodes.get().reverse().forEach(function(node) {
					orgnode.parentNode.insertBefore(node,orgnode);
				});
				orgnode.parentNode.removeChild(orgnode);
			}).fail(function(data) {
				Circular.log.debug('@include','replace','fail',data);
				var node = document.createComment('ERROR: @include.replace '+JSON.stringify(data));
				orgnode.parentNode.insertBefore(node,orgnode);
				orgnode.parentNode.removeChild(orgnode);
			});
			
		} else {
			Circular.log.error('@include','insert','no argument');
		}		
	},
	
	// ----------------
	
	prefix	: function($nodes) {
		if (Circular.modules.attrprefix!='cc-' && data.indexOf('cc-')!=-1) {
			Circular.log.debug('@include','prefix');
			$nodes.find('*').each(function(idx1, child) {
				$.each(child.attributes, function( idx2, attr ) {
						if(attr.name.indexOf('cc-')===0) {
							 child.setAttribute(Circular.modules.prefix(attr.name),child.getAttribute(attr.name));
							 child.removeAttribute(attr.name);
						}
				});
			});
		} 
	},
	
	createTranscludeBase	: function($node) {
		var tbasename = Circular.modules.prefix('cc-transclude-base');
		var tbase 		= $node.attr(tbasename);
		if (!tbase) {
			if ($node.children().length) {
				Circular.log.debug('@include','createTranscludeBase');
				if (!this.$stack) {
					Circular.log.debug('@include','createTranscludeBase','creating stack');
					Circular.engine.stack('<div id="cc-include-stack">');
					this.$stack = $('#cc-include-stack');
				}
				var $trans = $('<div cc-include-transclude>');
				var transid = Circular.engine.nodeid($trans);
				Circular.engine.stack($trans,this.$stack);
				Circular.log.debug('@include','createTranscludeBase','appending children',transid);
				$node.children().appendTo($trans);
				$node.attr(tbasename,'#'+transid);
			} else {
				$node.attr(tbasename,'#none#');
			}
		}
	}
		
});




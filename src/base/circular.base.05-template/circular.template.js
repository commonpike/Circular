
/* ----------------------
	template
----------------------- */

new CircularModule('template',{

	settings		: {
		insertcss = ['cc-template-source,[cc-template=""]{ display:none; }']
	},
	
	attributes	: {
	
		'cc-template' : {
			in : : function(ccattr,ccnode,node) {
				Circular.log.debug('@template','cc-template.in',node);
				var tplsel = ccattr.content.value;
				var $node = $(node);
				if (tplsel) {
					// include the template if it isnt already
					if (!$node.children('[cc-template-origin="'+tplsel+'"]').size()==1) {
						var $tpl = $(tplsel);
						if ($tpl.length) {
							// todo: create tranclude-base
							$node.empty();
							$tpl.clone().appendTo($node)
								.removeattr('id')
								.removeattr('cc-template')
								.removeattr('cc-template-source')
								.attr('cc-template-origin',tplsel)
						} else {
							Circular.log.error('@template','cc-template.in','no such template',tplsel);
						}
					} else {
						Circular.log.debug('@template','cc-template.in','already included');
					}
					
				} else {
					// this is a template, ignore
					Circular.log.debug('@template','cc-template.in','is a template');
					node.removeattr('cc-template').attr('cc-template-source');
					return false;
				}
			}
		},
		'cc-template-source'	: {
			in	: function() {
				return false;	// dont process this
			}
		},
		'cc-template-origin'	: {}
		
	},
	
	comments : {
		'cc:template' : function() {
		
		}
	}
	
		
});




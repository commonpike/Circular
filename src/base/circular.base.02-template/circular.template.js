
/* ----------------------
	template
----------------------- */

new CircularModule({

	name				: 'template',
	requires		: ['debug','engine'],
	attributes	: ['cc-template'],
	css					: '.cc-template, [cc-template=""]{ display:none; }',

	orgattr			: 'cc-template-origin',
	
	in	: function(ccattr,node,ccnode) {
		Circular.debug.write('@template.in',node);
		var tplsel = ccattr.content.value;
		var $node = $(node);
		if (tplsel) {
			// include the template if it isnt already
			if (!$node.children('['+this.orgattr+'="'+tplsel+'"]').size()==1) {
				var $tpl = $(tplsel);
				if ($tpl.size()) {
					Circular.watchdog.pass(node,'contentchanged');
					$node.empty().addClass('cc-template-included');
					$tpl.clone().appendTo($node)
						.removeattr('id')
						.removeattr('cc-template')
						.attr(this.orgattr,tplsel)
						.removeClass('cc-template')
						.addClass('cc-template-clone');
				} else {
					Circular.log.error('@template.in','no such template',tplsel);
				}
			} else {
				Circular.debug.write('@template.in','already included');
			}
			
		} else {
			// this is a template, ignore
			Circular.debug.write('@template.in','is a template');
			$node.addClass('cc-template');
			return false;
		}
	}

	
		
});




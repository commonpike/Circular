
/* ----------------------
	@if
----------------------- */

new CircularModule('if',{

	
	
	attributes	: {
	
		'cc-if' : {
			in	: function(ccattr,ccnode,node) {
				
				// see if there is an else
				if (ccnode.flags.pristine) {
					var $else = $(node).siblings('[cc-else]').eq(0);
					if ($else.size()) {
						var enid=Circular.engine.nodeid($else);
						Circular.log.debug('@if','cc-if','found else',enid);
						ccattr.properties.elseref='#'+enid;
					}
				}
				
				// update else if needed
				if (ccattr.flags.attrdomchanged && ccattr.properties.elseref) {
					Circular.log.debug('@if','cc-if','updating else');
					$(ccattr.properties.elseref).attr(Circular.modules.prefix('cc-else'),ccattr.content.original);
				}
				
				// manage if
				if (Circular.parser.boolish(ccattr.content.value)) {
					Circular.log.debug('@if','cc-if','eject.unflag',node);
					Circular.eject.unflag(node,ccnode,'cc-if');
					return true;
				} else {
					Circular.log.debug('@if','cc-if','eject.flag',node);
					Circular.eject.flag(node,ccnode,'cc-if');
					return false;
				}
			}
		},
		
		'cc-else': {
			in	: function(ccattr,ccnode,node) {
				
				// manage else
				if (!Circular.parser.boolish(ccattr.content.value)) {
					Circular.log.debug('@if','cc-else','eject.unflag',node);
					Circular.eject.unflag(node,ccnode,'cc-else');
					return true;
				} else {
					Circular.log.debug('@if','cc-else','eject.flag',node);
					Circular.eject.flag(node,ccnode,'cc-else');
					return false;
				}
				
			}
		}
	}
	
	
		
});



